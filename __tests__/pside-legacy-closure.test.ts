/**
 * @jest-environment node
 */
import { readFileSync } from "fs";
import path from "path";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import {
  executeAdminServerLauncherRequest,
  executeFreeSshLauncherRequest,
  executeLauncherToolRequest,
  executeLocalToolLauncherRequest,
} from "@/lib/launcher-execution";
import {
  LAUNCHER_ADMIN_SERVER_TARGET,
  LAUNCHER_FREE_SSH_TARGET,
  LAUNCHER_LOCAL_TOOL_TARGET,
  LAUNCHER_TOKEN_VERSION_ADMIN_SERVER,
  LAUNCHER_TOKEN_VERSION_FREE_SSH,
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

function futureExp() {
  return Math.floor(Date.now() / 1000) + 60;
}

describe("fermeture PSIDE legacy", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.AUTH_SECRET = SECRET;
    sessionAuth.mockResolvedValue({ user: { id: "7", netid: "alice" } });
    findUser.mockResolvedValue({ id: 7, netid: "alice", pkeyfile: "C:\\keys\\alice.ppk" });
    findTool.mockImplementation(async ({ where }: { where: { tool: string } }) => ({
      tool: where.tool,
      cmdpath: "C:\\apps",
      cmd: `${where.tool}.exe`,
      cmdarg: "",
      descr: where.tool,
      version: null,
    }));
  });

  it("retire PeopleSoft IDE de la fiche serveur et conserve PuTTY", () => {
    const buttons = readFileSync(
      path.join(process.cwd(), "components/ui/server-connection-buttons.tsx"),
      "utf8"
    );
    const page = readFileSync(
      path.join(process.cwd(), "app/(dashboard)/list/servers/[srv]/page.tsx"),
      "utf8"
    );
    expect(buttons).not.toContain("PeopleSoftIDELauncher");
    expect(buttons).not.toContain("PeopleSoft");
    expect(buttons).toContain("Ouvrir PuTTY");
    expect(buttons).toContain("launchPortalAdminPutty");
    expect(buttons).not.toContain("harpenvserv");
    expect(buttons).not.toContain("envsharp");
    expect(page).not.toContain("PeopleSoftIDELauncher");
    expect(page).toContain("ServerConnectionButtons");
    expect(page).toContain("serverId={Servs.id}");
  });

  it("ne réintroduit pas d'émetteur v1 pour PSIDE", () => {
    const source = readFileSync(path.join(process.cwd(), "actions/issue-launcher-token.ts"), "utf8");
    expect(source).not.toContain("function issueLauncherToken");
    expect(source).not.toContain("pside");
  });

  it.each([
    ["8.61", "DB_CLIENT"],
    ["8.60", ""],
    ["8.62", "AUTRE_ALIAS"],
  ])("refuse un jeton v1 PSIDE déjà signé (%s / %s)", async (ptversion, aliasql) => {
    const token = signLegacyV1Fixture({ netid: "alice", tool: "pside" }, SECRET);
    const result = await executeLauncherToolRequest({
      token,
      tool: "pside",
      secret: SECRET,
      ptversion,
      aliasql,
    });
    expect(result.status).toBe(403);
    expect(result.body.error).toBe("Jeton legacy refusé");
    expect(result.body.path).toBeUndefined();
    expect(result.body.cmdarg).toBeUndefined();
    expect(findTool).not.toHaveBeenCalled();
  });

  it("conserve un jeton v2 PSIDE et refuse v4, v5 et v6 présentés comme PSIDE", async () => {
    const environment = signTargetBoundLauncherToken(
      {
        v: LAUNCHER_TOKEN_VERSION_TARGET,
        targetType: "environment",
        envId: 9,
        tool: "pside",
        aliasql: "DB_A",
        ptversion: "8.61",
        netid: "alice",
        exp: futureExp(),
      } as TargetBoundPayload,
      SECRET
    );
    const kept = await executeLauncherToolRequest({
      token: environment,
      tool: "pside",
      secret: SECRET,
      ptversion: "8.60",
      aliasql: "DB_CLIENT",
    });
    expect(kept.status).toBe(200);
    expect(kept.body.envId).toBe(9);
    expect(kept.body.ptversion).toBe("8.61");
    expect(kept.body.cmdarg).toBe("-CT ORACLE -CD DB_A");
    expect(String(kept.body.path)).toContain("pt861");
    expect(String(kept.body.path)).not.toContain("pt860");
    expect(String(kept.body.cmdarg)).not.toContain("DB_CLIENT");

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
    const local = signLocalToolLauncherToken(
      {
        v: LAUNCHER_TOKEN_VERSION_LOCAL_TOOL,
        targetType: LAUNCHER_LOCAL_TOOL_TARGET,
        tool: "sqldeveloper",
        netid: "alice",
        exp: futureExp(),
      } as LocalToolLaunchPayload,
      SECRET
    );

    const asAdmin = await executeAdminServerLauncherRequest({ token: admin, tool: "pside", secret: SECRET, ptversion: "8.61", aliasql: "DB_CLIENT" });
    const asFree = await executeFreeSshLauncherRequest({ token: free, tool: "pside", secret: SECRET, ptversion: "8.61", aliasql: "DB_CLIENT" });
    const asLocal = await executeLocalToolLauncherRequest({ token: local, tool: "pside", secret: SECRET, ptversion: "8.61", aliasql: "DB_CLIENT" });
    for (const refused of [asAdmin, asFree, asLocal]) {
      expect(refused.status).toBe(403);
      expect(refused.body.path).toBeUndefined();
      expect(String(refused.body.cmdarg ?? "")).not.toContain("DB_CLIENT");
    }

    const direct = await executeLauncherToolRequest({
      token: signLegacyV1Fixture({ netid: "alice", tool: "pside" }, SECRET),
      tool: "pside",
      secret: SECRET,
      ptversion: "8.61",
      aliasql: "DB_CLIENT",
    });
    expect(direct.status).toBe(403);
    expect(direct.body.path).toBeUndefined();
  });
});
