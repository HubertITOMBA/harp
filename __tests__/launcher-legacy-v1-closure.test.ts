/**
 * @jest-environment node
 */
import { readFileSync } from "fs";
import path from "path";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { executeAvailabilityRequest } from "@/lib/launcher-availability";
import { executeLauncherToolRequest } from "@/lib/launcher-execution";
import {
  LAUNCHER_TOKEN_VERSION_LEGACY,
  signAdminServerLauncherToken,
  signAvailabilityToken,
  signFreeSshLauncherToken,
  signLocalToolLauncherToken,
  signTargetBoundLauncherToken,
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

const SECRET = "secret-de-test-uniquement";
const sessionAuth = auth as jest.Mock;
const findTool = db.harptools.findFirst as jest.Mock;
const findUser = db.user.findUnique as jest.Mock;

const HOSTILE = {
  host: "10.1.1.8",
  user: "oracle",
  sshkey: "C:\\keys\\client.ppk",
  pkeyfile: "C:\\keys\\client.ppk",
  ip: "10.9.9.9",
  aliasql: "DB_CLIENT",
  ptversion: "8.61",
  envId: "42",
  path: "C:\\Windows\\System32\\cmd.exe",
  exe: "cmd.exe",
  command: "cmd.exe /c whoami",
  pshome: "D:\\apps\\peoplesoft",
  queryNetid: "bob",
};

function read(relativePath: string) {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

describe("fermeture du launcher legacy v1", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.AUTH_SECRET = SECRET;
    sessionAuth.mockResolvedValue({ user: { id: "7", netid: "alice" } });
    findUser.mockResolvedValue({ id: 7, netid: "alice", pkeyfile: "C:\\keys\\alice.ppk" });
    findTool.mockImplementation(async ({ where }: { where: { tool: string } }) => ({
      tool: where.tool,
      cmdpath: "C:\\apps",
      cmd: `${where.tool}.exe`,
      cmdarg: "-trusted",
      descr: where.tool,
      version: null,
    }));
  });

  it("ne laisse aucun émetteur v1 dans le code de production", () => {
    const files = [
      "actions/issue-launcher-token.ts",
      "lib/launcher-token.ts",
      "lib/launcher-execution.ts",
      "lib/launcher-tool.ts",
      "lib/mylaunch.ts",
      "app/api/launcher/tool/route.ts",
    ];
    const combined = files.map((file) => read(file)).join("\n");
    expect(combined).not.toContain("function issueLauncherToken");
    expect(combined).not.toContain("function signLauncherToken");
    expect(combined).not.toContain("function launchExternalTool");
    expect(combined).not.toContain("function executeLegacyLauncherRequest");
    expect(combined).not.toContain("function readLauncherTool");
    expect(findUser).not.toHaveBeenCalled();
  });

  it.each(["putty", "filezilla", "sqlplus", "pside", "psdmt", "sqldeveloper", "winscp"])(
    "refuse un ancien jeton v1 signé pour %s",
    async (tool) => {
      const token = signLegacyV1Fixture({ netid: "alice", tool }, SECRET);
      const body = JSON.parse(Buffer.from(token.split(".")[0], "base64url").toString("utf8")) as { v: number };
      expect(body.v).toBe(LAUNCHER_TOKEN_VERSION_LEGACY);
      findTool.mockClear();

      const result = await executeLauncherToolRequest({
        token,
        tool,
        secret: SECRET,
      });

      expect(result.status).toBe(403);
      expect(result.body.error).toBe("Jeton legacy refusé");
      expect(result.body.path).toBeUndefined();
      expect(result.body.cmdarg).toBeUndefined();
      expect(result.body.launchHost).toBeUndefined();
      expect(result.body.pkeyfile).toBeUndefined();
      expect(findTool).not.toHaveBeenCalled();
    }
  );

  it("refuse un v1 expiré et un v1 altéré", async () => {
    const expired = signLegacyV1Fixture({ netid: "alice", tool: "putty" }, SECRET, 1_000_000);
    const expiredResult = await executeLauncherToolRequest({
      token: expired,
      tool: "putty",
      secret: SECRET,
    });
    expect(expiredResult.status).toBe(401);
    expect(expiredResult.body.error).toBe("Jeton expiré");

    const valid = signLegacyV1Fixture({ netid: "alice", tool: "filezilla" }, SECRET);
    const tampered = await executeLauncherToolRequest({
      token: `${valid.split(".")[0]}.signature-fausse`,
      tool: "filezilla",
      secret: SECRET,
    });
    expect(tampered.status).toBe(401);
    expect(tampered.body.error).toBe("Jeton invalide");
    expect(findTool).not.toHaveBeenCalled();
  });

  it.each(["putty", "sqlplus", "psdmt"])(
    "ignore les paramètres client hostiles d'un v1 %s",
    async (tool) => {
      const token = signLegacyV1Fixture({ netid: "alice", tool }, SECRET);
      findTool.mockClear();
      const result = await executeLauncherToolRequest({
        token,
        tool,
        secret: SECRET,
        ...HOSTILE,
      });
      expect(result.status).toBe(403);
      expect(result.body).toEqual({ error: "Jeton legacy refusé" });
      expect(JSON.stringify(result.body)).not.toContain("10.9.9.9");
      expect(JSON.stringify(result.body)).not.toContain("DB_CLIENT");
      expect(JSON.stringify(result.body)).not.toContain("cmd.exe");
      expect(findTool).not.toHaveBeenCalled();
    }
  );

  it("laisse passer les jetons modernes sans les classer comme un refus legacy", async () => {
    const server: TargetBoundPayload = {
      v: 2,
      targetType: "server",
      envId: 9,
      serverId: 3,
      tool: "putty",
      hostname: "srvA",
      ip: "10.1.1.8",
      netid: "alice",
      exp: Math.floor(Date.now() / 1000) + 60,
    };
    const putty = await executeLauncherToolRequest({
      token: signTargetBoundLauncherToken(server, SECRET),
      tool: "putty",
      secret: SECRET,
      ...HOSTILE,
    });
    const filezilla = await executeLauncherToolRequest({
      token: signTargetBoundLauncherToken({ ...server, tool: "filezilla" }, SECRET),
      tool: "filezilla",
      secret: SECRET,
    });
    const sqlplus = await executeLauncherToolRequest({
      token: signTargetBoundLauncherToken(
        {
          v: 2,
          targetType: "environment",
          envId: 9,
          tool: "sqlplus",
          aliasql: "DB_A",
          netid: "alice",
          exp: server.exp,
        },
        SECRET
      ),
      tool: "sqlplus",
      secret: SECRET,
    });
    const pside = await executeLauncherToolRequest({
      token: signTargetBoundLauncherToken(
        {
          v: 2,
          targetType: "environment",
          envId: 9,
          tool: "pside",
          aliasql: "DB_A",
          ptversion: "8.61",
          netid: "alice",
          exp: server.exp,
        },
        SECRET
      ),
      tool: "pside",
      secret: SECRET,
    });
    const psdmt = await executeLauncherToolRequest({
      token: signTargetBoundLauncherToken(
        {
          v: 2,
          targetType: "environment",
          envId: 9,
          tool: "psdmt",
          aliasql: "DB_A",
          ptversion: "8.61",
          netid: "alice",
          exp: server.exp,
        },
        SECRET
      ),
      tool: "psdmt",
      secret: SECRET,
    });
    const availability = await executeAvailabilityRequest({
      token: signAvailabilityToken({ netid: "alice", tool: "putty" }, SECRET),
      tool: "putty",
      secret: SECRET,
    });
    const admin = await executeLauncherToolRequest({
      token: signAdminServerLauncherToken(
        {
          v: 4,
          targetType: "admin-server",
          tool: "putty",
          serverId: 3,
          hostname: "srvA",
          ip: "10.1.1.8",
          netid: "alice",
          exp: server.exp,
        },
        SECRET
      ),
      tool: "putty",
      secret: SECRET,
    });
    const free = await executeLauncherToolRequest({
      token: signFreeSshLauncherToken(
        { v: 5, targetType: "free-ssh", tool: "putty", host: "10.1.1.8", netid: "alice", exp: server.exp },
        SECRET
      ),
      tool: "putty",
      secret: SECRET,
    });
    const local = await executeLauncherToolRequest({
      token: signLocalToolLauncherToken(
        { v: 6, targetType: "local-tool", tool: "sqldeveloper", netid: "alice", exp: server.exp },
        SECRET
      ),
      tool: "sqldeveloper",
      secret: SECRET,
    });

    for (const result of [putty, filezilla, sqlplus, pside, psdmt, admin, free, local]) {
      expect(result.status).toBe(200);
      expect(result.body.error).not.toBe("Jeton legacy refusé");
    }
    expect(availability.status).not.toBe(403);
    expect(String(availability.body.error ?? "")).not.toBe("Jeton legacy refusé");
    expect(String(pside.body.path)).toContain("pt861");
    expect(local.body.localTool).toBe(true);
    expect(admin.body.adminServer).toBe(true);
    expect(free.body.freeSsh).toBe(true);
  });

  it("retire les replis v1 des composants métier conservés", () => {
    const links = [
      "components/harp/PuttyLink.tsx",
      "components/harp/FileZillaLink.tsx",
      "components/harp/SQLPlusLink.tsx",
      "components/harp/PSIDELink.tsx",
      "components/harp/PSDMTLink.tsx",
    ];
    for (const file of links) {
      expect(read(file)).not.toContain("launchExternalTool");
    }

    const buttons = read("components/ui/server-connection-buttons.tsx");
    expect(buttons).not.toContain("launchExternalTool");
    expect(buttons).toContain("launchPortalAdminPutty");

    const launcher = read("components/ui/external-tool-launcher.tsx");
    expect(launcher).toContain('launchMode: "free-ssh"');
    expect(launcher).toContain("launchFreeSshPutty");
    expect(launcher).not.toContain("launchExternalTool");
    expect(launcher).not.toContain("ExternalToolLauncher");
    expect(launcher).not.toContain("PeopleSoftIDELauncher");

    const hub = read("app/(protected)/hub/page.tsx");
    expect(hub).toContain('launchMode="free-ssh"');
    expect(hub).toContain("launchFreeSshPutty");

    const sqldev = read("components/harp/SQLDeveloperLink.tsx");
    expect(sqldev).toContain("launchLocalTool");
    expect(sqldev).not.toContain("launchExternalTool");
    expect(sqldev).not.toContain("envId");
  });
});
