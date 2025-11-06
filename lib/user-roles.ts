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

