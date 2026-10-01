/**
 * @jest-environment jsdom
 */
import { readFileSync } from "fs";
import path from "path";
import {
  issueAvailabilityToken,
  issueFreeSshLauncherToken,
  issueLocalToolLauncherToken,
  issuePortalAdminServerLaunchToken,
  issueTargetBoundLauncherToken,
} from "@/actions/issue-launcher-token";
import { executeLauncherToolRequest } from "@/lib/launcher-execution";
import {
  buildSignedLaunchProtocolUrl,
  checkToolAvailability,
  launchFreeSshPutty,
  launchLocalTool,
  launchPortalAdminPutty,
  launchTargetBoundTool,
} from "@/lib/mylaunch";
import { signLegacyV1Fixture } from "./legacy-v1-fixture";

jest.mock("@/lib/db", () => ({
  db: {
    harptools: { findFirst: jest.fn() },
    user: { findUnique: jest.fn() },
  },
}));

jest.mock("@/actions/issue-launcher-token", () => ({
  issueTargetBoundLauncherToken: jest.fn(),
  issuePortalAdminServerLaunchToken: jest.fn(),
  issueFreeSshLauncherToken: jest.fn(),
  issueLocalToolLauncherToken: jest.fn(),
  issueAvailabilityToken: jest.fn(),
}));

const targetIssuer = issueTargetBoundLauncherToken as jest.Mock;
const adminIssuer = issuePortalAdminServerLaunchToken as jest.Mock;
const freeIssuer = issueFreeSshLauncherToken as jest.Mock;
const localIssuer = issueLocalToolLauncherToken as jest.Mock;
const availabilityIssuer = issueAvailabilityToken as jest.Mock;

const SECRET = "secret-de-test-uniquement";
const TOKEN = "Ybjv1.sig_nature-part";
const HOSTILE = {
  host: "10.9.9.9",
  ip: "10.8.8.8",
  user: "oracle",
  sshkey: "C:\\keys\\client.ppk",
  pkeyfile: "C:\\keys\\client.ppk",
  aliasql: "DB_CLIENT",
  ptversion: "8.61",
  envId: "42",
  serverId: "7",
  path: "C:\\Windows\\System32\\cmd.exe",
  command: "cmd.exe",
  pshome: "D:\\apps\\peoplesoft",
  netid: "alice",
};

function installDocument() {
  const protocolUrls: string[] = [];
  const realCreate = document.createElement.bind(document);
  jest.spyOn(document, "createElement").mockImplementation((tag: string) => {
    if (tag === "iframe") {
      return {
        style: {},
        setAttribute() {},
        remove() {},
        set src(_value: string) {},
        onload: null,
      } as unknown as HTMLElement;
    }
    if (tag === "a") {
      const anchor = { style: { display: "" }, href: "", click() { protocolUrls.push(this.href); } };
      return anchor as unknown as HTMLElement;
    }
    return realCreate(tag);
  });
  jest.spyOn(document.body, "appendChild").mockImplementation((node) => node);
  jest.spyOn(document.body, "removeChild").mockImplementation((node) => node);
  window.open = jest.fn(() => null);
  return protocolUrls;
}

function installFetch(launchShouldFail: boolean) {
  const seen: string[] = [];
  global.fetch = jest.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    seen.push(url);
    if (url.includes("/health")) {
      return { ok: true, json: async () => ({ user: "alice" }) } as Response;
    }
    if (url.includes("/launch")) {
      if (launchShouldFail) throw new Error("localhost indisponible");
      return { ok: true, json: async () => ({ success: true }) } as Response;
    }
    if (url.includes("/api/launcher/availability")) {
      return { ok: true, json: async () => ({ success: true, availability: true }) } as Response;
    }
    throw new Error(`fetch inattendu: ${url}`);
  }) as jest.Mock;
  return seen;
}

function expectOpaqueToken(url: string) {
  expect(url).toContain("token=Ybjv1.sig_nature-part");
  expect(url).not.toContain("10.9.9.9");
  expect(url).not.toContain("10.8.8.8");
  expect(url).not.toContain("oracle");
  expect(url).not.toContain("client.ppk");
  expect(url).not.toContain("DB_CLIENT");
  expect(url).not.toContain("8.61");
  expect(url).not.toContain("cmd.exe");
  expect(url).not.toContain("pshome");
  expect(url).not.toContain("netid=");
}

describe("transport du jeton launcher", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    sessionStorage.clear();
    delete process.env.NEXT_PUBLIC_LAUNCHER_TRANSPORT;
    process.env.AUTH_SECRET = SECRET;
    targetIssuer.mockResolvedValue({ success: true, token: TOKEN });
    adminIssuer.mockResolvedValue({ success: true, token: TOKEN });
    freeIssuer.mockResolvedValue({ success: true, token: TOKEN });
    localIssuer.mockResolvedValue({ success: true, token: TOKEN });
    availabilityIssuer.mockResolvedValue({ success: true, token: TOKEN });
  });

  it("n'utilise plus issued dans le transport", () => {
    const source = readFileSync(path.join(process.cwd(), "lib/mylaunch.ts"), "utf8");
    const body = source.slice(
      source.indexOf("async function deliverToLocalLauncher"),
      source.indexOf("export async function launchTargetBoundTool")
    );
    expect(body).not.toContain("issued");
    expect(body).toContain("opaqueToken");
    expect(body).toContain("buildSignedLaunchProtocolUrl");
    expect(body).not.toContain("buildMyLaunchUrl");
  });

  it("encode le jeton opaque sans le transformer", () => {
    const url = buildSignedLaunchProtocolUrl("putty", `  ${TOKEN}  `);
    expect(url).toBe(`mylaunch://putty?token=${TOKEN}`);
    expect(buildSignedLaunchProtocolUrl("sqldeveloper", "   ")).toBeNull();
    expect(buildSignedLaunchProtocolUrl("putty", "")).toBeNull();
  });

  it.each([
    ["v2", () => launchTargetBoundTool(
      { targetType: "server", envId: 9, serverId: 3, tool: "putty" },
      HOSTILE
    )],
    ["v4", () => launchPortalAdminPutty(3, "alice")],
    ["v5", () => launchFreeSshPutty("10.9.9.9", "alice")],
    ["v6", () => launchLocalTool("sqldeveloper", "alice")],
  ] as const)("envoie %s en HTTP sans repli ni cible client", async (_label, launch) => {
    const protocolUrls = installDocument();
    const seen = installFetch(false);
    const result = await launch();
    expect(result.success).toBe(true);
    const launchUrl = seen.find((url) => url.includes("/launch"));
    expect(launchUrl).toBeDefined();
    expectOpaqueToken(launchUrl ?? "");
    expect(launchUrl).toContain("http://localhost:");
    expect(protocolUrls).toEqual([]);
    expect(targetIssuer.mock.calls.length + adminIssuer.mock.calls.length + freeIssuer.mock.calls.length + localIssuer.mock.calls.length).toBe(1);
  });

  it("replie vers mylaunch avec le même jeton quand HTTP échoue en mode auto", async () => {
    process.env.NEXT_PUBLIC_LAUNCHER_TRANSPORT = "auto";
    const protocolUrls = installDocument();
    installFetch(true);
    const pending = launchLocalTool("sqldeveloper", "alice");
    await new Promise((resolve) => setTimeout(resolve, 1400));
    const result = await pending;
    expect(result.success).toBe(true);
    expect(protocolUrls).toEqual([`mylaunch://sqldeveloper?token=${TOKEN}`]);
    expect(localIssuer).toHaveBeenCalledTimes(1);
    expectOpaqueToken(protocolUrls[0]);
  });

  it("ne construit pas d'URI si le jeton est vide", async () => {
    process.env.NEXT_PUBLIC_LAUNCHER_TRANSPORT = "auto";
    freeIssuer.mockResolvedValue({ success: true, token: "   " });
    const protocolUrls = installDocument();
    const seen = installFetch(true);
    const result = await launchFreeSshPutty("10.9.9.9", "alice");
    expect(result).toEqual({ success: false, error: "Jeton de lancement absent" });
    expect(seen.filter((url) => url.includes("/launch"))).toEqual([]);
    expect(protocolUrls).toEqual([]);
  });

  it("laisse le serveur refuser un v1 transporté tel quel", async () => {
    process.env.NEXT_PUBLIC_LAUNCHER_TRANSPORT = "auto";
    const legacy = signLegacyV1Fixture({ netid: "alice", tool: "putty" }, SECRET);
    freeIssuer.mockResolvedValue({ success: true, token: legacy });
    const protocolUrls = installDocument();
    installFetch(true);
    const pending = launchFreeSshPutty("10.9.9.9", "alice");
    await new Promise((resolve) => setTimeout(resolve, 1400));
    const result = await pending;
    expect(result.success).toBe(true);
    const carried = new URL(protocolUrls[0].replace("mylaunch://", "http://token.local/")).searchParams.get("token");
    expect(carried).toBe(legacy);
    const refused = await executeLauncherToolRequest({
      token: carried,
      tool: "putty",
      secret: SECRET,
      host: "10.9.9.9",
      sshkey: "C:\\keys\\client.ppk",
    });
    expect(refused.status).toBe(403);
    expect(refused.body).toEqual({ error: "Jeton legacy refusé" });
  });

  it("garde la disponibilité v3 hors du lancement local", async () => {
    const protocolUrls = installDocument();
    const seen = installFetch(false);
    const result = await checkToolAvailability("putty", "bob", { host: "10.9.9.9", aliasql: "DB_CLIENT" });
    expect(result.success).toBe(true);
    const availability = seen.find((url) => url.includes("/api/launcher/availability"));
    expect(availability).toContain(`token=${TOKEN}`);
    expect(seen.some((url) => url.includes("/launch?"))).toBe(false);
    expect(protocolUrls).toEqual([]);
    expect(availability).not.toContain("10.9.9.9");
    expect(availability).not.toContain("DB_CLIENT");
  });

  it("confirme que les scripts locaux transportent le jeton sans cible de query", () => {
    const launcher = readFileSync(path.join(process.cwd(), "windows/launcher/launcher.ps1"), "utf8");
    const server = readFileSync(path.join(process.cwd(), "windows/launcher/launcher-server.ps1"), "utf8");
    expect(server).toContain('QueryString["token"]');
    expect(server).not.toContain('QueryString["host"]');
    expect(server).not.toContain('QueryString["sshkey"]');
    expect(launcher).toContain("Jeton de lancement absent");
    expect(launcher).toContain("n'est pas une cible signee");
    expect(launcher).not.toContain("$query['host']");
    expect(launcher).not.toContain("$query['sshkey']");
  });
});
