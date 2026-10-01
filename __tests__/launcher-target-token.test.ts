/**
 * @jest-environment node
 */
import { createHmac } from "crypto";
import { auth } from "@/auth";
import { getAllUserRoles } from "@/actions/get-all-user-roles";
import prisma from "@/lib/prisma";
import { issueTargetBoundLauncherToken } from "@/actions/issue-launcher-token";
import {
  classifyLauncherToken,
  LAUNCHER_TOKEN_TTL_SECONDS,
  verifyTargetBoundLauncherToken,
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
  db: { user: { findUnique: jest.fn() } },
}));

const SECRET = "secret-de-test-uniquement";
const sessionAuth = auth as jest.Mock;
const roles = getAllUserRoles as jest.Mock;
const findEnv = prisma.envsharp.findUnique as jest.Mock;
const findServer = prisma.harpserve.findUnique as jest.Mock;
const findLink = prisma.harpenvserv.findFirst as jest.Mock;
const findGrants = prisma.harprolesubrole.findMany as jest.Mock;
const findScopes = prisma.harpuserscope.findMany as jest.Mock;

function grant(typenvid: number) {
  return {
    harproles: { role: "TMA_LOCAL" },
    harpsubrole: { active: true, harpsubroletypenv: [{ typenvid }] },
  };
}

function asUser(userRoles: string[] | null, netid = "alice") {
  if (userRoles == null) {
    sessionAuth.mockResolvedValue(null);
    roles.mockResolvedValue([]);
    return;
  }
  sessionAuth.mockResolvedValue({ user: { id: "7", netid } });
  roles.mockResolvedValue(userRoles);
}

function envRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 9,
    typenvid: 11,
    scopeId: 41,
    aliasql: "ALIAS_DB",
    ptversion: "8.61",
    ...overrides,
  };
}

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

function payloadOf(token: string): TargetBoundPayload {
  const verified = verifyTargetBoundLauncherToken(token, SECRET);
  if (!verified.ok) {
    throw new Error(verified.reason);
  }
  return verified.payload;
}

describe("émission d'un jeton lié à la cible", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.AUTH_SECRET = SECRET;
    asUser(["TMA_LOCAL"]);
    findEnv.mockResolvedValue(envRow());
    findGrants.mockResolvedValue([grant(11)]);
    findScopes.mockResolvedValue([{ harpscope: { id: 41, code: "4K" } }]);
    findServer.mockResolvedValue({ id: 5, srv: "srvA", ip: "10.1.1.1" });
    findLink.mockResolvedValue({ id: 100 });
  });

  it("signe PuTTY avec l'hôte relu et le netid de session", async () => {
    const issued = await issueTargetBoundLauncherToken({
      targetType: "server",
      envId: 9,
      serverId: 5,
      tool: "putty",
      ip: "9.9.9.9",
      hostname: "pirate",
    } as never);
    expect(issued.success).toBe(true);
    if (!issued.success) return;
    const payload = payloadOf(issued.token);
    expect(payload).toMatchObject({
      v: 2,
      targetType: "server",
      envId: 9,
      serverId: 5,
      tool: "putty",
      hostname: "srvA",
      ip: "10.1.1.1",
      netid: "alice",
    });
    expect(payload.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
    expect(payload.exp).toBeLessThanOrEqual(Math.floor(Date.now() / 1000) + LAUNCHER_TOKEN_TTL_SECONDS);
    expect(classifyLauncherToken(issued.token, SECRET)).toMatchObject({ ok: true, kind: "target-bound" });
  });

  it("signe FileZilla avec la même IP serveur", async () => {
    const issued = await issueTargetBoundLauncherToken({
      targetType: "server",
      envId: 9,
      serverId: 5,
      tool: "filezilla",
    });
    expect(issued.success).toBe(true);
    if (!issued.success) return;
    expect(payloadOf(issued.token)).toMatchObject({
      v: 2,
      tool: "filezilla",
      envId: 9,
      serverId: 5,
      ip: "10.1.1.1",
      hostname: "srvA",
      netid: "alice",
    });
  });

  it("signe SQL*Plus avec l'alias de la ligne, pas celui du client", async () => {
    const issued = await issueTargetBoundLauncherToken({
      targetType: "environment",
      envId: 9,
      tool: "sqlplus",
      aliasql: "ALIAS_CLIENT",
    } as never);
    expect(issued.success).toBe(true);
    if (!issued.success) return;
    expect(payloadOf(issued.token)).toEqual(
      expect.objectContaining({
        v: 2,
        targetType: "environment",
        envId: 9,
        tool: "sqlplus",
        aliasql: "ALIAS_DB",
        netid: "alice",
      })
    );
    expect(payloadOf(issued.token)).not.toHaveProperty("ptversion");
  });

  it.each(["pside", "psdmt"] as const)("signe %s avec la version et l'alias relus", async (tool) => {
    const issued = await issueTargetBoundLauncherToken({
      targetType: "environment",
      envId: 9,
      tool,
      ptversion: "8.99",
      aliasql: "AUTRE",
    } as never);
    expect(issued.success).toBe(true);
    if (!issued.success) return;
    expect(payloadOf(issued.token)).toMatchObject({
      envId: 9,
      tool,
      aliasql: "ALIAS_DB",
      ptversion: "8.61",
      netid: "alice",
    });
  });

  it("reste réutilisable jusqu'à expiration, sans registre de nonce", async () => {
    const issued = await issueTargetBoundLauncherToken({
      targetType: "environment",
      envId: 9,
      tool: "sqlplus",
    });
    if (!issued.success) throw new Error("émission attendue");
    expect(verifyTargetBoundLauncherToken(issued.token, SECRET).ok).toBe(true);
    expect(verifyTargetBoundLauncherToken(issued.token, SECRET).ok).toBe(true);
  });

  it.each([
    ["famille", () => findEnv.mockResolvedValue(envRow({ typenvid: 13 }))],
    ["scope", () => findScopes.mockResolvedValue([{ harpscope: { id: 52, code: "150K" } }])],
    ["lien", () => findLink.mockResolvedValue(null)],
    ["environnement", () => findEnv.mockResolvedValue(null)],
    ["serveur", () => findServer.mockResolvedValue(null)],
  ] as const)("n'émet aucun jeton si 5A refuse (%s)", async (_label, arrange) => {
    arrange();
    const issued = await issueTargetBoundLauncherToken({
      targetType: "server",
      envId: 9,
      serverId: 5,
      tool: "putty",
    });
    expect(issued).toEqual({ success: false, error: "Accès refusé" });
    expect(issued).not.toHaveProperty("token");
  });

  it("n'émet aucun jeton pour un outil non supporté ou une mauvaise catégorie", async () => {
    const unknown = await issueTargetBoundLauncherToken({
      targetType: "server",
      envId: 9,
      serverId: 5,
      tool: "winscp",
    });
    const wrong = await issueTargetBoundLauncherToken({
      targetType: "server",
      envId: 9,
      serverId: 5,
      tool: "sqlplus",
    });
    expect(unknown).toEqual({ success: false, error: "Accès refusé" });
    expect(wrong).toEqual({ success: false, error: "Accès refusé" });
    expect(findEnv).not.toHaveBeenCalled();
  });

  it("n'émet aucun jeton sans session", async () => {
    asUser(null);
    const issued = await issueTargetBoundLauncherToken({
      targetType: "environment",
      envId: 9,
      tool: "sqlplus",
    });
    expect(issued).toEqual({ success: false, error: "Non authentifié" });
  });

  it("ne contient plus d'émetteur v1", () => {
    const source = require("fs").readFileSync(
      require("path").join(process.cwd(), "actions/issue-launcher-token.ts"),
      "utf8"
    );
    expect(source).not.toContain("function issueLauncherToken");
    expect(source).not.toContain("signLauncherToken");
  });
});

describe("intégrité du jeton v2", () => {
  const now = 1_700_000_000_000;
  const exp = Math.floor(now / 1000) + LAUNCHER_TOKEN_TTL_SECONDS;

  function serverToken() {
    const issuedPayload: TargetBoundPayload = {
      v: 2,
      targetType: "server",
      envId: 9,
      serverId: 5,
      tool: "putty",
      hostname: "srvA",
      ip: "10.1.1.1",
      netid: "alice",
      exp,
    };
    return signRaw(issuedPayload);
  }

  it("reconnaît un v2 complet et identifie un v1 comme legacy", () => {
    const bound = verifyTargetBoundLauncherToken(serverToken(), SECRET, now);
    expect(bound).toMatchObject({ ok: true, kind: "target-bound" });
    expect(classifyLauncherToken(serverToken(), SECRET, now)).toMatchObject({ ok: true, kind: "target-bound" });

    const legacy = signLegacyV1Fixture({ netid: "alice", tool: "putty" }, SECRET, now);
    expect(classifyLauncherToken(legacy, SECRET, now)).toMatchObject({ ok: true, kind: "legacy", tool: "putty" });
    expect(verifyTargetBoundLauncherToken(legacy, SECRET, now)).toEqual({ ok: false, reason: "legacy" });
    expect(classifyLauncherToken(serverToken(), SECRET, now)).toMatchObject({ ok: true, kind: "target-bound" });
  });

  it.each(["envId", "serverId", "tool", "hostname", "ip", "netid", "exp"] as const)(
    "refuse un PuTTY dont %s a été modifié",
    (field) => {
      const forged = tamper(serverToken(), (payload) => {
        if (field === "exp" || field === "envId" || field === "serverId") {
          payload[field] = (payload[field] as number) + 1;
        } else {
          payload[field] = `${payload[field]}-x`;
        }
      });
      expect(verifyTargetBoundLauncherToken(forged, SECRET, now)).toEqual({ ok: false, reason: "invalid" });
    }
  );

  it.each(["envId", "tool", "aliasql", "netid", "exp"] as const)(
    "refuse un SQL*Plus dont %s a été modifié",
    (field) => {
      const token = signRaw({
        v: 2,
        targetType: "environment",
        envId: 9,
        tool: "sqlplus",
        aliasql: "ALIAS_DB",
        netid: "alice",
        exp,
      });
      const forged = tamper(token, (payload) => {
        payload[field] = field === "exp" || field === "envId" ? (payload[field] as number) + 1 : "changé";
      });
      expect(verifyTargetBoundLauncherToken(forged, SECRET, now)).toEqual({ ok: false, reason: "invalid" });
    }
  );

  it.each(["aliasql", "ptversion"] as const)("refuse un PSIDE dont %s a été modifié", (field) => {
    const token = signRaw({
      v: 2,
      targetType: "environment",
      envId: 9,
      tool: "pside",
      aliasql: "ALIAS_DB",
      ptversion: "8.61",
      netid: "alice",
      exp,
    });
    const forged = tamper(token, (payload) => {
      payload[field] = "changé";
    });
    expect(verifyTargetBoundLauncherToken(forged, SECRET, now)).toEqual({ ok: false, reason: "invalid" });
  });

  it("refuse un v2 incomplet et une version inconnue", () => {
    const incomplete = signRaw({
      v: 2,
      targetType: "server",
      tool: "putty",
      netid: "alice",
      exp,
    });
    const unknown = signRaw({ v: 9, netid: "alice", tool: "putty", exp });
    expect(verifyTargetBoundLauncherToken(incomplete, SECRET, now)).toEqual({ ok: false, reason: "invalid" });
    expect(verifyTargetBoundLauncherToken(unknown, SECRET, now)).toEqual({ ok: false, reason: "unknown_version" });
    expect(classifyLauncherToken(unknown, SECRET, now)).toEqual({ ok: false, reason: "unknown_version" });
  });

  it("refuse un v2 expiré", () => {
    const token = signRaw({
      v: 2,
      targetType: "environment",
      envId: 9,
      tool: "sqlplus",
      aliasql: "ALIAS_DB",
      netid: "alice",
      exp: Math.floor(now / 1000) - 1,
    });
    expect(verifyTargetBoundLauncherToken(token, SECRET, now)).toEqual({ ok: false, reason: "expired" });
  });
});
