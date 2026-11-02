import { PORTAL_ADMIN_ROLE } from "@/lib/user-roles";

/**
 * Texte lorsqu'aucun sous-rôle n'est associé à un rôle.
 * PORTAL_ADMIN conserve son contournement : l'absence de sous-rôle ne ferme pas les familles.
 *
 * @param roleName - Libellé harproles.role
 * @returns Message affiché dans l'onglet Sous-rôles
 */
export function emptyRoleSubrolesMessage(roleName: string): string {
  if (roleName === PORTAL_ADMIN_ROLE) {
    return "Aucun sous-rôle n'est associé à ce rôle.";
  }
  return "Aucun sous-rôle n'est associé à ce rôle. Sans sous-rôle actif, ce rôle n'ouvre aucune famille.";
}

/** Sources de rôles d'un menu, sans les fusionner avec le RBAC des familles. */
export type MenuRoleSources = {
  columnRole: string | null;
  associatedRoles: readonly string[];
};

/** Lien rôle / sous-rôle déjà résolu vers une famille. */
export type FamilyRoleLink = {
  role: string;
  active: boolean;
};

/** Classement informatif menu visible / grant actif. Aucune écriture. */
export type MenuFamilyCoherence = {
  menuHasNoRoleRestriction: boolean;
  menuWithoutGrant: string[];
  grantWithoutMenu: string[];
};

/**
 * Réunit harpmenus.role et les rôles harpmenurole, comme Menu.tsx.
 * Une colonne vide et aucune association produisent une liste vide.
 *
 * @param sources - Colonne du menu et rôles de harpmenurole
 * @returns Noms de rôles dédupliqués, ordre stable
 */
export function collectMenuRoleNames(sources: MenuRoleSources): string[] {
  const names: string[] = [];
  const seen = new Set<string>();
  const column = sources.columnRole?.trim() ?? "";
  if (column.length > 0) {
    names.push(column);
    seen.add(column);
  }
  for (const role of sources.associatedRoles) {
    const name = role.trim();
    if (name.length === 0 || seen.has(name)) {
      continue;
    }
    names.push(name);
    seen.add(name);
  }
  return names;
}

/** Rôle affiché dans la consultation d'un menu. */
export type VisibleMenuRole = {
  role: string;
  descr: string | null;
  unrecognized: boolean;
};

/**
 * Liste les rôles visibles d'un menu : union dédupliquée de la colonne et de harpmenurole.
 * Un nom de colonne absent de harproles reste visible et est signalé.
 *
 * @param input - Colonne, associations et catalogue harproles connu
 * @returns Rôles à afficher et, le cas échéant, la restriction historique non reconnue
 */
export function listVisibleMenuRoles(input: {
  columnRole: string | null;
  linked: ReadonlyArray<{ role: string; descr: string | null }>;
  knownRoleNames: readonly string[] | null;
}): { roles: VisibleMenuRole[]; unrecognizedRole: string | null } {
  const names = collectMenuRoleNames({
    columnRole: input.columnRole,
    associatedRoles: input.linked.map((item) => item.role),
  });
  const column = input.columnRole?.trim() ?? "";
  const unrecognizedRole =
    input.knownRoleNames != null &&
    column.length > 0 &&
    !input.knownRoleNames.includes(column)
      ? column
      : null;
  const descrByName = new Map(input.linked.map((item) => [item.role, item.descr]));

  return {
    unrecognizedRole,
    roles: names.map((role) => ({
      role,
      descr: descrByName.get(role) ?? null,
      unrecognized: role === unrecognizedRole,
    })),
  };
}

/**
 * Indique si display désigne une famille harptypenv.typenvid.
 * Aucune correspondance n'est inventée.
 *
 * @param display - Valeur harpmenus.display
 * @param familyTypenvId - typenvid trouvé, ou null
 * @returns matched seulement si les deux identifiants sont égaux et positifs
 */
export function matchMenuDisplayToFamily(
  display: number,
  familyTypenvId: number | null
): "matched" | "unmatched" {
  if (!Number.isInteger(display) || display <= 0) {
    return "unmatched";
  }
  if (familyTypenvId == null || familyTypenvId !== display) {
    return "unmatched";
  }
  return "matched";
}

/**
 * Compare la visibilité du menu et les grants actifs d'une famille.
 * PORTAL_ADMIN n'apparaît dans aucune alerte : son bypass n'est pas un grant.
 * Une liste de rôles de menu vide reste une visibilité générale, sans ouvrir la famille.
 *
 * @param input.menuRoles - Résultat de collectMenuRoleNames
 * @param input.familyLinks - Liens rôle / sous-rôle vers cette famille
 * @returns Alertes informatives, sans rôle à créer ni à retirer
 */
export function classifyMenuFamilyCoherence(input: {
  menuRoles: readonly string[];
  familyLinks: readonly FamilyRoleLink[];
}): MenuFamilyCoherence {
  const menuHasNoRoleRestriction = input.menuRoles.length === 0;
  const activeGrantRoles = new Set<string>();
  for (const link of input.familyLinks) {
    if (link.active && link.role !== PORTAL_ADMIN_ROLE) {
      activeGrantRoles.add(link.role);
    }
  }
  const menuRoleSet = new Set(input.menuRoles);

  if (menuHasNoRoleRestriction) {
    return {
      menuHasNoRoleRestriction: true,
      menuWithoutGrant: [],
      grantWithoutMenu: [],
    };
  }

  const menuWithoutGrant = input.menuRoles.filter(
    (role) => role !== PORTAL_ADMIN_ROLE && !activeGrantRoles.has(role)
  );
  const grantWithoutMenu = [...activeGrantRoles]
    .filter((role) => !menuRoleSet.has(role))
    .sort((a, b) => a.localeCompare(b, "fr"));

  return {
    menuHasNoRoleRestriction: false,
    menuWithoutGrant,
    grantWithoutMenu,
  };
}
