/**
 * @jest-environment node
 */
import { requirePortalAdmin } from "@/lib/require-portal-admin";
import prisma from "@/lib/prisma";
import {
  attachSubroleToRole,
  createSubroleAndAttach,
  detachSubroleFromRole,
  grantFamilyThroughSubrole,
  readRoleSubroles,
  revokeFamilyFromSubrole,
} from "@/actions/rbac-admin";
import { getHarpRoleByIdWithUsers } from "@/lib/actions/harprole-actions";
import { loadFamilyAccess } from "@/lib/rbac-admin-read";

jest.mock("@/lib/require-portal-admin", () => ({
  requirePortalAdmin: jest.fn(),
}));

jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}));

jest.mock("@/lib/prisma", () => ({
  __esModule: true,
  default: {
    harproles: { findUnique: jest.fn(), findMany: jest.fn() },
    harpsubrole: { findUnique: jest.fn(), findMany: jest.fn(), create: jest.fn(), delete: jest.fn() },
    harprolesubrole: { findUnique: jest.fn(), findMany: jest.fn(), create: jest.fn(), deleteMany: jest.fn() },
    harpsubroletypenv: { findUnique: jest.fn(), findMany: jest.fn(), create: jest.fn(), deleteMany: jest.fn(), delete: jest.fn() },
    harptypenv: { findUnique: jest.fn(), findFirst: jest.fn() },
    harpmenus: { findUnique: jest.fn() },
    $transaction: jest.fn(),
  },
}));

const adminGuard = requirePortalAdmin as jest.MockedFunction<typeof requirePortalAdmin>;
const roles = prisma.harproles.findUnique as jest.Mock;
const subroles = prisma.harpsubrole.findUnique as jest.Mock;
const subroleCreate = prisma.harpsubrole.create as jest.Mock;
const subroleDelete = prisma.harpsubrole.delete as jest.Mock;
const links = prisma.harprolesubrole.findUnique as jest.Mock;
const linkCreate = prisma.harprolesubrole.create as jest.Mock;
const linkDelete = prisma.harprolesubrole.deleteMany as jest.Mock;
const familyLinks = prisma.harpsubroletypenv.findUnique as jest.Mock;
const familyCreate = prisma.harpsubroletypenv.create as jest.Mock;
const familyDelete = prisma.harpsubroletypenv.deleteMany as jest.Mock;
const families = prisma.harptypenv.findUnique as jest.Mock;
const transaction = prisma.$transaction as jest.Mock;

describe("garde des mutations RBAC", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    transaction.mockImplementation(async (callback: (tx: typeof prisma) => Promise<unknown>) => callback(prisma));
  });

  it("refuse une mutation sans session", async () => {
    adminGuard.mockResolvedValue({ ok: false, error: "Non authentifié" });
    await expect(attachSubroleToRole(1, 2)).resolves.toEqual({ success: false, error: "Non authentifié" });
    expect(linkCreate).not.toHaveBeenCalled();
  });

  it("refuse une mutation à un non-admin", async () => {
    adminGuard.mockResolvedValue({ ok: false, error: "Accès refusé" });
    await expect(detachSubroleFromRole(1, 2)).resolves.toEqual({ success: false, error: "Accès refusé" });
    expect(linkDelete).not.toHaveBeenCalled();
  });

  it("refuse la lecture du rôle hors administration", async () => {
    adminGuard.mockResolvedValue({ ok: false, error: "Accès refusé" });
    await expect(getHarpRoleByIdWithUsers(3)).resolves.toBeNull();
    await expect(readRoleSubroles(3)).resolves.toEqual({ success: false, error: "Accès refusé" });
    expect(roles).not.toHaveBeenCalled();
  });
});

describe("rôle et sous-rôle", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    adminGuard.mockResolvedValue({ ok: true });
    transaction.mockImplementation(async (callback: (tx: typeof prisma) => Promise<unknown>) => callback(prisma));
  });

  it("associe un sous-rôle existant", async () => {
    roles.mockResolvedValue({ id: 1 });
    subroles.mockResolvedValue({ id: 2 });
    links.mockResolvedValue(null);
    linkCreate.mockResolvedValue({ roleId: 1, subroleId: 2 });

    await expect(attachSubroleToRole(1, 2)).resolves.toMatchObject({ success: true });
    expect(linkCreate).toHaveBeenCalledWith({ data: { roleId: 1, subroleId: 2 } });
  });

  it("refuse un doublon d'association", async () => {
    roles.mockResolvedValue({ id: 1 });
    subroles.mockResolvedValue({ id: 2 });
    links.mockResolvedValue({ roleId: 1 });

    await expect(attachSubroleToRole(1, 2)).resolves.toMatchObject({
      success: false,
      error: "Ce sous-rôle est déjà associé à ce rôle",
    });
    expect(linkCreate).not.toHaveBeenCalled();
  });

  it("retire seulement l'association", async () => {
    linkDelete.mockResolvedValue({ count: 1 });

    await expect(detachSubroleFromRole(1, 2)).resolves.toMatchObject({ success: true });
    expect(linkDelete).toHaveBeenCalledWith({ where: { roleId: 1, subroleId: 2 } });
    expect(subroleDelete).not.toHaveBeenCalled();
    expect(familyDelete).not.toHaveBeenCalled();
  });

  it("laisse un sous-rôle partagé intact pour les autres rôles", async () => {
    linkDelete.mockResolvedValue({ count: 1 });

    await detachSubroleFromRole(4, 2);

    expect(linkDelete).toHaveBeenCalledWith({ where: { roleId: 4, subroleId: 2 } });
    expect(subroleDelete).not.toHaveBeenCalled();
    expect(familyDelete).not.toHaveBeenCalled();
  });

  it("associe aussi un sous-rôle inactif", async () => {
    roles.mockResolvedValue({ id: 1 });
    subroles.mockResolvedValue({ id: 2, active: false });
    links.mockResolvedValue(null);
    linkCreate.mockResolvedValue({ roleId: 1, subroleId: 2 });

    await expect(attachSubroleToRole(1, 2)).resolves.toMatchObject({ success: true });
    expect(linkCreate).toHaveBeenCalledWith({ data: { roleId: 1, subroleId: 2 } });
  });

  it("crée un sous-rôle puis l'associe sans famille", async () => {
    roles.mockResolvedValue({ id: 1 });
    subroles.mockResolvedValue(null);
    subroleCreate.mockResolvedValue({ id: 8 });
    linkCreate.mockResolvedValue({ roleId: 1, subroleId: 8 });

    await expect(createSubroleAndAttach(1, "FT-MOE", "MOE")).resolves.toMatchObject({ success: true });
    expect(subroleCreate).toHaveBeenCalled();
    expect(linkCreate).toHaveBeenCalledWith({ data: { roleId: 1, subroleId: 8 } });
    expect(familyCreate).not.toHaveBeenCalled();
  });
});

describe("sous-rôle et famille", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    adminGuard.mockResolvedValue({ ok: true });
    transaction.mockImplementation(async (callback: (tx: typeof prisma) => Promise<unknown>) => callback(prisma));
  });

  it("accorde une famille à un sous-rôle déjà porté par le rôle", async () => {
    roles.mockResolvedValue({ id: 1 });
    families.mockResolvedValue({ typenvid: 10 });
    links.mockResolvedValue({ roleId: 1 });
    familyLinks.mockResolvedValue(null);
    familyCreate.mockResolvedValue({ subroleId: 2, typenvid: 10 });
    (prisma.harprolesubrole.findMany as jest.Mock).mockResolvedValue([
      { harproles: { role: "TMA_LOCAL" } },
      { harproles: { role: "FT-MOE" } },
    ]);

    const result = await grantFamilyThroughSubrole({ roleId: 1, typenvid: 10, subroleId: 2 });
    expect(result.success).toBe(true);
    expect(result.sharedRoles).toEqual(["FT-MOE", "TMA_LOCAL"]);
    expect(familyCreate).toHaveBeenCalledWith({ data: { subroleId: 2, typenvid: 10 } });
    expect(transaction).not.toHaveBeenCalled();
  });

  it("crée, associe et accorde la famille dans une seule transaction", async () => {
    roles.mockResolvedValue({ id: 1 });
    families.mockResolvedValue({ typenvid: 10 });
    subroles.mockResolvedValue(null);
    subroleCreate.mockResolvedValue({ id: 8 });
    linkCreate.mockResolvedValue({ roleId: 1, subroleId: 8 });
    familyCreate.mockResolvedValue({ subroleId: 8, typenvid: 10 });
    (prisma.harprolesubrole.findMany as jest.Mock).mockResolvedValue([
      { harproles: { role: "TMA_LOCAL" } },
    ]);

    const result = await grantFamilyThroughSubrole({
      roleId: 1,
      typenvid: 10,
      newSubrole: { code: "FT-MOE", descr: "MOE" },
    });

    expect(result.success).toBe(true);
    expect(transaction).toHaveBeenCalledTimes(1);
    expect(subroleCreate).toHaveBeenCalledTimes(1);
    expect(linkCreate).toHaveBeenCalledWith({ data: { roleId: 1, subroleId: 8 } });
    expect(familyCreate).toHaveBeenCalledTimes(1);
    expect(familyCreate).toHaveBeenCalledWith({ data: { subroleId: 8, typenvid: 10 } });
  });

  it("annule sous-rôle et association si le grant échoue", async () => {
    const persisted = { subroles: 0, links: 0, grants: 0 };
    roles.mockResolvedValue({ id: 1 });
    families.mockResolvedValue({ typenvid: 10 });
    subroles.mockResolvedValue(null);
    transaction.mockImplementation(async (callback: (tx: {
      harpsubrole: { create: () => Promise<{ id: number }> };
      harprolesubrole: { create: () => Promise<unknown> };
      harpsubroletypenv: { create: () => Promise<unknown> };
    }) => Promise<unknown>) => {
      const staged = { subroles: 0, links: 0, grants: 0 };
      const tx = {
        harpsubrole: {
          create: async () => {
            staged.subroles += 1;
            return { id: 8 };
          },
        },
        harprolesubrole: {
          create: async () => {
            staged.links += 1;
            return { roleId: 1, subroleId: 8 };
          },
        },
        harpsubroletypenv: {
          create: async () => {
            staged.grants += 1;
            throw new Error("échec grant");
          },
        },
      };
      try {
        const result = await callback(tx);
        persisted.subroles += staged.subroles;
        persisted.links += staged.links;
        persisted.grants += staged.grants;
        return result;
      } catch (error) {
        throw error;
      }
    });

    await expect(grantFamilyThroughSubrole({
      roleId: 1,
      typenvid: 10,
      newSubrole: { code: "ORPHELIN", descr: "partiel" },
    })).rejects.toThrow("échec grant");
    expect(persisted).toEqual({ subroles: 0, links: 0, grants: 0 });
    expect(subroleCreate).not.toHaveBeenCalled();
    expect(linkCreate).not.toHaveBeenCalled();
    expect(familyCreate).not.toHaveBeenCalled();
  });

  it("refuse un grant déjà présent", async () => {
    roles.mockResolvedValue({ id: 1 });
    families.mockResolvedValue({ typenvid: 10 });
    links.mockResolvedValue({ roleId: 1 });
    familyLinks.mockResolvedValue({ subroleId: 2 });

    await expect(grantFamilyThroughSubrole({ roleId: 1, typenvid: 10, subroleId: 2 })).resolves.toMatchObject({
      success: false,
      error: "Cette famille est déjà accordée à ce sous-rôle",
    });
    expect(familyCreate).not.toHaveBeenCalled();
  });

  it("retire seulement le lien sous-rôle / famille", async () => {
    families.mockResolvedValue({ typenvid: 10 });
    subroles.mockResolvedValue({ id: 2 });
    (prisma.harprolesubrole.findMany as jest.Mock).mockResolvedValue([
      { harproles: { role: "TMA_LOCAL" } },
      { harproles: { role: "FT-MOE" } },
    ]);
    familyDelete.mockResolvedValue({ count: 1 });

    const result = await revokeFamilyFromSubrole(2, 10);
    expect(result.success).toBe(true);
    expect(familyDelete).toHaveBeenCalledWith({ where: { subroleId: 2, typenvid: 10 } });
    expect(subroleDelete).not.toHaveBeenCalled();
    expect(linkDelete).not.toHaveBeenCalled();
  });

  it("refuse une famille absente ou un typenvid invalide", async () => {
    await expect(revokeFamilyFromSubrole(2, 0)).resolves.toMatchObject({ success: false });
    expect(families).not.toHaveBeenCalled();

    roles.mockResolvedValue({ id: 1 });
    families.mockResolvedValue(null);
    links.mockResolvedValue({ roleId: 1 });
    await expect(grantFamilyThroughSubrole({ roleId: 1, typenvid: 99, subroleId: 2 })).resolves.toMatchObject({
      success: false,
      error: "Famille introuvable",
    });
    expect(familyCreate).not.toHaveBeenCalled();
  });

  it("indique avant attribution les rôles qui partagent le sous-rôle", async () => {
    families.mockResolvedValue({ typenv: "DEV", descr: "Dev", typenvid: 10 });
    (prisma.harpsubroletypenv.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.harproles.findMany as jest.Mock).mockResolvedValue([
      {
        id: 1,
        role: "TMA_LOCAL",
        descr: "TMA",
        harprolesubrole: [{
          harpsubrole: {
            id: 2,
            code: "SHARED",
            active: true,
            harprolesubrole: [
              { harproles: { role: "TMA_LOCAL" } },
              { harproles: { role: "FT-MOE" } },
            ],
          },
        }],
      },
    ]);

    const result = await loadFamilyAccess(10);
    expect(result.ok).toBe(true);
    if (!result.ok || result.data == null) {
      throw new Error("vue de famille attendue");
    }
    expect(result.data.roles[0].subroles[0].sharedRoles).toEqual(["TMA_LOCAL", "FT-MOE"]);
  });
});
