/**
 * @jest-environment node
 */
import { readFileSync } from "fs";
import path from "path";
import { auth } from "@/auth";
import { getAllUserRoles } from "@/actions/get-all-user-roles";
import prisma from "@/lib/prisma";
import { db } from "@/lib/db";
import { issueLocalToolLauncherToken } from "@/actions/issue-launcher-token";
import {
  executeAdminServerLauncherRequest,
  executeFreeSshLauncherRequest,
  executeLauncherToolRequest,
  executeLocalToolLauncherRequest,
  executeTargetBoundLauncherRequest,
} from "@/lib/launcher-execution";
import {
  LAUNCHER_ADMIN_SERVER_TARGET,
  LAUNCHER_FREE_SSH_TARGET,
  LAUNCHER_LOCAL_TOOL_TARGET,
  LAUNCHER_TOKEN_VERSION_ADMIN_SERVER,
  LAUNCHER_TOKEN_VERSION_FREE_SSH,
  LAUNCHER_TOKEN_VERSION_LEGACY,
  LAUNCHER_TOKEN_VERSION_LOCAL_TOOL,
  LAUNCHER_TOKEN_VERSION_TARGET,
  signAdminServerLauncherToken,
  signFreeSshLauncherToken,
  signLocalToolLauncherToken,
  signTargetBoundLauncherToken,
  type AdminServerLaunchPayload,
  type FreeSshLaunchPayload,
  type LocalToolLaunchPayload,
  type TargetBoundPayload,
} from "@/lib/launcher-token";
import { signLegacyV1Fixture } from "./legacy-v1-fixture";

jest.mock("@/auth", () => ({
  auth: jest.fn(),
}));

jest.mock("@/actions/get-all-user-roles", () => ({
  getAllUserRoles: jest.fn(async () => {
    throw new Error("le RBAC ne doit pas être consulté");
  }),
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
const TRUSTED_PATH = "C:\\Oracle\\sqldeveloper\\sqldeveloper.exe";
const sessionAuth = auth as jest.Mock;
const roles = getAllUserRoles as jest.Mock;
const findServer = prisma.harpserve.findUnique as jest.Mock;
const findEnv = prisma.envsharp.findUnique as jest.Mock;
const findLink = prisma.harpenvserv.findFirst as jest.Mock;
const findTool = db.harptools.findFirst as jest.Mock;
const findUser = db.user.findUnique as jest.Mock;

function tamper(token: string, mutate: (payload: Record<string, unknown>) => void) {
  const [body, signature] = token.split(".");
  const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as Record<string, unknown>;
  mutate(payload);
  return `${Buffer.from(JSON.stringify(payload), "utf8").toString("base64url")}.${signature}`;
}

function futureExp() {
  return Math.floor(Date.now() / 1000) + 60;
}

function localPayload(overrides: Record<string, unknown> = {}): LocalToolLaunchPayload {
  return {
    v: LAUNCHER_TOKEN_VERSION_LOCAL_TOOL,
    targetType: LAUNCHER_LOCAL_TOOL_TARGET,
    tool: "sqldeveloper",
    netid: "alice",
    exp: futureExp(),
    ...overrides,
  } as LocalToolLaunchPayload;
}

const hostile = {
  path: "C:\\evil\\evil.exe",
  exe: "evil.exe",
  command: "calc.exe",
  aliasql: "DB_B",
  host: "10.9.9.9",
  envId: "44",
  ip: "10.9.9.9",
  ptversion: "8.60",
  pshome: "D:\\PSHOME",
  queryNetid: "bob",
  pkeyfile: "C:\\keys\\bob.ppk",
};

describe("SQL Developer outil local", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.AUTH_SECRET = SECRET;
    sessionAuth.mockResolvedValue({ user: { id: "7", netid: "alice" } });
    findUser.mockResolvedValue({ id: 7, netid: "alice", pkeyfile: null });
    findTool.mockResolvedValue({
      tool: "sqldeveloper",
      cmdpath: "C:\\Oracle\\sqldeveloper",
      cmd: "sqldeveloper.exe",
      cmdarg: "",
      descr: "SQL Developer",
      version: null,
    });
  });

  it.each(["TMA_LOCAL", "TMA_OFFSHORE", "FT-MOE", "PSADMIN", "PORTAL_ADMIN", "USER"] as const)(
    "émet un jeton pour une session authentifiée (%s)",
    async () => {
      const issued = await issueLocalToolLauncherToken({
        tool: "sqldeveloper",
        path: "C:\\evil\\evil.exe",
        exe: "evil.exe",
        command: "calc.exe",
        aliasql: "DB_B",
        host: "10.9.9.9",
        envId: 44,
        netid: "bob",
        pkeyfile: "C:\\keys\\bob.ppk",
      } as never);
      expect(issued.success).toBe(true);
      if (!issued.success) return;
      const body = JSON.parse(Buffer.from(issued.token.split(".")[0], "base64url").toString("utf8")) as Record<string, unknown>;
      expect(body).toEqual({
        v: LAUNCHER_TOKEN_VERSION_LOCAL_TOOL,
        targetType: LAUNCHER_LOCAL_TOOL_TARGET,
        tool: "sqldeveloper",
        netid: "alice",
        exp: body.exp,
      });
      for (const absent of ["envId", "serverId", "aliasql", "ptversion", "pshome", "ip", "hostname", "host", "pkeyfile", "path", "exe", "command"]) {
        expect(body).not.toHaveProperty(absent);
      }
      expect(roles).not.toHaveBeenCalled();
      expect(findServer).not.toHaveBeenCalled();
      expect(findEnv).not.toHaveBeenCalled();
      expect(findLink).not.toHaveBeenCalled();
    }
  );

  it("refuse sans session, un outil hors whitelist et une configuration absente", async () => {
    sessionAuth.mockResolvedValue(null);
    const anonymous = await issueLocalToolLauncherToken({ tool: "sqldeveloper" });
    expect(anonymous).toEqual({ success: false, error: "Non authentifié" });
    expect(anonymous).not.toHaveProperty("token");
    expect(findTool).not.toHaveBeenCalled();

    sessionAuth.mockResolvedValue({ user: { id: "7", netid: "alice" } });
    for (const tool of ["putty", "sqlplus", "winscp", "sqldeveloper2", "SQldeveloper", "", "perl"]) {
      const refused = await issueLocalToolLauncherToken({ tool });
      expect(refused).toEqual({ success: false, error: "Outil invalide" });
      expect(refused).not.toHaveProperty("token");
    }
    expect(findTool).not.toHaveBeenCalled();

    findTool.mockResolvedValueOnce({ cmd: "  " });
    const unconfigured = await issueLocalToolLauncherToken({ tool: "sqldeveloper" });
    expect(unconfigured).toEqual({ success: false, error: "Outil non configuré" });
    expect(unconfigured).not.toHaveProperty("token");
  });

  it("exécute le chemin harptools et ignore la query", async () => {
    const issued = await issueLocalToolLauncherToken({ tool: "sqldeveloper" });
    expect(issued.success).toBe(true);
    if (!issued.success) return;

    const result = await executeLauncherToolRequest({
      token: issued.token,
      tool: "sqldeveloper",
      secret: SECRET,
      ...hostile,
    });
    expect(result.status).toBe(200);
    expect(result.body.path).toBe(TRUSTED_PATH);
    expect(result.body.cmd).toBe("sqldeveloper.exe");
    expect(result.body.cmdarg).toBe("");
    expect(result.body.tool).toBe("sqldeveloper");
    expect(result.body.netid).toBe("alice");
    expect(result.body.localTool).toBe(true);
    expect(result.body.pkeyfile).toBeUndefined();
    expect(JSON.stringify(result.body)).not.toContain("evil");
    expect(JSON.stringify(result.body)).not.toContain("calc.exe");
    expect(JSON.stringify(result.body)).not.toContain("DB_B");
    expect(findServer).not.toHaveBeenCalled();
    expect(findEnv).not.toHaveBeenCalled();
    expect(findLink).not.toHaveBeenCalled();
  });

  it("autorise le lancement sans clé SSH", async () => {
    findUser.mockResolvedValue({ id: 7, pkeyfile: "   " });
    const issued = await issueLocalToolLauncherToken({ tool: "sqldeveloper" });
    expect(issued.success).toBe(true);
  });

  it.each([
    ["tool", (payload: Record<string, unknown>) => { payload.tool = "putty"; }],
    ["netid", (payload: Record<string, unknown>) => { payload.netid = "bob"; }],
    ["targetType", (payload: Record<string, unknown>) => { payload.targetType = "server"; }],
    ["version", (payload: Record<string, unknown>) => { payload.v = 1; }],
    ["exp", (payload: Record<string, unknown>) => { payload.exp = Math.floor(Date.now() / 1000) + 9999; }],
  ])("refuse un jeton dont %s est modifié", async (_field, mutate) => {
    const token = tamper(signLocalToolLauncherToken(localPayload(), SECRET), mutate);
    const result = await executeLocalToolLauncherRequest({
      token,
      tool: "sqldeveloper",
      secret: SECRET,
      ...hostile,
    });
    expect(result.status).toBe(401);
    expect(result.body.path).toBeUndefined();
    expect(findTool).not.toHaveBeenCalled();
  });

  it("ne convertit pas v1, v2, v4 ou v5 en outil local, ni l'inverse", async () => {
    const legacy = signLegacyV1Fixture({ netid: "alice", tool: "sqldeveloper" }, SECRET);
    const legacyBody = JSON.parse(Buffer.from(legacy.split(".")[0], "base64url").toString("utf8")) as { v: number };
    expect(legacyBody.v).toBe(LAUNCHER_TOKEN_VERSION_LEGACY);

    const environment = signTargetBoundLauncherToken(
      {
        v: LAUNCHER_TOKEN_VERSION_TARGET,
        targetType: "environment",
        envId: 9,
        tool: "sqlplus",
        aliasql: "DB_A",
        netid: "alice",
        exp: futureExp(),
      } as TargetBoundPayload,
      SECRET
    );
    const admin = signAdminServerLauncherToken(
      {
        v: LAUNCHER_TOKEN_VERSION_ADMIN_SERVER,
        targetType: LAUNCHER_ADMIN_SERVER_TARGET,
        tool: "putty",
        serverId: 5,
        hostname: "srvA",
        ip: "10.1.1.1",
        netid: "alice",
        exp: futureExp(),
      } as AdminServerLaunchPayload,
      SECRET
    );
    const free = signFreeSshLauncherToken(
      {
        v: LAUNCHER_TOKEN_VERSION_FREE_SSH,
        targetType: LAUNCHER_FREE_SSH_TARGET,
        tool: "putty",
        host: "srv-01",
        netid: "alice",
        exp: futureExp(),
      } as FreeSshLaunchPayload,
      SECRET
    );
    const local = signLocalToolLauncherToken(localPayload(), SECRET);

    for (const token of [legacy, environment, admin, free]) {
      const refused = await executeLocalToolLauncherRequest({
        token,
        tool: "sqldeveloper",
        secret: SECRET,
        path: "C:\\evil\\evil.exe",
      });
      expect(refused.status).toBe(403);
      expect(refused.body.path).toBeUndefined();
    }

    const asEnv = await executeTargetBoundLauncherRequest({ token: local, tool: "sqldeveloper", secret: SECRET });
    expect(asEnv.status).toBe(403);
    expect(asEnv.body.error).toBe("Jeton d'outil local refusé");

    const asAdmin = await executeAdminServerLauncherRequest({ token: local, tool: "sqldeveloper", secret: SECRET });
    expect(asAdmin.status).toBe(403);
    expect(asAdmin.body.error).toBe("Jeton d'outil local refusé");

    const asFree = await executeFreeSshLauncherRequest({ token: local, tool: "sqldeveloper", secret: SECRET });
    expect(asFree.status).toBe(403);
    expect(asFree.body.error).toBe("Jeton d'outil local refusé");
    expect(findTool).not.toHaveBeenCalled();
  });

  it("ne laisse plus SQL Developer émettre un jeton v1", () => {
    const link = readFileSync(path.join(process.cwd(), "components/harp/SQLDeveloperLink.tsx"), "utf8");
    const script = readFileSync(path.join(process.cwd(), "windows/launcher/launcher.ps1"), "utf8");
    expect(link).not.toContain("launchExternalTool");
    expect(link).toContain("launchLocalTool('sqldeveloper'");
    expect(script).toContain("sqldeveloper");
    expect(script).not.toContain("foreach ($key in $query.Keys)");
  });
});
