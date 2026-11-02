import prisma from "@/lib/prisma";
import { requirePortalAdmin } from "@/lib/require-portal-admin";
import { PORTAL_ADMIN_ROLE } from "@/lib/user-roles";
import {
  classifyMenuFamilyCoherence,
  collectMenuRoleNames,
  matchMenuDisplayToFamily,
  type MenuFamilyCoherence,
} from "@/lib/rbac-menu-coherence";

export type AdminReadResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export type FamilyLabel = {
  typenvid: number;
  typenv: string;
  descr: string | null;
};

export type SubroleFamilyView = {
  id: number;
  code: string;
  descr: string | null;
  active: boolean;
  families: FamilyLabel[];
  roles: Array<{ id: number; role: string }>;
};

export type RoleSubrolesView = {
  roleId: number;
  role: string;
  portalAdminBypass: boolean;
  subroles: SubroleFamilyView[];
  availableSubroles: Array<{ id: number; code: string; descr: string | null; active: boolean }>;
};

export type FamilyAccessView = {
  typenvid: number;
  typenv: string;
  descr: string | null;
  subroles: SubroleFamilyView[];
  roles: Array<{
    id: number;
    role: string;
    descr: string;
    subroles: Array<{ id: number; code: string; active: boolean; sharedRoles: string[] }>;
  }>;
};

export type MenuCoherenceView =
  | { kind: "not-family-menu" }
  | { kind: "unmatched-display"; display: number }
  | {
      kind: "matched";
      typenvid: number;
      typenv: string;
      descr: string | null;
      menuRoles: string[];
      subroles: SubroleFamilyView[];
      coherence: MenuFamilyCoherence;
    };

type SubroleRow = {
  id: number;
  code: string;
  descr: string | null;
  active: boolean;
  harpsubroletypenv: Array<{
    typenvid: number;
    harptypenv: { typenv: string; descr: string | null; typenvid: number | null } | null;
  }>;
  harprolesubrole: Array<{
    harproles: { id: number; role: string };
  }>;
};

const subroleSelect = {
  id: true,
  code: true,
  descr: true,
  active: true,
  harpsubroletypenv: {
    select: {
      typenvid: true,
      harptypenv: { select: { typenv: true, descr: true, typenvid: true } },
    },
  },
  harprolesubrole: {
    select: { harproles: { select: { id: true, role: true } } },
  },
} as const;

/**
 * Refuse l'accès admin avant toute lecture RBAC.
 *
 * @returns Le refus, ou null si la session est PORTAL_ADMIN
 */
async function denyUnlessAdmin(): Promise<string | null> {
  const admin = await requirePortalAdmin();
  return admin.ok ? null : admin.error;
}

function toFamilyLabel(
  link: SubroleRow["harpsubroletypenv"][number]
): FamilyLabel | null {
  if (link.harptypenv?.typenvid == null) {
    return null;
  }
  return {
    typenvid: link.typenvid,
    typenv: link.harptypenv.typenv,
    descr: link.harptypenv.descr,
  };
}

function toSubroleView(row: SubroleRow): SubroleFamilyView {
  const families = row.harpsubroletypenv
    .map(toFamilyLabel)
    .filter((family): family is FamilyLabel => family != null);
  return {
    id: row.id,
    code: row.code,
    descr: row.descr,
    active: row.active,
    families,
    roles: row.harprolesubrole.map((link) => link.harproles),
  };
}

/**
 * Lit les sous-rôles d'un rôle et ceux qui peuvent encore lui être associés.
 *
 * @param roleId - Identifiant harproles
 * @returns Vue d'administration, ou un refus
 */
export async function loadRoleSubroles(roleId: number): Promise<AdminReadResult<RoleSubrolesView>> {
  const denied = await denyUnlessAdmin();
  if (denied) {
    return { ok: false, error: denied };
  }

  const role = await prisma.harproles.findUnique({
    where: { id: roleId },
    select: {
      id: true,
      role: true,
      harprolesubrole: { select: { harpsubrole: { select: subroleSelect } } },
    },
  });
  if (!role) {
    return { ok: false, error: "Rôle introuvable" };
  }

  const linkedIds = new Set(role.harprolesubrole.map((link) => link.harpsubrole.id));
  const catalog = await prisma.harpsubrole.findMany({
    orderBy: { code: "asc" },
    select: { id: true, code: true, descr: true, active: true },
  });

  return {
    ok: true,
    data: {
      roleId: role.id,
      role: role.role,
      portalAdminBypass: role.role === PORTAL_ADMIN_ROLE,
      subroles: role.harprolesubrole.map((link) => toSubroleView(link.harpsubrole)),
      availableSubroles: catalog.filter((item) => !linkedIds.has(item.id)),
    },
  };
}

/**
 * Lit les accès RBAC d'une famille et les sous-rôles déjà portés par chaque rôle.
 *
 * @param typenvid - Identifiant de famille, ou null si l'environnement n'en a pas
 * @returns Vue de la famille, ou un refus
 */
export async function loadFamilyAccess(
  typenvid: number | null
): Promise<AdminReadResult<FamilyAccessView | null>> {
  const denied = await denyUnlessAdmin();
  if (denied) {
    return { ok: false, error: denied };
  }
  if (typenvid == null) {
    return { ok: true, data: null };
  }
  if (!Number.isInteger(typenvid) || typenvid <= 0) {
    return { ok: false, error: "Identifiant de famille invalide" };
  }

  const family = await prisma.harptypenv.findUnique({
    where: { typenvid },
    select: { typenv: true, descr: true, typenvid: true },
  });
  if (!family || family.typenvid == null) {
    return { ok: false, error: "Famille introuvable" };
  }

  const links = await prisma.harpsubroletypenv.findMany({
    where: { typenvid },
    select: { harpsubrole: { select: subroleSelect } },
  });
  const roles = await prisma.harproles.findMany({
    orderBy: { role: "asc" },
    select: {
      id: true,
      role: true,
      descr: true,
      harprolesubrole: {
        select: {
          harpsubrole: {
            select: {
              id: true,
              code: true,
              active: true,
              harprolesubrole: { select: { harproles: { select: { role: true } } } },
            },
          },
        },
      },
    },
  });

  return {
    ok: true,
    data: {
      typenvid: family.typenvid,
      typenv: family.typenv,
      descr: family.descr,
      subroles: links.map((link) => toSubroleView(link.harpsubrole)),
      roles: roles.map((role) => ({
        id: role.id,
        role: role.role,
        descr: role.descr,
        subroles: role.harprolesubrole.map((link) => ({
          id: link.harpsubrole.id,
          code: link.harpsubrole.code,
          active: link.harpsubrole.active,
          sharedRoles: link.harpsubrole.harprolesubrole.map((item) => item.harproles.role),
        })),
      })),
    },
  };
}

/**
 * Compare un menu de niveau 3 avec la famille de même display, sans rien écrire.
 *
 * @param menuId - Identifiant harpmenus
 * @returns Correspondance, alertes, ou un refus
 */
export async function loadMenuFamilyCoherence(
  menuId: number
): Promise<AdminReadResult<MenuCoherenceView>> {
  const denied = await denyUnlessAdmin();
  if (denied) {
    return { ok: false, error: denied };
  }

  const menu = await prisma.harpmenus.findUnique({
    where: { id: menuId },
    select: {
      level: true,
      display: true,
      role: true,
      harpmenurole: { select: { harproles: { select: { role: true } } } },
    },
  });
  if (!menu) {
    return { ok: false, error: "Menu introuvable" };
  }
  if (menu.level !== 3) {
    return { ok: true, data: { kind: "not-family-menu" } };
  }

  const family = await prisma.harptypenv.findFirst({
    where: { typenvid: menu.display },
    select: { typenv: true, descr: true, typenvid: true },
  });
  const match = matchMenuDisplayToFamily(menu.display, family?.typenvid ?? null);
  if (match === "unmatched" || !family || family.typenvid == null) {
    return { ok: true, data: { kind: "unmatched-display", display: menu.display } };
  }

  const menuRoles = collectMenuRoleNames({
    columnRole: menu.role ? String(menu.role) : null,
    associatedRoles: menu.harpmenurole.map((link) => link.harproles.role),
  });
  const links = await prisma.harpsubroletypenv.findMany({
    where: { typenvid: family.typenvid },
    select: { harpsubrole: { select: subroleSelect } },
  });
  const subroles = links.map((link) => toSubroleView(link.harpsubrole));
  const familyLinks = subroles.flatMap((subrole) =>
    subrole.roles.map((role) => ({ role: role.role, active: subrole.active }))
  );

  return {
    ok: true,
    data: {
      kind: "matched",
      typenvid: family.typenvid,
      typenv: family.typenv,
      descr: family.descr,
      menuRoles,
      subroles,
      coherence: classifyMenuFamilyCoherence({ menuRoles, familyLinks }),
    },
  };
}
