/**
 * @jest-environment node
 */
import { auth } from "@/auth";
import { getAllUserRoles } from "@/actions/get-all-user-roles";
import prisma from "@/lib/prisma";
import { authorizeLauncherTargetForSession } from "@/lib/launcher-target-access";

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
    harpsubrole: {
      active: true,
      harpsubroletypenv: [{ typenvid }],
    },
  };
}

function asUser(userRoles: string[] | null) {
  if (userRoles == null) {
    sessionAuth.mockResolvedValue(null);
    roles.mockResolvedValue([]);
    return;
  }
  sessionAuth.mockResolvedValue({ user: { id: "7" } });
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

describe("autorisation des cibles launcher", () => {
  beforeEach(() => {
    sessionAuth.mockReset();
    roles.mockReset();
    findEnv.mockReset();
    findServer.mockReset();
    findLink.mockReset();
    findGrants.mockReset();
    findScopes.mockReset();
    asUser(["TMA_LOCAL"]);
    findEnv.mockResolvedValue(envRow());
    findGrants.mockResolvedValue([grant(11)]);
    findScopes.mockResolvedValue([{ harpscope: { id: 41, code: "4K" } }]);
    findServer.mockResolvedValue({ id: 5, srv: "srvA", ip: "10.1.1.1" });
    findLink.mockResolvedValue({ id: 100 });
  });

  it("autorise PuTTY quand la famille, le scope et le lien sont valides", async () => {
    const result = await authorizeLauncherTargetForSession({
      targetType: "server",
      envId: 9,
      serverId: 5,
      tool: "putty",
    });
    expect(result).toEqual({
      authorized: true,
      targetType: "server",
      envId: 9,
      serverId: 5,
      tool: "putty",
      hostname: "srvA",
      ip: "10.1.1.1",
    });
    expect(findLink).toHaveBeenCalledWith({
      where: { envId: 9, serverId: 5 },
      select: { id: true },
    });
  });

  it("autorise FileZilla sur le même lien", async () => {
    const result = await authorizeLauncherTargetForSession({
      targetType: "server",
      envId: 9,
      serverId: 5,
      tool: "filezilla",
    });
    expect(result.authorized).toBe(true);
    if (result.authorized && result.targetType === "server") {
      expect(result.ip).toBe("10.1.1.1");
    }
  });

  it("refuse une famille RBAC non accordée avant de lire le serveur", async () => {
    findEnv.mockResolvedValue(envRow({ typenvid: 13 }));
    const result = await authorizeLauncherTargetForSession({
      targetType: "server",
      envId: 9,
      serverId: 5,
      tool: "putty",
    });
    expect(result).toEqual({ authorized: false, reason: "forbidden" });
    expect(findServer).not.toHaveBeenCalled();
    expect(findLink).not.toHaveBeenCalled();
  });

  it("refuse un scope incompatible alors que le serveur est lié", async () => {
    findScopes.mockResolvedValue([{ harpscope: { id: 52, code: "150K" } }]);
    const result = await authorizeLauncherTargetForSession({
      targetType: "server",
      envId: 9,
      serverId: 5,
      tool: "putty",
    });
    expect(result).toEqual({ authorized: false, reason: "forbidden" });
    expect(findLink).not.toHaveBeenCalled();
  });

  it("refuse un serveur existant qui n'appartient pas à l'environnement", async () => {
    findLink.mockResolvedValue(null);
    const result = await authorizeLauncherTargetForSession({
      targetType: "server",
      envId: 9,
      serverId: 5,
      tool: "putty",
    });
    expect(result).toEqual({ authorized: false, reason: "server_not_linked" });
    expect(result).not.toHaveProperty("ip");
  });

  it("refuse un serveur inexistant", async () => {
    findServer.mockResolvedValue(null);
    const result = await authorizeLauncherTargetForSession({
      targetType: "server",
      envId: 9,
      serverId: 8,
      tool: "filezilla",
    });
    expect(result).toEqual({ authorized: false, reason: "server_not_found" });
    expect(findLink).not.toHaveBeenCalled();
  });

  it("accepte le couple dès qu'une ligne harpenvserv existe", async () => {
    findLink.mockResolvedValue({ id: 400 });
    const result = await authorizeLauncherTargetForSession({
      targetType: "server",
      envId: 9,
      serverId: 5,
      tool: "putty",
    });
    expect(result.authorized).toBe(true);
    expect(findLink).toHaveBeenCalledTimes(1);
  });

  it("autorise PORTAL_ADMIN sur un serveur réellement lié, y compris hors famille", async () => {
    asUser(["PORTAL_ADMIN"]);
    findEnv.mockResolvedValue(envRow({ typenvid: 13, scopeId: null }));
    const result = await authorizeLauncherTargetForSession({
      targetType: "server",
      envId: 9,
      serverId: 5,
      tool: "putty",
    });
    expect(result.authorized).toBe(true);
    expect(findGrants).not.toHaveBeenCalled();
    expect(findScopes).not.toHaveBeenCalled();
    expect(findLink).toHaveBeenCalled();
  });

  it("refuse PORTAL_ADMIN si le serveur n'est pas lié à cet environnement", async () => {
    asUser(["PORTAL_ADMIN"]);
    findLink.mockResolvedValue(null);
    const result = await authorizeLauncherTargetForSession({
      targetType: "server",
      envId: 9,
      serverId: 5,
      tool: "putty",
    });
    expect(result).toEqual({ authorized: false, reason: "server_not_linked" });
  });

  it("ignore une IP client et relit celle de harpserve", async () => {
    const result = await authorizeLauncherTargetForSession({
      targetType: "server",
      envId: 9,
      serverId: 5,
      tool: "putty",
      ip: "9.9.9.9",
      hostname: "pirate",
    } as never);
    expect(result).toMatchObject({ authorized: true, ip: "10.1.1.1", hostname: "srvA" });
  });

  it("autorise SQL*Plus avec l'alias relu sur envsharp", async () => {
    const result = await authorizeLauncherTargetForSession({
      targetType: "environment",
      envId: 9,
      tool: "sqlplus",
      aliasql: "ALIAS_CLIENT",
    } as never);
    expect(result).toEqual({
      authorized: true,
      targetType: "environment",
      envId: 9,
      tool: "sqlplus",
      aliasql: "ALIAS_DB",
    });
  });

  it("autorise PSIDE avec la version et l'alias relus en base", async () => {
    const result = await authorizeLauncherTargetForSession({
      targetType: "environment",
      envId: 9,
      tool: "pside",
      ptversion: "8.99",
      aliasql: "AUTRE",
    } as never);
    expect(result).toEqual({
      authorized: true,
      targetType: "environment",
      envId: 9,
      tool: "pside",
      aliasql: "ALIAS_DB",
      ptversion: "8.61",
    });
  });

  it("autorise PSDMT de la même façon", async () => {
    const result = await authorizeLauncherTargetForSession({
      targetType: "environment",
      envId: 9,
      tool: "psdmt",
    });
    expect(result).toMatchObject({
      authorized: true,
      tool: "psdmt",
      aliasql: "ALIAS_DB",
      ptversion: "8.61",
    });
  });

  it("refuse SQL*Plus si l'alias en base est vide", async () => {
    findEnv.mockResolvedValue(envRow({ aliasql: "  " }));
    const result = await authorizeLauncherTargetForSession({
      targetType: "environment",
      envId: 9,
      tool: "sqlplus",
    });
    expect(result).toEqual({ authorized: false, reason: "target_unresolved" });
  });

  it("refuse PSIDE si la version en base est inutilisable", async () => {
    findEnv.mockResolvedValue(envRow({ ptversion: "inconnue" }));
    const result = await authorizeLauncherTargetForSession({
      targetType: "environment",
      envId: 9,
      tool: "pside",
    });
    expect(result).toEqual({ authorized: false, reason: "target_unresolved" });
  });

  it("refuse la famille pour une cible environnement", async () => {
    findEnv.mockResolvedValue(envRow({ typenvid: 13 }));
    const result = await authorizeLauncherTargetForSession({
      targetType: "environment",
      envId: 9,
      tool: "sqlplus",
    });
    expect(result).toEqual({ authorized: false, reason: "forbidden" });
    expect(result).not.toHaveProperty("aliasql");
  });

  it("refuse le scope pour une cible environnement", async () => {
    findScopes.mockResolvedValue([{ harpscope: { id: 52, code: "4K" } }]);
    const result = await authorizeLauncherTargetForSession({
      targetType: "environment",
      envId: 9,
      tool: "psdmt",
    });
    expect(result).toEqual({ authorized: false, reason: "forbidden" });
  });

  it("autorise PORTAL_ADMIN sur l'environnement sans filtre de scope", async () => {
    asUser(["PORTAL_ADMIN"]);
    findEnv.mockResolvedValue(envRow({ typenvid: 13, scopeId: null }));
    const result = await authorizeLauncherTargetForSession({
      targetType: "environment",
      envId: 9,
      tool: "sqlplus",
    });
    expect(result).toMatchObject({ authorized: true, tool: "sqlplus", aliasql: "ALIAS_DB" });
  });

  it("refuse sans session et ne lit pas l'environnement", async () => {
    asUser(null);
    const result = await authorizeLauncherTargetForSession({
      targetType: "server",
      envId: 9,
      serverId: 5,
      tool: "putty",
    });
    expect(result).toEqual({ authorized: false, reason: "unauthenticated" });
    expect(findEnv).not.toHaveBeenCalled();
  });

  it.each([0, -4, 1.5, "9"])("refuse l'envId %s", async (envId) => {
    const result = await authorizeLauncherTargetForSession({
      targetType: "environment",
      envId,
      tool: "sqlplus",
    });
    expect(result).toEqual({ authorized: false, reason: "invalid_environment" });
    expect(findEnv).not.toHaveBeenCalled();
  });

  it("refuse un environnement absent", async () => {
    findEnv.mockResolvedValue(null);
    const result = await authorizeLauncherTargetForSession({
      targetType: "environment",
      envId: 9,
      tool: "sqlplus",
    });
    expect(result).toEqual({ authorized: false, reason: "environment_not_found" });
  });

  it.each(["winscp", "notepad", "", "PUTTY"])("refuse l'outil non supporté %s", async (tool) => {
    const result = await authorizeLauncherTargetForSession({
      targetType: "server",
      envId: 9,
      serverId: 5,
      tool,
    });
    expect(result).toEqual({ authorized: false, reason: "unsupported_tool" });
    expect(findEnv).not.toHaveBeenCalled();
  });

  it("refuse un outil d'environnement présenté comme un serveur", async () => {
    const result = await authorizeLauncherTargetForSession({
      targetType: "server",
      envId: 9,
      serverId: 5,
      tool: "sqlplus",
    });
    expect(result).toEqual({ authorized: false, reason: "unsupported_tool" });
  });

  it("refuse un serverId absent ou invalide", async () => {
    const missing = await authorizeLauncherTargetForSession({
      targetType: "server",
      envId: 9,
      serverId: undefined,
      tool: "putty",
    });
    const negative = await authorizeLauncherTargetForSession({
      targetType: "server",
      envId: 9,
      serverId: -1,
      tool: "filezilla",
    });
    expect(missing).toEqual({ authorized: false, reason: "invalid_server" });
    expect(negative).toEqual({ authorized: false, reason: "invalid_server" });
    expect(findEnv).not.toHaveBeenCalled();
  });
});
