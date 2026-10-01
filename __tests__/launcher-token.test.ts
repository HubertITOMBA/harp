/**
 * @jest-environment node
 */
import fs from "fs";
import path from "path";
import { executeLauncherToolRequest } from "@/lib/launcher-execution";
import { classifyLauncherToken } from "@/lib/launcher-token";
import { signLegacyV1Fixture } from "./legacy-v1-fixture";

const SECRET = "secret-de-test-uniquement";

describe("jeton de lancement", () => {
  it("reconnaît un v1 signé comme legacy et le refuse sans commande", async () => {
    const token = signLegacyV1Fixture({ netid: "alice", tool: "putty" }, SECRET);
    expect(classifyLauncherToken(token, SECRET)).toMatchObject({
      ok: true,
      kind: "legacy",
      tool: "putty",
      netid: "alice",
    });
    const result = await executeLauncherToolRequest({
      token,
      tool: "putty",
      secret: SECRET,
      host: "10.9.9.9",
      user: "oracle",
      sshkey: "C:\\keys\\client.ppk",
    });
    expect(result.status).toBe(403);
    expect(result.body).toEqual({ error: "Jeton legacy refusé" });
  });

  it("refuse un v1 expiré", async () => {
    const token = signLegacyV1Fixture({ netid: "alice", tool: "putty" }, SECRET, 1_000_000);
    const result = await executeLauncherToolRequest({
      token,
      tool: "putty",
      secret: SECRET,
      nowMs: Date.now(),
    });
    expect(result.status).toBe(401);
    expect(result.body.error).toBe("Jeton expiré");
    expect(result.body.path).toBeUndefined();
  });

  it("refuse un v1 altéré", async () => {
    const token = signLegacyV1Fixture({ netid: "alice", tool: "putty" }, SECRET);
    const [body] = token.split(".");
    const result = await executeLauncherToolRequest({
      token: `${body}.signature-fausse`,
      tool: "putty",
      secret: SECRET,
    });
    expect(result.status).toBe(401);
    expect(result.body.error).toBe("Jeton invalide");
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
    expect(launcher).toContain("n'est pas une cible signee");
    expect(launcher).not.toContain("$query['sshkey']");
    expect(launcher).not.toContain("$query['host']");
    expect(server).not.toContain('QueryString["sshkey"]');
    expect(server).not.toContain('QueryString["host"]');
  });
});
