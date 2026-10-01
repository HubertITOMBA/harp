/**
 * Utilitaires pour gérer les rôles utilisateurs
 */

/**
 * Convertit un array de rôles en format chaîne compatible avec l'ancien système
 * Format: "ROLE1", "ROLE2", "ROLE3"
 */
export function formatRolesForMenu(roles: string[]): string {
  return roles.map(role => `"${role}"`).join(', ');
}

/**
 * Vérifie si un utilisateur a un rôle spécifique
 */
export function hasRole(userRoles: string[], role: string): boolean {
  return userRoles.includes(role);
}

/**
 * Vérifie si un utilisateur a au moins un des rôles spécifiés
 */
export function hasAnyRole(userRoles: string[], rolesToCheck: string[]): boolean {
  return rolesToCheck.some(role => userRoles.includes(role));
}

/** Super-utilisateur HARP. Voit tous les menus actifs sans TMA_LOCAL ni PSADMIN. */
export const PORTAL_ADMIN_ROLE = "PORTAL_ADMIN";

/**
 * Indique si l'utilisateur peut ouvrir un menu déjà restreint aux menus actifs.
 *
 * PORTAL_ADMIN voit tous les menus actifs, y compris ceux historiquement
 * réservés à PSADMIN. Il n'a pas besoin de TMA_LOCAL.
 * Les autres rôles restent sur l'intersection des rôles du menu
 * (harpmenus.role et harpmenurole). Un menu sans rôle reste public.
 *
 * @param userRoles - Rôles de l'utilisateur
 * @param menuRoles - Rôles autorisés sur le menu
 * @returns true si le menu doit être affiché
 */
export function canAccessActiveMenu(userRoles: string[], menuRoles: string[]): boolean {
  if (hasRole(userRoles, PORTAL_ADMIN_ROLE)) {
    return true;
  }
  return menuRoles.length === 0 || hasAnyRole(userRoles, menuRoles);
}

/** Menu de famille déjà identifié, ou null s'il n'existe pas. */
export type IdentifiedMenuAccess = {
  active: number;
  roles: string[];
} | null;

/**
 * Autorise l'ouverture directe d'une famille d'environnements.
 * Un menu absent ou inactif est refusé, y compris pour PORTAL_ADMIN.
 * Un menu actif est ensuite jugé par canAccessActiveMenu.
 *
 * @param userRoles - Rôles de l'utilisateur, User.role et harpuseroles
 * @param menu - Menu de niveau 3 correspondant, ou null
 * @returns true seulement si la liste d'environnements peut être chargée
 */
export function authorizeIdentifiedMenu(
  userRoles: string[],
  menu: IdentifiedMenuAccess
): boolean {
  if (!menu || menu.active !== 1) {
    return false;
  }
  return canAccessActiveMenu(userRoles, menu.roles);
}

/**
 * Vérifie si un utilisateur a tous les rôles spécifiés
 */
export function hasAllRoles(userRoles: string[], rolesToCheck: string[]): boolean {
  return rolesToCheck.every(role => userRoles.includes(role));
}

/**
 * Extrait les rôles d'une chaîne formatée (format menu)
 * Transforme: '"ROLE1", "ROLE2"' en ['ROLE1', 'ROLE2']
 */
export function parseRolesFromString(rolesString: string): string[] {
  if (!rolesString || rolesString.trim() === '') {
    return [];
  }
  
  return rolesString
    .split(',')
    .map(role => role.trim().replace(/"/g, ''))
    .filter(role => role.length > 0);
}

/**
 * Vérifie si une chaîne de rôles (format menu) contient au moins un rôle de l'array
 */
export function rolesStringIncludesAny(rolesString: string, rolesToCheck: string[]): boolean {
  const parsedRoles = parseRolesFromString(rolesString);
  return hasAnyRole(parsedRoles, rolesToCheck);
}

/**
 * Lien déjà résolu harproles → sous-rôle actif ou non → typenvid.
 * Le rôle est le libellé harproles.role, pas le rôle enum User.role à lui seul.
 */
export type TypeEnvAccessGrant = {
  role: string;
  active: boolean;
  typenvid: number;
};

/**
 * Autorise une famille d'environnement selon le RBAC des sous-rôles.
 * PORTAL_ADMIN, présent dans les rôles fournis, est accepté sans ligne de jointure.
 * Un autre rôle n'est accepté que s'il porte un sous-rôle actif lié au typenvid.
 * Les menus et les périmètres 4K/150K ne participent pas à cette décision.
 * Une entrée illisible est refusée.
 *
 * @param input.userRoles - Rôles HARP déjà résolus pour l'utilisateur
 * @param input.typenvid - Identifiant de famille demandé
 * @param input.grants - Associations rôle / sous-rôle / typenvid déjà chargées
 * @returns true seulement si la famille est démontrée
 */
export function canAccessTypeEnv(input: {
  userRoles: readonly string[];
  typenvid: number;
  grants: readonly TypeEnvAccessGrant[];
}): boolean {
  if (!Number.isInteger(input.typenvid) || input.typenvid <= 0) {
    return false;
  }
  if (!Array.isArray(input.userRoles) || input.userRoles.length === 0) {
    return false;
  }
  if (hasRole([...input.userRoles], PORTAL_ADMIN_ROLE)) {
    return true;
  }
  if (!Array.isArray(input.grants)) {
    return false;
  }

  return input.grants.some((grant) => {
    if (!grant || grant.active !== true || grant.typenvid !== input.typenvid) {
      return false;
    }
    if (typeof grant.role !== "string" || grant.role.length === 0) {
      return false;
    }
    return input.userRoles.includes(grant.role);
  });
}

/**
 * Familles visibles d'un coup, pour une liste.
 * null signifie toutes les familles : cas PORTAL_ADMIN, sans lire les grants.
 * Les autres rôles reçoivent l'union des typenvid de leurs sous-rôles actifs.
 *
 * @param input.userRoles - Rôles HARP de la session
 * @param input.grants - Liens rôle / sous-rôle / typenvid déjà chargés
 * @returns null pour tout voir, ou les typenvid autorisés
 */
export function accessibleTypenvIds(input: {
  userRoles: readonly string[];
  grants: readonly TypeEnvAccessGrant[];
}): number[] | null {
  if (!Array.isArray(input.userRoles) || input.userRoles.length === 0) {
    return [];
  }
  if (hasRole([...input.userRoles], PORTAL_ADMIN_ROLE)) {
    return null;
  }
  if (!Array.isArray(input.grants)) {
    return [];
  }

  const ids = new Set<number>();
  for (const grant of input.grants) {
    if (!grant || grant.active !== true) {
      continue;
    }
    if (!Number.isInteger(grant.typenvid) || grant.typenvid <= 0) {
      continue;
    }
    if (typeof grant.role !== "string" || grant.role.length === 0) {
      continue;
    }
    if (!input.userRoles.includes(grant.role)) {
      continue;
    }
    ids.add(grant.typenvid);
  }
  return [...ids];
}

