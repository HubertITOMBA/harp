/**
 * @jest-environment node
 */
import { requirePortalAdmin } from "@/lib/require-portal-admin";
import prisma from "@/lib/prisma";
import { db } from "@/lib/db";
import { deleteEnvsharp, updateEnvsharp } from "@/actions/envs.actions";
import { createServer } from "@/actions/create-server";
import { updateServer } from "@/actions/update-server";
import { toggleServerStatus } from "@/actions/toggle-server-status";
import { createServRole } from "@/actions/create-servrole";
import { updateServRole } from "@/actions/update-servrole";
import { createInstOra } from "@/actions/create-instora";
import { updateInstOra } from "@/actions/update-instora";
import { toggleInstOraStatus } from "@/actions/toggle-instora-status";
import { createRole } from "@/actions/create-role";
import { updateRole } from "@/actions/update-role";
import { migrateTmaLocalToUser } from "@/actions/migrate-tma-local-to-user";
import { migratePsadmData } from "@/actions/importOra";

jest.mock("@/lib/require-portal-admin", () => ({
  requirePortalAdmin: jest.fn(),
}));

jest.mock("@/lib/environment-access", () => ({
  environmentVisibilityWhere: jest.fn(),
  loadEnvironmentAccessContextForSession: jest.fn(),
}));

jest.mock("react-toastify", () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

jest.mock("@/lib/prisma", () => ({
  __esModule: true,
  default: {
    envsharp: { delete: jest.fn(), update: jest.fn() },
    harproles: { findMany: jest.fn(), updateMany: jest.fn() },
    harpuseroles: { deleteMany: jest.fn() },
    user: { updateMany: jest.fn() },
    $executeRaw: jest.fn(),
  },
}));

jest.mock("@/lib/db", () => ({
  db: {
    harpserve: { findFirst: jest.fn(), create: jest.fn(), update: jest.fn() },
    harproles: { findFirst: jest.fn(), create: jest.fn(), update: jest.fn() },
    psadm_rolesrv: { create: jest.fn(), deleteMany: jest.fn() },
    harpinstance: { create: jest.fn(), update: jest.fn(), findUnique: jest.fn() },
  },
}));

jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}));

const adminGuard = requirePortalAdmin as jest.MockedFunction<typeof requirePortalAdmin>;
const deleteEnv = prisma.envsharp.delete as jest.Mock;
const updateEnv = prisma.envsharp.update as jest.Mock;
const createSrv = db.harpserve.create as jest.Mock;
const createHarpRole = db.harproles.create as jest.Mock;
const deleteRoles = prisma.harpuseroles.deleteMany as jest.Mock;

describe("écritures environnement et référentiel", () => {
  beforeEach(() => {
    adminGuard.mockReset();
    deleteEnv.mockReset();
    updateEnv.mockReset();
    createSrv.mockReset();
    createHarpRole.mockReset();
    deleteRoles.mockReset();
  });

  it("refuse updateEnvsharp sans PORTAL_ADMIN et n'écrit pas", async () => {
    adminGuard.mockResolvedValue({ ok: false, error: "Accès refusé" });
    const result = await updateEnvsharp({ id: 4, env: "X" } as never);
    expect(result).toEqual({ success: false, message: "Accès refusé" });
    expect(updateEnv).not.toHaveBeenCalled();
  });

  it("refuse updateEnvsharp sans session et n'écrit pas", async () => {
    adminGuard.mockResolvedValue({ ok: false, error: "Non authentifié" });
    const result = await updateEnvsharp({ id: 4, env: "X" } as never);
    expect(result).toEqual({ success: false, message: "Non authentifié" });
    expect(updateEnv).not.toHaveBeenCalled();
  });

  it("autorise updateEnvsharp pour PORTAL_ADMIN", async () => {
    adminGuard.mockResolvedValue({ ok: true });
    updateEnv.mockResolvedValue({ id: 4 });
    const result = await updateEnvsharp({ id: 4, env: "X" } as never);
    expect(result.success).toBe(true);
    expect(updateEnv).toHaveBeenCalled();
  });

  it("refuse deleteEnvsharp sans PORTAL_ADMIN et ne supprime rien", async () => {
    adminGuard.mockResolvedValue({ ok: false, error: "Accès refusé" });
    const result = await deleteEnvsharp(4);
    expect(result).toEqual({ success: false, message: "Accès refusé" });
    expect(deleteEnv).not.toHaveBeenCalled();
  });

  it("refuse deleteEnvsharp sans session et ne supprime rien", async () => {
    adminGuard.mockResolvedValue({ ok: false, error: "Non authentifié" });
    const result = await deleteEnvsharp(4);
    expect(result).toEqual({ success: false, message: "Non authentifié" });
    expect(deleteEnv).not.toHaveBeenCalled();
  });

  it("autorise deleteEnvsharp pour PORTAL_ADMIN", async () => {
    adminGuard.mockResolvedValue({ ok: true });
    deleteEnv.mockResolvedValue({ id: 4 });
    const result = await deleteEnvsharp(4);
    expect(result.success).toBe(true);
    expect(deleteEnv).toHaveBeenCalledWith({ where: { id: 4 } });
  });

  it("refuse la création d'un serveur sans PORTAL_ADMIN", async () => {
    adminGuard.mockResolvedValue({ ok: false, error: "Accès refusé" });
    const form = new FormData();
    form.set("srv", "srv1");
    form.set("ip", "10.0.0.1");
    form.set("pshome", "/opt");
    const result = await createServer(form);
    expect(result).toEqual({ success: false, error: "Accès refusé" });
    expect(createSrv).not.toHaveBeenCalled();
  });

  it("refuse la création d'un rôle HARP sans session", async () => {
    adminGuard.mockResolvedValue({ ok: false, error: "Non authentifié" });
    const form = new FormData();
    form.set("role", "NOUVEAU");
    form.set("descr", "test");
    const result = await createRole(form);
    expect(result).toEqual({ success: false, error: "Non authentifié" });
    expect(createHarpRole).not.toHaveBeenCalled();
  });

  it("refuse la migration TMA_LOCAL sans PORTAL_ADMIN et n'écrit pas", async () => {
    adminGuard.mockResolvedValue({ ok: false, error: "Accès refusé" });
    const result = await migrateTmaLocalToUser();
    expect(result.success).toBe(false);
    expect(deleteRoles).not.toHaveBeenCalled();
    expect(prisma.harproles.updateMany).not.toHaveBeenCalled();
    expect(prisma.user.updateMany).not.toHaveBeenCalled();
  });

  it("refuse migratePsadmData sans session et n'exécute aucun SQL", async () => {
    adminGuard.mockResolvedValue({ ok: false, error: "Non authentifié" });
    const result = await migratePsadmData();
    expect(result).toEqual({ success: false, error: "Non authentifié" });
    expect(prisma.$executeRaw).not.toHaveBeenCalled();
  });

  it.each([
    ["updateServer", () => updateServer("srv1", new FormData()), db.harpserve.update],
    ["toggleServerStatus", () => toggleServerStatus(1, true), db.harpserve.update],
    ["createServRole", () => createServRole(new FormData()), db.psadm_rolesrv.create],
    [
      "updateServRole",
      () => updateServRole("a", "b", "c", new FormData()),
      db.psadm_rolesrv.deleteMany,
    ],
    ["createInstOra", () => createInstOra(new FormData()), db.harpinstance.create],
    ["updateInstOra", () => updateInstOra(1, new FormData()), db.harpinstance.update],
    ["toggleInstOraStatus", () => toggleInstOraStatus(1, true), db.harpserve.update],
    ["updateRole", () => updateRole(1, new FormData()), db.harproles.update],
  ])("refuse %s sans PORTAL_ADMIN et n'écrit pas", async (_name, call, write) => {
    adminGuard.mockResolvedValue({ ok: false, error: "Accès refusé" });
    const result = await call();
    expect(result).toEqual({ success: false, error: "Accès refusé" });
    expect(write).not.toHaveBeenCalled();
  });
});
