/**
 * @jest-environment node
 */
import { createHmac } from "crypto";
import { auth } from "@/auth";
import { getAllUserRoles } from "@/actions/get-all-user-roles";
import prisma from "@/lib/prisma";
import { db } from "@/lib/db";
import { issuePortalAdminServerLaunchToken } from "@/actions/issue-launcher-token";
import { authorizePortalAdminServerLaunch } from "@/lib/portal-admin-server-launch";
import {
  executeAdminServerLauncherRequest,
  executeLauncherToolRequest,
  executeTargetBoundLauncherRequest,
} from "@/lib/launcher-execution";
import {
  LAUNCHER_ADMIN_SERVER_TARGET,
  LAUNCHER_TOKEN_VERSION_ADMIN_SERVER,
  LAUNCHER_TOKEN_VERSION_TARGET,
  signAdminServerLauncherToken,
  signTargetBoundLauncherToken,
  type AdminServerLaunchPayload,
  type TargetBoundPayload,
} from "@/lib/launcher-token";

jest.mock("@/auth", () => ({
  auth: jest.fn(),
}));

jest.mock("@/actions/get-all-user-roles", () => ({
  getAllUserRoles: jest.fn(),
}));

jest.mock("@/lib/prisma", () => ({
  __esModule: true,
  default: {
    harpserve: { findUnique: jest.fn() },
    envsharp: { findUnique: jest.fn() },
    harpenvserv: { findFirst: jest.fn() },
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
const findServer = prisma.harpserve.findUnique as jest.Mock;
const findEnv = prisma.envsharp.findUnique as jest.Mock;
const findLink = prisma.harpenvserv.findFirst as jest.Mock;
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

function futureExp() {
  return Math.floor(Date.now() / 1000) + 60;
}

function adminPayload(overrides: Record<string, unknown> = {}): AdminServerLaunchPayload {
  return {
    v: LAUNCHER_TOKEN_VERSION_ADMIN_SERVER,
    targetType: LAUNCHER_ADMIN_SERVER_TARGET,
    tool: "putty",
    serverId: 5,
    hostname: "srvA",
    ip: "10.1.1.1",
    netid: "alice",
    exp: futureExp(),
    ...overrides,
  } as AdminServerLaunchPayload;
}

const hostile = {
  ip: "10.9.9.9",
  host: "srvB",
  user: "bob",
  sshkey: "C:\\keys\\bob.ppk",
  queryNetid: "bob",
  aliasql: "DB_B",
  ptversion: "8.60",
};

describe("lancement PuTTY d'administration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.AUTH_SECRET = SECRET;
    sessionAuth.mockResolvedValue({ user: { id: "7", netid: "alice" } });
    roles.mockResolvedValue(["PORTAL_ADMIN"]);
    findServer.mockResolvedValue({ id: 5, srv: "srvA", ip: "10.1.1.1" });
    findUser.mockResolvedValue({ id: 7, netid: "alice", pkeyfile: "C:\\keys\\alice.ppk" });
    findTool.mockResolvedValue({
      tool: "putty",
      cmdpath: "C:\\apps",
      cmd: "putty.exe",
      descr: "PuTTY",
      version: null,
    });
  });

  it("autorise PORTAL_ADMIN sur un serveur valide", async () => {
    const decision = await authorizePortalAdminServerLaunch({ serverId: 5, tool: "putty" });
    expect(decision).toEqual({
      authorized: true,
      tool: "putty",
      serverId: 5,
      hostname: "srvA",
      ip: "10.1.1.1",
    });
    expect(findEnv).not.toHaveBeenCalled();
    expect(findLink).not.toHaveBeenCalled();
  });

  it.each(["TMA_LOCAL", "PSADMIN", "FT-MOE"] as const)("refuse %s", async (role) => {
    roles.mockResolvedValue([role]);
    const decision = await authorizePortalAdminServerLaunch({ serverId: 5, tool: "putty" });
    expect(decision).toEqual({ authorized: false, reason: "forbidden" });
    expect(findServer).not.toHaveBeenCalled();
    expect(findEnv).not.toHaveBeenCalled();
  });

  it("refuse sans session, un serverId invalide et un serveur absent", async () => {
    sessionAuth.mockResolvedValue(null);
    expect(await authorizePortalAdminServerLaunch({ serverId: 5, tool: "putty" })).toEqual({
      authorized: false,
      reason: "unauthenticated",
    });
    expect(findServer).not.toHaveBeenCalled();

    sessionAuth.mockResolvedValue({ user: { id: "7", netid: "alice" } });
    for (const serverId of [0, -1, 1.5, "5"]) {
      expect(await authorizePortalAdminServerLaunch({ serverId, tool: "putty" })).toEqual({
        authorized: false,
        reason: "invalid_server",
      });
    }
    expect(findServer).not.toHaveBeenCalled();

    findServer.mockResolvedValueOnce(null);
    expect(await authorizePortalAdminServerLaunch({ serverId: 5, tool: "putty" })).toEqual({
      authorized: false,
      reason: "server_not_found",
    });
    expect(await authorizePortalAdminServerLaunch({ serverId: 5, tool: "filezilla" })).toEqual({
      authorized: false,
      reason: "unsupported_tool",
    });
  });

  it("autorise un serveur sans lien d'environnement et ignore la cible client", async () => {
    const decision = await authorizePortalAdminServerLaunch({
      serverId: 5,
      tool: "putty",
      ip: "10.9.9.9",
      hostname: "srvB",
      sshkey: "C:\\keys\\bob.ppk",
    } as never);
    expect(decision).toMatchObject({ authorized: true, ip: "10.1.1.1", hostname: "srvA" });
    expect(findLink).not.toHaveBeenCalled();
    expect(findEnv).not.toHaveBeenCalled();
  });

  it("signe la cible relue et ignore la query à l'exécution", async () => {
    const issued = await issuePortalAdminServerLaunchToken({
      serverId: 5,
      tool: "putty",
      ip: "10.9.9.9",
      hostname: "srvB",
      sshkey: "C:\\keys\\bob.ppk",
      user: "bob",
    } as never);
    expect(issued.success).toBe(true);
    if (!issued.success) return;
    const body = JSON.parse(Buffer.from(issued.token.split(".")[0], "base64url").toString("utf8")) as Record<string, unknown>;
    expect(body).toMatchObject({
      v: LAUNCHER_TOKEN_VERSION_ADMIN_SERVER,
      targetType: LAUNCHER_ADMIN_SERVER_TARGET,
      tool: "putty",
      serverId: 5,
      hostname: "srvA",
      ip: "10.1.1.1",
      netid: "alice",
    });
    expect(body).not.toHaveProperty("envId");
    expect(body).not.toHaveProperty("pkeyfile");

    const result = await executeLauncherToolRequest({
      token: issued.token,
      tool: "putty",
      secret: SECRET,
      ...hostile,
    });
    expect(result.status).toBe(200);
    expect(result.body.launchHost).toBe("10.1.1.1");
    expect(result.body.hostname).toBe("srvA");
    expect(result.body.netid).toBe("alice");
    expect(result.body.pkeyfile).toBe("C:\\keys\\alice.ppk");
    expect(result.body.serverId).toBe(5);
    expect(result.body.adminServer).toBe(true);
    expect(JSON.stringify(result.body)).not.toContain("10.9.9.9");
    expect(JSON.stringify(result.body)).not.toContain("srvB");
    expect(JSON.stringify(result.body)).not.toContain("bob");
    expect(findEnv).not.toHaveBeenCalled();
  });

  it.each([
    ["serverId", (payload: Record<string, unknown>) => { payload.serverId = 88; }],
    ["ip", (payload: Record<string, unknown>) => { payload.ip = "10.9.9.9"; }],
    ["hostname", (payload: Record<string, unknown>) => { payload.hostname = "srvB"; }],
    ["netid", (payload: Record<string, unknown>) => { payload.netid = "bob"; }],
  ])("refuse un jeton dont %s est modifié", async (_field, mutate) => {
    const token = tamper(signAdminServerLauncherToken(adminPayload(), SECRET), mutate);
    const result = await executeAdminServerLauncherRequest({
      token,
      tool: "putty",
      secret: SECRET,
      ...hostile,
    });
    expect(result.status).toBe(401);
    expect(result.body.launchHost).toBeUndefined();
    expect(findTool).not.toHaveBeenCalled();
    expect(findUser).not.toHaveBeenCalled();
  });

  it("refuse un jeton expiré, un utilisateur absent et une clé absente", async () => {
    const expired = await executeAdminServerLauncherRequest({
      token: signRaw({ ...adminPayload(), exp: Math.floor(Date.now() / 1000) - 5 }),
      tool: "putty",
      secret: SECRET,
      ip: "10.9.9.9",
    });
    expect(expired.status).toBe(401);
    expect(findUser).not.toHaveBeenCalled();

    const token = signAdminServerLauncherToken(adminPayload(), SECRET);
    findUser.mockResolvedValueOnce(null);
    const missingUser = await executeAdminServerLauncherRequest({ token, tool: "putty", secret: SECRET });
    expect(missingUser.status).toBe(404);
    expect(findTool).not.toHaveBeenCalled();

    findUser.mockResolvedValueOnce({ pkeyfile: "  " });
    const missingKey = await executeAdminServerLauncherRequest({ token, tool: "putty", secret: SECRET, sshkey: "C:\\keys\\bob.ppk" });
    expect(missingKey.status).toBe(403);
    expect(missingKey.body.error).toBe("Clé SSH absente");
    expect(missingKey.body.launchHost).toBeUndefined();
    expect(findTool).not.toHaveBeenCalled();
  });

  it("ne convertit pas un jeton environnement en jeton admin, ni l'inverse", async () => {
    const admin = signAdminServerLauncherToken(adminPayload(), SECRET);
    const environment = signTargetBoundLauncherToken(
      {
        v: LAUNCHER_TOKEN_VERSION_TARGET,
        targetType: "server",
        envId: 9,
        serverId: 5,
        tool: "putty",
        hostname: "srvA",
        ip: "10.1.1.1",
        netid: "alice",
        exp: futureExp(),
      } as TargetBoundPayload,
      SECRET
    );

    const adminAsEnv = await executeTargetBoundLauncherRequest({
      token: admin,
      tool: "putty",
      secret: SECRET,
      ip: "10.9.9.9",
    });
    expect(adminAsEnv.status).toBe(403);
    expect(adminAsEnv.body.error).toBe("Jeton d'administration refusé");

    const envAsAdmin = await executeAdminServerLauncherRequest({
      token: environment,
      tool: "putty",
      secret: SECRET,
      ip: "10.9.9.9",
    });
    expect(envAsAdmin.status).toBe(403);
    expect(envAsAdmin.body.error).toBe("Jeton environnement refusé");
    expect(findTool).not.toHaveBeenCalled();
  });
});
