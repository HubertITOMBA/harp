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

