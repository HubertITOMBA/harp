/**
 * @jest-environment node
 */
import { auth } from "@/auth";
import { getAllUserRoles } from "@/actions/get-all-user-roles";
import prisma from "@/lib/prisma";
import { db } from "@/lib/db";
import { createMenu } from "@/actions/create-menu";
import { updateMenu } from "@/actions/update-menu";
import { toggleMenuStatus } from "@/actions/toggle-menu-status";
import {
  addRoleToMenu,
  removeRoleFromMenu,
  updateMenuRoles,
} from "@/actions/update-menu-roles";

jest.mock("@/auth", () => ({
  auth: jest.fn(),
}));

jest.mock("@/actions/get-all-user-roles", () => ({
  getAllUserRoles: jest.fn(),
}));

jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}));

jest.mock("@/lib/prisma", () => ({
  __esModule: true,
  default: {
    harpmenus: { findUnique: jest.fn() },
    harproles: { findMany: jest.fn() },
    harpmenurole: {
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

jest.mock("@/lib/db", () => ({
  db: {
    harpmenus: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}));

const session = auth as jest.Mock;
const roles = getAllUserRoles as jest.Mock;

function menuForm() {
  const form = new FormData();
  form.set("menu", "ACCUEIL");
  form.set("href", "/accueil");
  form.set("descr", "Accueil");
  form.set("display", "1");
  form.set("level", "0");
  form.set("active", "1");
  return form;
}

function asVisitor(userRoles: string[] | null) {
  if (userRoles === null) {
    session.mockResolvedValue(null);
    return;
  }
  session.mockResolvedValue({ user: { id: "7" } });
  roles.mockResolvedValue(userRoles);
}

function expectNoMenuAccess() {
  expect(db.harpmenus.findUnique).not.toHaveBeenCalled();
  expect(db.harpmenus.create).not.toHaveBeenCalled();
  expect(db.harpmenus.update).not.toHaveBeenCalled();
  expect(prisma.harpmenus.findUnique).not.toHaveBeenCalled();
  expect(prisma.harproles.findMany).not.toHaveBeenCalled();
  expect(prisma.harpmenurole.findUnique).not.toHaveBeenCalled();
  expect(prisma.harpmenurole.create).not.toHaveBeenCalled();
  expect(prisma.harpmenurole.delete).not.toHaveBeenCalled();
  expect(prisma.$transaction).not.toHaveBeenCalled();
}

const directCalls: Array<[string, () => Promise<{ success: boolean; error?: string }>]> = [
  ["createMenu", () => createMenu(menuForm())],
  ["updateMenu", () => updateMenu(3, menuForm())],
  ["toggleMenuStatus", () => toggleMenuStatus(3)],
  ["updateMenuRoles", () => updateMenuRoles(3, [1])],
  ["addRoleToMenu", () => addRoleToMenu(3, 1)],
  ["removeRoleFromMenu", () => removeRoleFromMenu(3, 1)],
];

describe("écritures menus", () => {
  beforeEach(() => {
    session.mockReset();
    roles.mockReset();
    (db.harpmenus.findUnique as jest.Mock).mockReset();
    (db.harpmenus.create as jest.Mock).mockReset();
    (db.harpmenus.update as jest.Mock).mockReset();
    (prisma.harpmenus.findUnique as jest.Mock).mockReset();
    (prisma.harproles.findMany as jest.Mock).mockReset();
    (prisma.harpmenurole.findUnique as jest.Mock).mockReset();
    (prisma.harpmenurole.create as jest.Mock).mockReset();
    (prisma.harpmenurole.delete as jest.Mock).mockReset();
    (prisma.$transaction as jest.Mock).mockReset();
  });

  it.each(directCalls)("refuse %s sans session et n'écrit pas", async (_name, call) => {
    asVisitor(null);
    const result = await call();
    expect(result).toEqual({ success: false, error: "Non authentifié" });
    expectNoMenuAccess();
  });

  it.each([
    ["PSADMIN"],
    ["TMA_LOCAL"],
    ["4K"],
    ["150K"],
  ])("refuse les six actions pour le rôle %s", async (role) => {
    for (const [, call] of directCalls) {
      asVisitor([role]);
      const result = await call();
      expect(result).toEqual({ success: false, error: "Accès refusé" });
    }
    expectNoMenuAccess();
  });

  it("autorise createMenu pour PORTAL_ADMIN", async () => {
    asVisitor(["PORTAL_ADMIN"]);
    (db.harpmenus.findUnique as jest.Mock).mockResolvedValue(null);
    (db.harpmenus.create as jest.Mock).mockResolvedValue({ id: 9 });
    const result = await createMenu(menuForm());
    expect(result.success).toBe(true);
    expect(db.harpmenus.create).toHaveBeenCalled();
  });

  it("autorise updateMenu pour PORTAL_ADMIN", async () => {
    asVisitor(["PORTAL_ADMIN"]);
    (db.harpmenus.findUnique as jest.Mock).mockResolvedValue({ id: 3, menu: "ACCUEIL" });
    (db.harpmenus.update as jest.Mock).mockResolvedValue({ id: 3 });
    const result = await updateMenu(3, menuForm());
    expect(result.success).toBe(true);
    expect(db.harpmenus.update).toHaveBeenCalled();
  });

  it("autorise toggleMenuStatus pour PORTAL_ADMIN", async () => {
    asVisitor(["PORTAL_ADMIN"]);
    (db.harpmenus.findUnique as jest.Mock).mockResolvedValue({
      id: 3,
      menu: "ACCUEIL",
      active: 1,
    });
    (db.harpmenus.update as jest.Mock).mockResolvedValue({ id: 3 });
    const result = await toggleMenuStatus(3);
    expect(result.success).toBe(true);
    expect(db.harpmenus.update).toHaveBeenCalledWith({
      where: { id: 3 },
      data: { active: 0 },
    });
  });

  it("autorise updateMenuRoles pour PORTAL_ADMIN", async () => {
    asVisitor(["PORTAL_ADMIN"]);
    (prisma.harpmenus.findUnique as jest.Mock).mockResolvedValue({ id: 3 });
    (prisma.harproles.findMany as jest.Mock).mockResolvedValue([{ id: 1 }]);
    (prisma.$transaction as jest.Mock).mockImplementation(async (fn) => {
      await fn({
        harpmenurole: {
          deleteMany: jest.fn(),
          createMany: jest.fn(),
        },
      });
    });
    const result = await updateMenuRoles(3, [1]);
    expect(result.success).toBe(true);
    expect(prisma.$transaction).toHaveBeenCalled();
  });

  it("autorise addRoleToMenu pour PORTAL_ADMIN", async () => {
    asVisitor(["PORTAL_ADMIN"]);
    (prisma.harpmenurole.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.harpmenurole.create as jest.Mock).mockResolvedValue({ id: 1 });
    const result = await addRoleToMenu(3, 1);
    expect(result.success).toBe(true);
    expect(prisma.harpmenurole.create).toHaveBeenCalled();
  });

  it("autorise removeRoleFromMenu pour PORTAL_ADMIN", async () => {
    asVisitor(["PORTAL_ADMIN"]);
    (prisma.harpmenurole.delete as jest.Mock).mockResolvedValue({ id: 1 });
    const result = await removeRoleFromMenu(3, 1);
    expect(result.success).toBe(true);
    expect(prisma.harpmenurole.delete).toHaveBeenCalled();
  });
});
