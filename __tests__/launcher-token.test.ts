import { db } from "@/lib/db";
import { readLauncherTool } from "@/lib/launcher-tool";
import {
  resolveLauncherIdentity,
  signLauncherToken,
  verifyLauncherToken,
} from "@/lib/launcher-token";
import { auth } from "@/auth";
import { issueLauncherToken } from "@/actions/issue-launcher-token";
import fs from "fs";
import path from "path";

jest.mock("@/auth", () => ({
  auth: jest.fn(),
}));

jest.mock("@/lib/db", () => ({
  db: {
    harptools: { findFirst: jest.fn() },
    user: { findUnique: jest.fn() },
  },
}));

jest.mock("@/lib/ptools-path", () => ({
  buildPeopleSoftClientPath: jest.fn(() => "C:\\fixture\\pside.exe"),
  normalizePeopleToolsVersion: jest.fn(() => ({ ok: true, display: "8.61", folderSuffix: "861" })),
}));

const SECRET = "secret-de-test-uniquement";
const authMock = auth as jest.Mock;
const findTool = db.harptools.findFirst as jest.Mock;
const findUser = db.user.findUnique as jest.Mock;

const puttyRow = {
  tool: "putty",
  cmdpath: "C:\\Tools",
  cmd: "putty.exe",
  cmdarg: "",
  descr: "PuTTY",
  version: null,
};

describe("jeton de lancement", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.AUTH_SECRET = SECRET;
  });

  it("accepte un jeton valide et ignore un netid de query", () => {
    const token = signLauncherToken({ netid: "alice", tool: "putty" }, SECRET, 1_700_000_000_000);
    const access = resolveLauncherIdentity({
      token,
      tool: "putty",
      queryNetid: "bob",
      secret: SECRET,
      nowMs: 1_700_000_000_000,
    });
    expect(access).toEqual({ ok: true, netid: "alice", tool: "putty" });
  });

  it("refuse un jeton expiré sans lire l'utilisateur", () => {
    const token = signLauncherToken({ netid: "alice", tool: "putty" }, SECRET, 1_000_000);
    const access = resolveLauncherIdentity({
      token,
      tool: "putty",
      queryNetid: "alice",
      secret: SECRET,
      nowMs: 1_000_000 + 121_000,
    });
    expect(access).toMatchObject({ ok: false, status: 401, reason: "expired" });
    expect(findUser).not.toHaveBeenCalled();
    expect(findTool).not.toHaveBeenCalled();
  });

  it("refuse une signature invalide", () => {
    const token = signLauncherToken({ netid: "alice", tool: "putty" }, SECRET);
    const forged = `${token.slice(0, -1)}${token.endsWith("a") ? "b" : "a"}`;
    const access = resolveLauncherIdentity({
      token: forged,
      tool: "putty",
      secret: SECRET,
    });
    expect(access).toMatchObject({ ok: false, status: 401, reason: "invalid" });
    expect(findUser).not.toHaveBeenCalled();
  });

  it("refuse un outil différent de celui signé", () => {
    const token = signLauncherToken({ netid: "alice", tool: "putty" }, SECRET);
    const access = resolveLauncherIdentity({
      token,
      tool: "filezilla",
      secret: SECRET,
    });
    expect(access).toMatchObject({ ok: false, status: 403, reason: "mismatch" });
    expect(findTool).not.toHaveBeenCalled();
  });

  it("refuse l'absence de jeton", () => {
    const access = resolveLauncherIdentity({
      token: null,
      tool: "putty",
      queryNetid: "alice",
      secret: SECRET,
    });
    expect(access).toMatchObject({ ok: false, status: 401, reason: "absent" });
    expect(findUser).not.toHaveBeenCalled();
  });

  it("lit le pkeyfile de l'identité signée, pas d'un netid forgé", async () => {
    const token = signLauncherToken({ netid: "alice", tool: "putty" }, SECRET);
    const access = resolveLauncherIdentity({
      token,
      tool: "putty",
      queryNetid: "bob",
      secret: SECRET,
    });
    expect(access.ok).toBe(true);
    if (!access.ok) return;

    findTool.mockResolvedValue(puttyRow);
    findUser.mockResolvedValue({ pkeyfile: "fixture-key-path" });

    const result = await readLauncherTool({
      tool: access.tool,
      netid: access.netid,
      ptversion: null,
      aliasql: null,
      ip: null,
    });

    expect(findUser).toHaveBeenCalledWith({
      where: { netid: "alice" },
      select: { pkeyfile: true },
    });
    expect(result.status).toBe(200);
    expect(result.body.pkeyfile).toBe("fixture-key-path");
    expect(JSON.stringify(result.body)).not.toContain("bob");
  });

  it("ne renvoie pas de pkeyfile si l'utilisateur signé n'existe pas", async () => {
    findTool.mockResolvedValue(puttyRow);
    findUser.mockResolvedValue(null);

    const result = await readLauncherTool({
      tool: "putty",
      netid: "alice",
      ptversion: null,
      aliasql: null,
      ip: null,
    });

    expect(result.status).toBe(404);
    expect(result.body).toEqual({ error: "Utilisateur introuvable" });
    expect(result.body).not.toHaveProperty("pkeyfile");
  });

  it("ne lit pas l'utilisateur si l'outil n'existe pas", async () => {
    findTool.mockResolvedValue(null);

    const result = await readLauncherTool({
      tool: "putty",
      netid: "alice",
      ptversion: null,
      aliasql: null,
      ip: null,
    });

    expect(result.status).toBe(404);
    expect(findUser).not.toHaveBeenCalled();
    expect(result.body).not.toHaveProperty("pkeyfile");
  });

  it("émet le jeton depuis la session et pas depuis un netid client", async () => {
    authMock.mockResolvedValue({ user: { id: "7", netid: "alice" } });
    const issued = await issueLauncherToken("putty");
    expect(issued.success).toBe(true);
    if (!issued.success) return;
    expect(verifyLauncherToken(issued.token, SECRET)).toMatchObject({
      ok: true,
      netid: "alice",
      tool: "putty",
    });
  });

  it("n'émet pas de jeton sans session", async () => {
    authMock.mockResolvedValue(null);
    const issued = await issueLauncherToken("putty");
    expect(issued).toEqual({ success: false, error: "Non authentifié" });
  });

  it("le launcher Windows transporte le jeton sans le secret de signature", () => {
    const launcher = fs.readFileSync(
      path.join(process.cwd(), "windows", "launcher", "launcher.ps1"),
      "utf8"
    );
    const server = fs.readFileSync(
      path.join(process.cwd(), "windows", "launcher", "launcher-server.ps1"),
      "utf8"
    );
    expect(launcher).toContain("launchToken");
    expect(launcher).not.toContain("AUTH_SECRET");
    expect(server).toContain('QueryString["token"]');
    expect(server).not.toContain("AUTH_SECRET");
    expect(launcher).not.toMatch(/api\/launcher\/tool\?tool=\$tool&netid=/);
  });
});
