/**
 * @jest-environment node
 */
import fs from "fs";
import path from "path";
import { auth } from "@/auth";
import { getAllUserRoles } from "@/actions/get-all-user-roles";
import prisma from "@/lib/prisma";
import { updateMenuRoles } from "@/actions/update-menu-roles";
import {
  EMPTY_MENU_ROLES_WARNING,
  resolveMenuRoleSelection,
} from "@/components/menu/MenuRolesDialog";
import { canAccessActiveMenu, PORTAL_ADMIN_ROLE } from "@/lib/user-roles";

jest.mock("@/auth", () => ({
  auth: jest.fn(),
}));

jest.mock("@/actions/get-all-user-roles", () => ({
  getAllUserRoles: jest.fn(),
}));

jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: jest.fn(), push: jest.fn() }),
}));

jest.mock("react-toastify", () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

jest.mock("@/lib/prisma", () => ({
  __esModule: true,
  default: {
    harpmenus: { findUnique: jest.fn(), update: jest.fn() },
    harproles: { findMany: jest.fn() },
    harpmenurole: { deleteMany: jest.fn(), createMany: jest.fn() },
    $transaction: jest.fn(),
  },
}));

const session = auth as jest.Mock;
const userRoles = getAllUserRoles as jest.Mock;
const menus = prisma.harpmenus.findUnique as jest.Mock;
const catalog = prisma.harproles.findMany as jest.Mock;
const transaction = prisma.$transaction as jest.Mock;

const roles = [
  { id: 2, role: "TMA_LOCAL" },
  { id: 4, role: "FT_MOE" },
];

function asAdmin() {
  session.mockResolvedValue({ user: { id: "7" } });
  userRoles.mockResolvedValue([PORTAL_ADMIN_ROLE]);
}

describe("présélection des rôles de menu", () => {
  it("coche le rôle de la colonne lorsque harpmenurole est vide", () => {
    const selection = resolveMenuRoleSelection({
      columnRole: "TMA_LOCAL",
      linkedRoleIds: [],
      availableRoles: roles,
    });
    expect(selection.unrecognizedRole).toBeNull();
    expect(selection.selectedIds).toEqual([2]);
    expect(`${selection.selectedIds.length}/${roles.length}`).toBe("1/2");
  });

  it("déduplique l'union de la colonne et de harpmenurole", () => {
    const selection = resolveMenuRoleSelection({
      columnRole: "TMA_LOCAL",
      linkedRoleIds: [2, 4],
      availableRoles: roles,
    });
    expect(selection.selectedIds).toEqual([2, 4]);
  });

  it("signale un rôle de colonne absent du catalogue sans l'inventer", () => {
    const selection = resolveMenuRoleSelection({
      columnRole: "ANCIEN",
      linkedRoleIds: [4],
      availableRoles: roles,
    });
    expect(selection.unrecognizedRole).toBe("ANCIEN");
    expect(selection.selectedIds).toEqual([4]);
  });

  it("affiche la confirmation avant une sélection vide", () => {
    expect(EMPTY_MENU_ROLES_WARNING).toBe(
      "Attention : aucun rôle ne sera associé à ce menu. Il deviendra visible pour tous les rôles. Cela ne donne pas automatiquement accès aux familles d'environnements protégées par RBAC."
    );
    const source = fs.readFileSync(
      path.join(process.cwd(), "components", "menu", "MenuRolesDialog.tsx"),
      "utf8"
    );
    expect(source).toContain("EMPTY_MENU_ROLES_WARNING");
    expect(source).toContain("setConfirmEmpty(true)");
  });
});

describe("enregistrement de l'union menu / rôle", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    asAdmin();
    catalog.mockResolvedValue(roles);
    transaction.mockImplementation(async (callback: (tx: {
      harpmenurole: { deleteMany: jest.Mock; createMany: jest.Mock };
      harpmenus: { update: jest.Mock };
    }) => Promise<unknown>) => callback({
      harpmenurole: {
        deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
        createMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      harpmenus: {
        update: jest.fn().mockResolvedValue({ id: 3 }),
      },
    }));
  });

  it("conserve la colonne lorsque son rôle reste sélectionné", async () => {
    menus.mockResolvedValue({ id: 3, role: "TMA_LOCAL" });
    const update = jest.fn();
    const createMany = jest.fn().mockResolvedValue({ count: 1 });
    transaction.mockImplementation(async (callback: (tx: unknown) => Promise<unknown>) => callback({
      harpmenurole: { deleteMany: jest.fn(), createMany },
      harpmenus: { update },
    }));

    const result = await updateMenuRoles(3, [2, 4]);

    expect(result.success).toBe(true);
    expect(createMany).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({ menuId: 3, roleId: 2 }),
        expect.objectContaining({ menuId: 3, roleId: 4 }),
      ],
    });
    expect(update).not.toHaveBeenCalled();
    expect(canAccessActiveMenu([PORTAL_ADMIN_ROLE], ["TMA_LOCAL", "FT_MOE"])).toBe(true);
  });

  it("passe la colonne à null lorsque son rôle est décoché", async () => {
    menus.mockResolvedValue({ id: 3, role: "TMA_LOCAL" });
    const update = jest.fn().mockResolvedValue({ id: 3 });
    transaction.mockImplementation(async (callback: (tx: unknown) => Promise<unknown>) => callback({
      harpmenurole: {
        deleteMany: jest.fn(),
        createMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      harpmenus: { update },
    }));

    const result = await updateMenuRoles(3, [4]);

    expect(result.success).toBe(true);
    expect(update).toHaveBeenCalledWith({
      where: { id: 3 },
      data: { role: null },
    });
    expect(JSON.stringify(update.mock.calls)).not.toContain("PORTAL_ADMIN");
  });

  it("annule toute l'écriture si la mise à null de la colonne échoue", async () => {
    menus.mockResolvedValue({ id: 3, role: "TMA_LOCAL" });
    const persisted = { links: 0, cleared: false };
    transaction.mockImplementation(async (callback: (tx: {
      harpmenurole: { deleteMany: () => Promise<unknown>; createMany: () => Promise<unknown> };
      harpmenus: { update: () => Promise<unknown> };
    }) => Promise<unknown>) => {
      const staged = { links: 0, cleared: false };
      try {
        const value = await callback({
          harpmenurole: {
            deleteMany: async () => {
              staged.links = 0;
              return { count: 1 };
            },
            createMany: async () => {
              staged.links = 1;
              return { count: 1 };
            },
          },
          harpmenus: {
            update: async () => {
              staged.cleared = true;
              throw new Error("échec colonne");
            },
          },
        });
        persisted.links = staged.links;
        persisted.cleared = staged.cleared;
        return value;
      } catch (error) {
        throw error;
      }
    });

    const result = await updateMenuRoles(3, [4]);
    expect(result.success).toBe(false);
    expect(persisted).toEqual({ links: 0, cleared: false });
  });

  it("refuse une sélection vide tant qu'elle n'est pas confirmée", async () => {
    menus.mockResolvedValue({ id: 3, role: "TMA_LOCAL" });

    const result = await updateMenuRoles(3, []);

    expect(result.success).toBe(false);
    expect(transaction).not.toHaveBeenCalled();
  });

  it("rend le menu public après confirmation du retrait du dernier rôle", async () => {
    menus.mockResolvedValue({ id: 3, role: "TMA_LOCAL" });
    const update = jest.fn().mockResolvedValue({ id: 3 });
    const deleteMany = jest.fn().mockResolvedValue({ count: 1 });
    transaction.mockImplementation(async (callback: (tx: unknown) => Promise<unknown>) => callback({
      harpmenurole: { deleteMany, createMany: jest.fn() },
      harpmenus: { update },
    }));

    const result = await updateMenuRoles(3, [], true);

    expect(result.success).toBe(true);
    expect(deleteMany).toHaveBeenCalledWith({ where: { menuId: 3 } });
    expect(update).toHaveBeenCalledWith({ where: { id: 3 }, data: { role: null } });
    expect(canAccessActiveMenu(["FT_MOE"], [])).toBe(true);
    expect(canAccessActiveMenu([PORTAL_ADMIN_ROLE], [])).toBe(true);
  });

  it("refuse d'enregistrer une restriction historique inconnue", async () => {
    menus.mockResolvedValue({ id: 3, role: "ANCIEN" });

    const result = await updateMenuRoles(3, [4]);

    expect(result).toMatchObject({
      success: false,
      error: "Ce menu porte une restriction historique non reconnue. L'enregistrement est refusé.",
    });
    expect(transaction).not.toHaveBeenCalled();
  });

  it("refuse l'enregistrement à un non-admin", async () => {
    session.mockResolvedValue({ user: { id: "7" } });
    userRoles.mockResolvedValue(["TMA_LOCAL"]);

    const result = await updateMenuRoles(3, [2]);

    expect(result).toEqual({ success: false, error: "Accès refusé" });
    expect(menus).not.toHaveBeenCalled();
  });

  it("ne modifie pas le moteur de visibilité ni le RBAC des familles", () => {
    const action = fs.readFileSync(
      path.join(process.cwd(), "actions", "update-menu-roles.ts"),
      "utf8"
    );
    const engine = fs.readFileSync(
      path.join(process.cwd(), "lib", "user-roles.ts"),
      "utf8"
    );
    expect(action).not.toContain("canAccessTypeEnv");
    expect(action).not.toContain("harpsubrole");
    expect(engine).toContain("if (hasRole(userRoles, PORTAL_ADMIN_ROLE))");
    expect(engine).toContain("return menuRoles.length === 0 || hasAnyRole(userRoles, menuRoles);");
  });
});
