/**
 * @jest-environment node
 */
import { readFileSync } from "fs";
import path from "path";
import { auth } from "@/auth";
import { getAllUserRoles } from "@/actions/get-all-user-roles";
import prisma from "@/lib/prisma";
import { db } from "@/lib/db";
import { issueFreeSshLauncherToken } from "@/actions/issue-launcher-token";
import {
  executeAdminServerLauncherRequest,
  executeFreeSshLauncherRequest,
  executeLauncherToolRequest,
  executeTargetBoundLauncherRequest,
} from "@/lib/launcher-execution";
import {
  LAUNCHER_ADMIN_SERVER_TARGET,
  LAUNCHER_FREE_SSH_TARGET,
  LAUNCHER_TOKEN_VERSION_ADMIN_SERVER,
  LAUNCHER_TOKEN_VERSION_FREE_SSH,
  LAUNCHER_TOKEN_VERSION_LEGACY,
  LAUNCHER_TOKEN_VERSION_TARGET,
  signAdminServerLauncherToken,
  signFreeSshLauncherToken,
  signTargetBoundLauncherToken,
  type AdminServerLaunchPayload,
  type FreeSshLaunchPayload,
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

function freePayload(overrides: Record<string, unknown> = {}): FreeSshLaunchPayload {
  return {
    v: LAUNCHER_TOKEN_VERSION_FREE_SSH,
    targetType: LAUNCHER_FREE_SSH_TARGET,
    tool: "putty",
    host: "srv-01.interne.local",
    netid: "alice",
    exp: futureExp(),
    ...overrides,
  } as FreeSshLaunchPayload;
}

const hostile = {
  host: "10.9.9.9",
  ip: "10.9.9.9",
  user: "bob",
  queryNetid: "bob",
  sshkey: "C:\\keys\\bob.ppk",
  pkeyfile: "C:\\keys\\bob.ppk",
};

describe("PuTTY SSH libre /hub", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.AUTH_SECRET = SECRET;
    sessionAuth.mockResolvedValue({ user: { id: "7", netid: "alice" } });
    findUser.mockResolvedValue({ netid: "alice", pkeyfile: "C:\\keys\\alice.ppk" });
    findTool.mockResolvedValue({
      tool: "putty",
      cmdpath: "C:\\apps",
      cmd: "putty.exe",
      descr: "PuTTY",
      version: null,
    });
  });

  it.each(["TMA_LOCAL", "TMA_OFFSHORE", "FT-MOE", "PSADMIN", "PORTAL_ADMIN", "USER"] as const)(
    "émet un jeton pour une session authentifiée (%s)",
    async () => {
      const issued = await issueFreeSshLauncherToken({
        host: "  192.168.1.49  ",
        tool: "putty",
        user: "root",
        netid: "bob",
        sshkey: "C:\\keys\\bob.ppk",
        pkeyfile: "C:\\keys\\bob.ppk",
      } as never);
      expect(issued.success).toBe(true);
      if (!issued.success) return;
      const body = JSON.parse(Buffer.from(issued.token.split(".")[0], "base64url").toString("utf8")) as Record<string, unknown>;
      expect(body).toEqual({
        v: LAUNCHER_TOKEN_VERSION_FREE_SSH,
        targetType: LAUNCHER_FREE_SSH_TARGET,
        tool: "putty",
        host: "192.168.1.49",
        netid: "alice",
        exp: body.exp,
      });
      expect(body).not.toHaveProperty("pkeyfile");
      expect(roles).not.toHaveBeenCalled();
      expect(findServer).not.toHaveBeenCalled();
      expect(findEnv).not.toHaveBeenCalled();
      expect(findLink).not.toHaveBeenCalled();
    }
  );

  it("refuse sans session, sans clé, et avec un hôte inutilisable", async () => {
    sessionAuth.mockResolvedValue(null);
    const anonymous = await issueFreeSshLauncherToken({ host: "192.168.1.49" });
    expect(anonymous).toEqual({ success: false, error: "Non authentifié" });
    expect(anonymous).not.toHaveProperty("token");
    expect(findUser).not.toHaveBeenCalled();

    sessionAuth.mockResolvedValue({ user: { id: "7", netid: "alice" } });
    findUser.mockResolvedValueOnce({ pkeyfile: "   " });
    const missingKey = await issueFreeSshLauncherToken({ host: "srv01" });
    expect(missingKey).toEqual({ success: false, error: "Clé SSH absente" });
    expect(missingKey).not.toHaveProperty("token");

    for (const host of ["", "   ", "srv01;id", "10.1.1.1 && calc", "-ssh", "bob@srv01", "10.1.1.256", "hôte interne"]) {
      const refused = await issueFreeSshLauncherToken({ host });
      expect(refused.success).toBe(false);
      expect(refused).not.toHaveProperty("token");
    }

    const otherTool = await issueFreeSshLauncherToken({ host: "srv01", tool: "filezilla" });
    expect(otherTool).toEqual({ success: false, error: "Outil invalide" });
  });

  it("exécute l'hôte et la clé du serveur, pas ceux de la query", async () => {
    const issued = await issueFreeSshLauncherToken({ host: "srv-01.interne.local", tool: "putty" });
    expect(issued.success).toBe(true);
    if (!issued.success) return;

    const result = await executeLauncherToolRequest({
      token: issued.token,
      tool: "putty",
      secret: SECRET,
      ...hostile,
    });
    expect(result.status).toBe(200);
    expect(result.body.launchHost).toBe("srv-01.interne.local");
    expect(result.body.host).toBe("srv-01.interne.local");
    expect(result.body.netid).toBe("alice");
    expect(result.body.pkeyfile).toBe("C:\\keys\\alice.ppk");
    expect(result.body.targetBound).toBe(true);
    expect(result.body.freeSsh).toBe(true);
    expect(JSON.stringify(result.body)).not.toContain("10.9.9.9");
    expect(JSON.stringify(result.body)).not.toContain("bob");
    expect(findServer).not.toHaveBeenCalled();
    expect(findEnv).not.toHaveBeenCalled();
  });

  it.each([
    ["host", (payload: Record<string, unknown>) => { payload.host = "10.9.9.9"; }],
    ["netid", (payload: Record<string, unknown>) => { payload.netid = "bob"; }],
    ["tool", (payload: Record<string, unknown>) => { payload.tool = "filezilla"; }],
    ["exp", (payload: Record<string, unknown>) => { payload.exp = Math.floor(Date.now() / 1000) + 9999; }],
    ["targetType", (payload: Record<string, unknown>) => { payload.targetType = "server"; }],
  ])("refuse un jeton dont %s est modifié", async (_field, mutate) => {
    const token = tamper(signFreeSshLauncherToken(freePayload(), SECRET), mutate);
    const result = await executeFreeSshLauncherRequest({
      token,
      tool: "putty",
      secret: SECRET,
      ...hostile,
    });
    expect(result.status).toBe(401);
    expect(result.body.launchHost).toBeUndefined();
    expect(findTool).not.toHaveBeenCalled();
  });

  it("refuse un jeton expiré, un utilisateur absent et une clé absente à l'exécution", async () => {
    const expiredToken = signFreeSshLauncherToken(
      freePayload({ exp: Math.floor(Date.now() / 1000) - 5 }),
      SECRET
    );
    const expired = await executeFreeSshLauncherRequest({
      token: expiredToken,
      tool: "putty",
      secret: SECRET,
      host: "10.9.9.9",
    });
    expect(expired.status).toBe(401);
    expect(findUser).not.toHaveBeenCalled();

    const token = signFreeSshLauncherToken(freePayload(), SECRET);
    findUser.mockResolvedValueOnce(null);
    const missingUser = await executeFreeSshLauncherRequest({ token, tool: "putty", secret: SECRET });
    expect(missingUser.status).toBe(404);
    expect(findTool).not.toHaveBeenCalled();

    findUser.mockResolvedValueOnce({ pkeyfile: "" });
    const missingKey = await executeFreeSshLauncherRequest({
      token,
      tool: "putty",
      secret: SECRET,
      sshkey: "C:\\keys\\bob.ppk",
      pkeyfile: "C:\\keys\\bob.ppk",
    });
    expect(missingKey.status).toBe(403);
    expect(missingKey.body.error).toBe("Clé SSH absente");
    expect(missingKey.body.launchHost).toBeUndefined();
    expect(findTool).not.toHaveBeenCalled();
  });

  it("ne convertit pas v1, v2 ou v4 en SSH libre, ni l'inverse", async () => {
    const legacy = signLegacyV1Fixture({ netid: "alice", tool: "putty" }, SECRET);
    expect(legacy.startsWith("")).toBe(true);
    const legacyBody = JSON.parse(Buffer.from(legacy.split(".")[0], "base64url").toString("utf8")) as { v: number };
    expect(legacyBody.v).toBe(LAUNCHER_TOKEN_VERSION_LEGACY);

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
    const free = signFreeSshLauncherToken(freePayload(), SECRET);

    for (const token of [legacy, environment, admin]) {
      const refused = await executeFreeSshLauncherRequest({
        token,
        tool: "putty",
        secret: SECRET,
        host: "10.9.9.9",
      });
      expect(refused.status).toBe(403);
      expect(refused.body.launchHost).toBeUndefined();
    }

    const asEnv = await executeTargetBoundLauncherRequest({ token: free, tool: "putty", secret: SECRET, host: "10.9.9.9" });
    expect(asEnv.status).toBe(403);
    expect(asEnv.body.error).toBe("Jeton SSH libre refusé");

    const asAdmin = await executeAdminServerLauncherRequest({ token: free, tool: "putty", secret: SECRET, host: "10.9.9.9" });
    expect(asAdmin.status).toBe(403);
    expect(asAdmin.body.error).toBe("Jeton SSH libre refusé");
    expect(findTool).not.toHaveBeenCalled();
  });

  it("ne laisse plus /hub émettre un jeton v1", () => {
    const page = readFileSync(path.join(process.cwd(), "app/(protected)/hub/page.tsx"), "utf8");
    const launcher = readFileSync(path.join(process.cwd(), "components/ui/external-tool-launcher.tsx"), "utf8");
    expect(page).not.toContain("launchExternalTool");
    expect(page).not.toContain("issueLauncherToken");
    expect(page).toContain("launchFreeSshPutty");
    expect(page).toContain('launchMode="free-ssh"');
    expect(page).toContain("identité SSH du compte connecté");
    expect(page).not.toContain("pkeyfile");
    expect(launcher).toContain('launchMode !== "free-ssh"');
    expect(launcher).toContain("launchFreeSshPutty");
  });
});
