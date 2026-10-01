/**
 * @jest-environment node
 */
import { createHmac } from "crypto";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { issueAvailabilityToken } from "@/actions/issue-launcher-token";
import { executeAvailabilityRequest } from "@/lib/launcher-availability";
import {
  executeLauncherToolRequest,
  executeTargetBoundLauncherRequest,
} from "@/lib/launcher-execution";
import { checkToolAvailability } from "@/lib/mylaunch";
import {
  classifyLauncherToken,
  LAUNCHER_TOKEN_USE_AVAILABILITY,
  LAUNCHER_TOKEN_VERSION_AVAILABILITY,
  signAvailabilityToken,
  signTargetBoundLauncherToken,
  verifyAvailabilityToken,
  type TargetBoundPayload,
} from "@/lib/launcher-token";
import { signLegacyV1Fixture } from "./legacy-v1-fixture";

jest.mock("@/auth", () => ({
  auth: jest.fn(),
}));

jest.mock("@/lib/db", () => ({
  db: {
    harptools: { findFirst: jest.fn() },
    user: { findUnique: jest.fn() },
  },
}));

jest.mock("@/lib/prisma", () => ({
  __esModule: true,
  default: {},
}));

const SECRET = "secret-de-test-uniquement";
const sessionAuth = auth as jest.Mock;
const findTool = db.harptools.findFirst as jest.Mock;
const findUser = db.user.findUnique as jest.Mock;

function signRaw(payload: unknown) {
  const body = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const signature = createHmac("sha256", SECRET).update(body).digest("base64url");
  return `${body}.${signature}`;
}

function tamper(token: string, mutate: (payload: Record<string, unknown>) => void) {
  const [body, signature] = token.split(".");
  const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as Record<string, unknown>;
  mutate(payload);
  return `${Buffer.from(JSON.stringify(payload), "utf8").toString("base64url")}.${signature}`;
}

function payloadOf(token: string) {
  return JSON.parse(Buffer.from(token.split(".")[0], "base64url").toString("utf8")) as Record<string, unknown>;
}

const hostile = {
  ip: "10.9.9.9",
  host: "srvB",
  aliasql: "DB_B",
  ptversion: "8.60",
  queryNetid: "bob",
};

describe("disponibilité d'outil", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.AUTH_SECRET = SECRET;
    process.env.NEXT_PUBLIC_API_URL = "http://portal.test";
    sessionAuth.mockResolvedValue({ user: { id: "7", netid: "alice" } });
    findUser.mockResolvedValue({ id: 7, netid: "alice" });
    findTool.mockImplementation(async ({ where }: { where: { tool: string } }) => ({
      tool: where.tool,
      cmdpath: "C:\\apps",
      cmd: `${where.tool}.exe`,
      cmdarg: "cible-libre",
      descr: where.tool,
      version: null,
    }));
  });

  it("émet un jeton de disponibilité sans cible", async () => {
    const issued = await issueAvailabilityToken("putty");
    expect(issued.success).toBe(true);
    if (!issued.success) return;
    expect(payloadOf(issued.token)).toEqual(
      expect.objectContaining({
        v: LAUNCHER_TOKEN_VERSION_AVAILABILITY,
        use: LAUNCHER_TOKEN_USE_AVAILABILITY,
        netid: "alice",
        tool: "putty",
      })
    );
    expect(payloadOf(issued.token)).not.toHaveProperty("ip");
    expect(payloadOf(issued.token)).not.toHaveProperty("aliasql");
    expect(payloadOf(issued.token)).not.toHaveProperty("ptversion");
    expect(payloadOf(issued.token)).not.toHaveProperty("envId");
    expect(payloadOf(issued.token)).not.toHaveProperty("hostname");
    expect(classifyLauncherToken(issued.token, SECRET)).toMatchObject({ ok: true, kind: "availability" });
  });

  it("refuse l'émission sans session", async () => {
    sessionAuth.mockResolvedValue(null);
    const issued = await issueAvailabilityToken("putty");
    expect(issued).toEqual({ success: false, error: "Non authentifié" });
    expect(issued).not.toHaveProperty("token");
  });

  it("accepte un outil configuré et ignore les cibles de query", async () => {
    const token = signAvailabilityToken({ netid: "alice", tool: "putty" }, SECRET);
    const result = await executeAvailabilityRequest({
      token,
      tool: "putty",
      secret: SECRET,
      ...hostile,
    });
    expect(result.status).toBe(200);
    expect(result.body.success).toBe(true);
    expect(result.body.availability).toBe(true);
    expect(result.body.path).toBe("C:\\apps\\putty.exe");
    expect(result.body.cmdarg).toBeUndefined();
    expect(JSON.stringify(result.body)).not.toContain("10.9.9.9");
    expect(JSON.stringify(result.body)).not.toContain("DB_B");
    expect(JSON.stringify(result.body)).not.toContain("8.60");
    expect(JSON.stringify(result.body)).not.toContain("srvB");
    expect(JSON.stringify(result.body)).not.toContain("cible-libre");
  });

  it("refuse un outil absent et une commande vide", async () => {
    const token = signAvailabilityToken({ netid: "alice", tool: "putty" }, SECRET);
    findTool.mockResolvedValueOnce(null);
    const missing = await executeAvailabilityRequest({ token, tool: "putty", secret: SECRET });
    expect(missing.status).toBe(404);
    expect(missing.body.error).toBe("Outil 'putty' non trouvé dans la base de données");

    findTool.mockResolvedValueOnce({
      tool: "putty",
      cmdpath: "C:\\apps",
      cmd: "  ",
      descr: "PuTTY",
      version: null,
    });
    const empty = await executeAvailabilityRequest({ token, tool: "putty", secret: SECRET });
    expect(empty.status).toBe(400);
    expect(String(empty.body.error)).toContain("n'a pas de commande");
  });

  it("refuse le même jeton sur les chemins d'exécution", async () => {
    const issued = await issueAvailabilityToken("filezilla");
    expect(issued.success).toBe(true);
    if (!issued.success) return;
    findTool.mockClear();

    const executed = await executeLauncherToolRequest({
      token: issued.token,
      tool: "filezilla",
      secret: SECRET,
      ...hostile,
    });
    const legacy = await executeLauncherToolRequest({
      token: issued.token,
      tool: "filezilla",
      secret: SECRET,
      ip: "10.9.9.9",
    });
    const bound = await executeTargetBoundLauncherRequest({
      token: issued.token,
      tool: "filezilla",
      secret: SECRET,
      ip: "10.9.9.9",
    });

    expect(executed.status).toBe(403);
    expect(executed.body.error).toBe("Jeton de disponibilité refusé");
    expect(legacy.status).toBe(403);
    expect(legacy.body.error).toBe("Jeton de disponibilité refusé");
    expect(bound.status).toBe(403);
    expect(executed.body.cmdarg).toBeUndefined();
    expect(findTool).not.toHaveBeenCalled();
  });

  it("refuse un outil modifié, un jeton expiré et un scope incorrect", async () => {
    const token = signAvailabilityToken({ netid: "alice", tool: "putty" }, SECRET);
    const forgedTool = await executeAvailabilityRequest({
      token: tamper(token, (payload) => {
        payload.tool = "filezilla";
      }),
      tool: "filezilla",
      secret: SECRET,
    });
    expect(forgedTool.status).toBe(401);

    const expired = await executeAvailabilityRequest({
      token: signRaw({
        v: LAUNCHER_TOKEN_VERSION_AVAILABILITY,
        use: LAUNCHER_TOKEN_USE_AVAILABILITY,
        netid: "alice",
        tool: "putty",
        exp: Math.floor(Date.now() / 1000) - 5,
      }),
      tool: "putty",
      secret: SECRET,
    });
    expect(expired.status).toBe(401);
    expect(expired.body.error).toBe("Jeton expiré");

    const wrongScope = await executeAvailabilityRequest({
      token: signRaw({
        v: LAUNCHER_TOKEN_VERSION_AVAILABILITY,
        use: "launch",
        netid: "alice",
        tool: "putty",
        exp: Math.floor(Date.now() / 1000) + 60,
      }),
      tool: "putty",
      secret: SECRET,
    });
    expect(wrongScope.status).toBe(401);
    expect(verifyAvailabilityToken(signRaw({ v: 9, use: "availability", netid: "alice", tool: "putty", exp: 9 }), SECRET).ok).toBe(false);
    expect(findTool).not.toHaveBeenCalled();
  });

  it("refuse une cible ajoutée au jeton de disponibilité", async () => {
    const token = signRaw({
      v: LAUNCHER_TOKEN_VERSION_AVAILABILITY,
      use: LAUNCHER_TOKEN_USE_AVAILABILITY,
      netid: "alice",
      tool: "sqlplus",
      exp: Math.floor(Date.now() / 1000) + 60,
      aliasql: "DB_B",
    });
    const result = await executeAvailabilityRequest({ token, tool: "sqlplus", secret: SECRET });
    expect(result.status).toBe(401);
    expect(findTool).not.toHaveBeenCalled();
  });

  it("n'accepte ni un v1 ni un v2 comme contrôle de disponibilité", async () => {
    const legacy = signLegacyV1Fixture({ netid: "alice", tool: "putty" }, SECRET);
    const bound = signTargetBoundLauncherToken(
      {
        v: 2,
        targetType: "server",
        envId: 9,
        serverId: 5,
        tool: "putty",
        hostname: "srvA",
        ip: "10.1.1.1",
        netid: "alice",
        exp: Math.floor(Date.now() / 1000) + 60,
      } as TargetBoundPayload,
      SECRET
    );
    expect((await executeAvailabilityRequest({ token: legacy, tool: "putty", secret: SECRET })).status).toBe(401);
    expect((await executeAvailabilityRequest({ token: bound, tool: "putty", secret: SECRET })).status).toBe(401);
    expect(findTool).not.toHaveBeenCalled();
  });

  it("ne traite pas un v1 marqué availability comme un lancement", async () => {
    const token = signRaw({
      v: 1,
      use: LAUNCHER_TOKEN_USE_AVAILABILITY,
      netid: "alice",
      tool: "putty",
      exp: Math.floor(Date.now() / 1000) + 60,
    });
    const result = await executeLauncherToolRequest({
      token,
      tool: "putty",
      secret: SECRET,
      ip: "10.9.9.9",
    });
    expect(result.status).toBe(401);
    expect(result.body.cmdarg).toBeUndefined();
    expect(findTool).not.toHaveBeenCalled();
  });

  it("checkToolAvailability interroge la disponibilité sans cible libre", async () => {
    const fetchMock = jest.fn(async (url: string) => ({
      ok: true,
      json: async () => ({ success: true, availability: true, tool: "pside" }),
    }));
    global.fetch = fetchMock as unknown as typeof fetch;

    const result = await checkToolAvailability("pside", "bob", {
      ptversion: "8.60",
      aliasql: "DB_B",
      ip: "10.9.9.9",
    });

    expect(result.success).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const url = String(fetchMock.mock.calls[0][0]);
    expect(url.startsWith("http://portal.test/api/launcher/availability?")).toBe(true);
    expect(url).not.toContain("aliasql");
    expect(url).not.toContain("ptversion");
    expect(url).not.toContain("ip=");
    expect(url).not.toContain("/api/launcher/tool");
    const token = new URL(url).searchParams.get("token") ?? "";
    expect(payloadOf(token).use).toBe(LAUNCHER_TOKEN_USE_AVAILABILITY);
    expect(payloadOf(token).v).not.toBe(1);
  });

  it("checkToolAvailability remonte l'absence de session et l'outil non configuré", async () => {
    const fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;
    sessionAuth.mockResolvedValue(null);
    const anonymous = await checkToolAvailability("putty", "alice");
    expect(anonymous.success).toBe(false);
    expect(anonymous.error).toBe("Non authentifié");
    expect(fetchMock).not.toHaveBeenCalled();

    sessionAuth.mockResolvedValue({ user: { id: "7", netid: "alice" } });
    fetchMock.mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Outil 'putty' non trouvé dans la base de données" }),
    });
    const missing = await checkToolAvailability("putty", "alice");
    expect(missing.success).toBe(false);
    expect(missing.error).toBe("Outil 'putty' non trouvé dans la base de données");
  });
});

describe("frontière legacy restante", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.AUTH_SECRET = SECRET;
    sessionAuth.mockResolvedValue({ user: { id: "7", netid: "alice" } });
    findUser.mockResolvedValue({ id: 7, pkeyfile: null, netid: "alice" });
    findTool.mockImplementation(async ({ where }: { where: { tool: string } }) => ({
      tool: where.tool,
      cmdpath: "C:\\apps",
      cmd: `${where.tool}.exe`,
      cmdarg: "",
      descr: where.tool,
      version: null,
    }));
  });

  it("n'émet plus de jeton v1 et refuse un v1 signé à la consommation", async () => {
    const source = require("fs").readFileSync(
      require("path").join(process.cwd(), "actions/issue-launcher-token.ts"),
      "utf8"
    );
    expect(source).not.toContain("function issueLauncherToken");
    const signed = signLegacyV1Fixture({ netid: "alice", tool: "sqldeveloper" }, SECRET);
    const legacy = await executeLauncherToolRequest({
      token: signed,
      tool: "sqldeveloper",
      secret: SECRET,
    });
    const bound = await executeTargetBoundLauncherRequest({
      token: signed,
      tool: "sqldeveloper",
      secret: SECRET,
    });
    expect(legacy.status).toBe(403);
    expect(legacy.body.path).toBeUndefined();
    expect(bound.status).toBe(403);
    expect(findTool).not.toHaveBeenCalled();
  });
});
