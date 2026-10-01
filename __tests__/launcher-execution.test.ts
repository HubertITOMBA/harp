/**
 * @jest-environment node
 */
import { createHmac } from "crypto";
import { auth } from "@/auth";
import { getAllUserRoles } from "@/actions/get-all-user-roles";
import prisma from "@/lib/prisma";
import { db } from "@/lib/db";
import { issueTargetBoundLauncherToken } from "@/actions/issue-launcher-token";
import {
  executeLauncherToolRequest,
  executeTargetBoundLauncherRequest,
} from "@/lib/launcher-execution";
import {
  LAUNCHER_TOKEN_VERSION_LEGACY,
  LAUNCHER_TOKEN_VERSION_TARGET,
  signTargetBoundLauncherToken,
  type TargetBoundPayload,
} from "@/lib/launcher-token";
import { signLegacyV1Fixture } from "./legacy-v1-fixture";

jest.mock("@/auth", () => ({
  auth: jest.fn(),
}));

jest.mock("@/actions/get-all-user-roles", () => ({
  getAllUserRoles: jest.fn(),
}));

jest.mock("@/lib/prisma", () => ({
  __esModule: true,
  default: {
    envsharp: { findUnique: jest.fn() },
    harpserve: { findUnique: jest.fn() },
    harpenvserv: { findFirst: jest.fn() },
    harprolesubrole: { findMany: jest.fn() },
    harpuserscope: { findMany: jest.fn() },
  },
}));

jest.mock("@/lib/db", () => ({
  db: {
    harptools: { findFirst: jest.fn() },
    user: { findUnique: jest.fn() },
  },
}));

const SECRET = "secret-de-test-uniquement";
const sessionAuth = auth as jest.Mock;
const roles = getAllUserRoles as jest.Mock;
const findEnv = prisma.envsharp.findUnique as jest.Mock;
const findServer = prisma.harpserve.findUnique as jest.Mock;
const findLink = prisma.harpenvserv.findFirst as jest.Mock;
const findGrants = prisma.harprolesubrole.findMany as jest.Mock;
const findScopes = prisma.harpuserscope.findMany as jest.Mock;
const findTool = db.harptools.findFirst as jest.Mock;
const findUser = db.user.findUnique as jest.Mock;

const hostileQuery = {
  ip: "10.9.9.9",
  host: "srvB",
  aliasql: "DB_B",
  ptversion: "8.60",
  queryNetid: "bob",
};

function signRaw(payload: unknown, secret = SECRET) {
  const body = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const signature = createHmac("sha256", secret).update(body).digest("base64url");
  return `${body}.${signature}`;
}

function tamper(token: string, mutate: (payload: Record<string, unknown>) => void) {
  const [body, signature] = token.split(".");
  const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as Record<string, unknown>;
  mutate(payload);
  const next = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  return `${next}.${signature}`;
}

function futureExp() {
  return Math.floor(Date.now() / 1000) + 60;
}

function serverPayload(tool: "putty" | "filezilla", overrides: Record<string, unknown> = {}): TargetBoundPayload {
  return {
    v: LAUNCHER_TOKEN_VERSION_TARGET,
    targetType: "server",
    envId: 9,
    serverId: 5,
    tool,
    hostname: "srvA",
    ip: "10.1.1.1",
    netid: "alice",
    exp: futureExp(),
    ...overrides,
  } as TargetBoundPayload;
}

function envPayload(
  tool: "sqlplus" | "pside" | "psdmt",
  overrides: Record<string, unknown> = {}
): TargetBoundPayload {
  const base = {
    v: LAUNCHER_TOKEN_VERSION_TARGET,
    targetType: "environment" as const,
    envId: 9,
    tool,
    aliasql: "DB_A",
    netid: "alice",
    exp: futureExp(),
  };
  if (tool === "sqlplus") {
    return { ...base, ...overrides } as TargetBoundPayload;
  }
  return { ...base, ptversion: "8.61", ...overrides } as TargetBoundPayload;
}

function sign(payload: TargetBoundPayload) {
  return signTargetBoundLauncherToken(payload, SECRET);
}

async function consume(token: string, tool: string, extra: Record<string, unknown> = {}) {
  return executeLauncherToolRequest({
    token,
    tool,
    secret: SECRET,
    ...hostileQuery,
    ...extra,
  });
}

describe("exécution target-bound", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.AUTH_SECRET = SECRET;
    findTool.mockImplementation(async ({ where }: { where: { tool: string } }) => ({
      tool: where.tool,
      cmdpath: "C:\\apps",
      cmd: `${where.tool}.exe`,
      cmdarg: "",
      descr: where.tool,
      version: null,
    }));
    findUser.mockResolvedValue({ pkeyfile: "C:\\keys\\alice.ppk" });
  });

  it("PuTTY ignore ip, hostname et compte de la query", async () => {
    const result = await consume(sign(serverPayload("putty")), "putty");
    expect(result.status).toBe(200);
    expect(result.body.launchHost).toBe("10.1.1.1");
    expect(result.body.hostname).toBe("srvA");
    expect(result.body.ip).toBe("10.1.1.1");
    expect(result.body.netid).toBe("alice");
    expect(result.body.serverId).toBe(5);
    expect(JSON.stringify(result.body)).not.toContain("10.9.9.9");
    expect(JSON.stringify(result.body)).not.toContain("srvB");
    expect(JSON.stringify(result.body)).not.toContain("bob");
  });

  it("PuTTY sans IP signée utilise le hostname signé", async () => {
    const result = await consume(
      sign(serverPayload("putty", { ip: "", hostname: "srvA" })),
      "putty"
    );
    expect(result.status).toBe(200);
    expect(result.body.launchHost).toBe("srvA");
  });

  it("FileZilla ignore l'IP de la query", async () => {
    const result = await consume(sign(serverPayload("filezilla")), "filezilla");
    expect(result.status).toBe(200);
    expect(String(result.body.cmdarg)).toContain("sftp://alice@10.1.1.1:22/");
    expect(String(result.body.cmdarg)).not.toContain("10.9.9.9");
    expect(String(result.body.cmdarg)).not.toContain("bob");
  });

  it("SQL*Plus ignore aliasql de la query", async () => {
    const result = await consume(sign(envPayload("sqlplus")), "sqlplus");
    expect(result.status).toBe(200);
    expect(result.body.cmdarg).toBe("/@DB_A");
  });

  it("PSIDE ignore aliasql et ptversion de la query", async () => {
    const result = await consume(sign(envPayload("pside")), "pside");
    expect(result.status).toBe(200);
    expect(result.body.cmdarg).toBe("-CT ORACLE -CD DB_A");
    expect(String(result.body.path)).toContain("pt861");
    expect(result.body.ptversion).toBe("8.61");
    expect(String(result.body.path)).not.toContain("pt860");
  });

  it("PSDMT ignore aliasql et ptversion de la query", async () => {
    const result = await consume(sign(envPayload("psdmt")), "psdmt");
    expect(result.status).toBe(200);
    expect(result.body.cmdarg).toBe("-CT ORACLE -CD DB_A");
    expect(String(result.body.path)).toContain("pt861");
    expect(result.body.ptversion).toBe("8.61");
  });

  it.each([
    ["envId", (payload: Record<string, unknown>) => { payload.envId = 99; }],
    ["serverId", (payload: Record<string, unknown>) => { payload.serverId = 88; }],
    ["tool", (payload: Record<string, unknown>) => { payload.tool = "filezilla"; }],
    ["hostname", (payload: Record<string, unknown>) => { payload.hostname = "srvB"; }],
    ["ip", (payload: Record<string, unknown>) => { payload.ip = "10.9.9.9"; }],
    ["netid", (payload: Record<string, unknown>) => { payload.netid = "bob"; }],
    ["exp", (payload: Record<string, unknown>) => { payload.exp = futureExp() + 9999; }],
  ])("refuse un jeton PuTTY dont %s est modifié sans nouvelle signature", async (_field, mutate) => {
    const token = tamper(sign(serverPayload("putty")), mutate);
    const result = await consume(token, "putty");
    expect(result.status).toBe(401);
    expect(result.body.cmdarg).toBeUndefined();
    expect(findTool).not.toHaveBeenCalled();
  });

  it.each([
    ["envId", (payload: Record<string, unknown>) => { payload.envId = 99; }],
    ["tool", (payload: Record<string, unknown>) => { payload.tool = "pside"; }],
    ["aliasql", (payload: Record<string, unknown>) => { payload.aliasql = "DB_B"; }],
    ["netid", (payload: Record<string, unknown>) => { payload.netid = "bob"; }],
    ["exp", (payload: Record<string, unknown>) => { payload.exp = futureExp() + 9999; }],
  ])("refuse un jeton SQL*Plus dont %s est modifié sans nouvelle signature", async (_field, mutate) => {
    const token = tamper(sign(envPayload("sqlplus")), mutate);
    const result = await consume(token, "sqlplus");
    expect(result.status).toBe(401);
    expect(findTool).not.toHaveBeenCalled();
  });

  it.each(["aliasql", "ptversion"] as const)(
    "refuse un jeton PSIDE dont %s est modifié sans nouvelle signature",
    async (field) => {
      const token = tamper(sign(envPayload("pside")), (payload) => {
        payload[field] = field === "aliasql" ? "DB_B" : "8.60";
      });
      const result = await consume(token, "pside");
      expect(result.status).toBe(401);
      expect(findTool).not.toHaveBeenCalled();
    }
  );

  it("refuse un jeton v2 expiré avant toute commande", async () => {
    const token = signRaw({ ...serverPayload("putty"), exp: Math.floor(Date.now() / 1000) - 5 });
    const result = await consume(token, "putty");
    expect(result.status).toBe(401);
    expect(result.body.error).toBe("Jeton expiré");
    expect(result.body.cmdarg).toBeUndefined();
    expect(findTool).not.toHaveBeenCalled();
  });

  it.each([
    ["environment", "putty"],
    ["environment", "filezilla"],
    ["server", "sqlplus"],
    ["server", "pside"],
    ["server", "psdmt"],
  ] as const)("refuse targetType %s avec l'outil %s", async (targetType, tool) => {
    const token = signRaw({
      v: 2,
      targetType,
      envId: 9,
      serverId: 5,
      tool,
      hostname: "srvA",
      ip: "10.1.1.1",
      aliasql: "DB_A",
      ptversion: "8.61",
      netid: "alice",
      exp: futureExp(),
    });
    const result = await executeTargetBoundLauncherRequest({
      token,
      tool,
      secret: SECRET,
      ...hostileQuery,
    });
    expect(result.status).toBe(401);
    expect(findTool).not.toHaveBeenCalled();
  });

  it("refuse un jeton absent, une signature fausse, une version inconnue et un payload incomplet", async () => {
    const absent = await executeLauncherToolRequest({ token: null, tool: "putty", secret: SECRET });
    expect(absent.status).toBe(401);
    const forged = await consume(`${sign(serverPayload("putty")).split(".")[0]}.signature-fausse`, "putty");
    expect(forged.status).toBe(401);
    const unknown = await consume(signRaw({ ...serverPayload("putty"), v: 9 }), "putty");
    expect(unknown.status).toBe(401);
    expect(unknown.body.error).toBe("Version de jeton inconnue");
    const incomplete = await consume(signRaw({ v: 2, targetType: "server", tool: "putty", exp: futureExp() }), "putty");
    expect(incomplete.status).toBe(401);
    const unsupported = await consume(signRaw({ ...serverPayload("putty"), tool: "winscp" }), "winscp");
    expect(unsupported.status).toBe(401);
    expect(findTool).not.toHaveBeenCalled();
  });

  it("refuse un outil annoncé différent de celui du jeton", async () => {
    const result = await consume(sign(serverPayload("putty")), "filezilla");
    expect(result.status).toBe(403);
    expect(findTool).not.toHaveBeenCalled();
  });

  it("refuse un jeton v1 sur le chemin target-bound", async () => {
    const legacy = signLegacyV1Fixture({ netid: "alice", tool: "putty" }, SECRET);
    const result = await executeTargetBoundLauncherRequest({
      token: legacy,
      tool: "putty",
      secret: SECRET,
      ip: "10.9.9.9",
      host: "srvB",
    });
    expect(result.status).toBe(403);
    expect(result.body.error).toBe("Jeton legacy refusé");
    expect(findTool).not.toHaveBeenCalled();
  });

  it("n'interprète pas un jeton v2 comme un jeton v1", async () => {
    const result = await executeLauncherToolRequest({
      token: sign(serverPayload("putty")),
      tool: "putty",
      secret: SECRET,
      ip: "10.9.9.9",
      host: "srvB",
    });
    expect(result.status).toBe(200);
    expect(result.body.error).not.toBe("Jeton legacy refusé");
    expect(result.body.launchHost).toBe("10.1.1.1");
    expect(JSON.stringify(result.body)).not.toContain("10.9.9.9");
  });

  it("refuse un jeton v1 signé sans construire la commande", async () => {
    const legacy = signLegacyV1Fixture({ netid: "alice", tool: "filezilla" }, SECRET);
    const result = await executeLauncherToolRequest({
      token: legacy,
      tool: "filezilla",
      secret: SECRET,
      ip: "10.9.9.9",
    });
    expect(result.status).toBe(403);
    expect(result.body.error).toBe("Jeton legacy refusé");
    expect(result.body.cmdarg).toBeUndefined();
    expect(result.body.path).toBeUndefined();
    expect(findTool).not.toHaveBeenCalled();
    const body = JSON.parse(Buffer.from(legacy.split(".")[0], "base64url").toString("utf8")) as { v: number };
    expect(body.v).toBe(LAUNCHER_TOKEN_VERSION_LEGACY);
  });
});

describe("émission puis consommation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.AUTH_SECRET = SECRET;
    sessionAuth.mockResolvedValue({ user: { id: "7", netid: "alice" } });
    roles.mockResolvedValue(["TMA_LOCAL"]);
    findEnv.mockResolvedValue({
      id: 9,
      typenvid: 11,
      scopeId: 41,
      aliasql: "ALIAS_DB",
      ptversion: "8.61",
    });
    findGrants.mockResolvedValue([
      {
        harproles: { role: "TMA_LOCAL" },
        harpsubrole: { active: true, harpsubroletypenv: [{ typenvid: 11 }] },
      },
    ]);
    findScopes.mockResolvedValue([{ harpscope: { id: 41, code: "4K" } }]);
    findServer.mockResolvedValue({ id: 5, srv: "srvA", ip: "10.1.1.1" });
    findLink.mockResolvedValue({ id: 100 });
    findTool.mockImplementation(async ({ where }: { where: { tool: string } }) => ({
      tool: where.tool,
      cmdpath: "C:\\apps",
      cmd: `${where.tool}.exe`,
      cmdarg: "",
      descr: where.tool,
      version: null,
    }));
    findUser.mockResolvedValue({ pkeyfile: "C:\\keys\\alice.ppk" });
  });

  it("enchaîne un hôte autorisé jusqu'à la commande signée", async () => {
    const issued = await issueTargetBoundLauncherToken({
      targetType: "server",
      envId: 9,
      serverId: 5,
      tool: "putty",
    });
    expect(issued.success).toBe(true);
    if (!issued.success) return;
    const result = await consume(issued.token, "putty");
    expect(result.status).toBe(200);
    expect(result.body.launchHost).toBe("10.1.1.1");
    expect(result.body.hostname).toBe("srvA");
    expect(result.body.targetBound).toBe(true);
  });

  it("enchaîne un environnement autorisé jusqu'à l'alias signé", async () => {
    const issued = await issueTargetBoundLauncherToken({
      targetType: "environment",
      envId: 9,
      tool: "sqlplus",
    });
    expect(issued.success).toBe(true);
    if (!issued.success) return;
    const result = await consume(issued.token, "sqlplus");
    expect(result.status).toBe(200);
    expect(result.body.cmdarg).toBe("/@ALIAS_DB");
  });
});
