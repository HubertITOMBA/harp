import prisma from "@/lib/prisma";
import { matchMenuDisplayToFamily } from "@/lib/rbac-menu-coherence";

/** Menu de niveau 3 dont le display correspond à une famille. */
export type FamilyAdminMenu = {
  id: number;
  menu: string;
  display: number;
  active: number;
};

/** Famille harptypenv et ses indicateurs, sans aucune écriture. */
export type FamilyAdminRow = {
  id: number;
  typenvid: number | null;
  typenv: string;
  descr: string | null;
  environmentCount: number;
  menus: FamilyAdminMenu[];
  subroleCount: number;
  activeSubroleCount: number;
  withoutMenu: boolean;
  hasRbac: boolean;
};

/** Menu de niveau 3 qui ne désigne aucune famille. */
export type OrphanFamilyMenu = FamilyAdminMenu;

/** Catalogue lu pour la page d'administration des familles. */
export type FamilyAdminCatalog = {
  families: FamilyAdminRow[];
  orphanMenus: OrphanFamilyMenu[];
};

/**
 * Charge les familles, leurs comptes et les menus de niveau 3.
 * La correspondance reste display = typenvid. Aucune ligne n'est écrite.
 *
 * @returns Familles triées par typenvid, puis menus de niveau 3 sans famille
 */
export async function loadFamilyAdminCatalog(): Promise<FamilyAdminCatalog> {
  const [families, menus] = await Promise.all([
    prisma.harptypenv.findMany({
      select: {
        id: true,
        typenvid: true,
        typenv: true,
        descr: true,
        _count: {
          select: {
            envsharp: true,
          },
        },
        harpsubroletypenv: {
          select: {
            harpsubrole: {
              select: { active: true },
            },
          },
        },
      },
    }),
    prisma.harpmenus.findMany({
      where: { level: 3 },
      select: {
        id: true,
        menu: true,
        display: true,
        active: true,
      },
      orderBy: [{ display: "asc" }, { menu: "asc" }],
    }),
  ]);

  const rows: FamilyAdminRow[] = families.map((family) => {
    const matchedMenus = menus.filter(
      (menu) => matchMenuDisplayToFamily(menu.display, family.typenvid) === "matched"
    );
    const subroleCount = family.harpsubroletypenv.length;
    const activeSubroleCount = family.harpsubroletypenv.filter(
      (link) => link.harpsubrole.active
    ).length;

    return {
      id: family.id,
      typenvid: family.typenvid,
      typenv: family.typenv,
      descr: family.descr,
      environmentCount: family._count.envsharp,
      menus: matchedMenus,
      subroleCount,
      activeSubroleCount,
      withoutMenu: matchedMenus.length === 0,
      hasRbac: subroleCount > 0,
    };
  });

  rows.sort((left, right) => {
    if (left.typenvid == null && right.typenvid == null) {
      return left.typenv.localeCompare(right.typenv, "fr");
    }
    if (left.typenvid == null) {
      return 1;
    }
    if (right.typenvid == null) {
      return -1;
    }
    if (left.typenvid !== right.typenvid) {
      return left.typenvid - right.typenvid;
    }
    return left.typenv.localeCompare(right.typenv, "fr");
  });

  const orphanMenus = menus.filter((menu) => {
    return !families.some(
      (family) => matchMenuDisplayToFamily(menu.display, family.typenvid) === "matched"
    );
  });

  return { families: rows, orphanMenus };
}
