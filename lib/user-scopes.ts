import { PORTAL_ADMIN_ROLE } from "@/lib/user-roles";

/** Seuls ces codes peuvent être affectés à un utilisateur. UNASSIGNED reste un état d'environnement. */
export const ASSIGNABLE_USER_SCOPE_CODES = ["4K", "150K"] as const;

export type AssignableUserScopeCode = (typeof ASSIGNABLE_USER_SCOPE_CODES)[number];

export type ScopeCatalogRow = {
  id: number;
  code: string;
};

export type UserScopeUpdateResult =
  | { ok: true; scopeIds: number[] }
  | { ok: false; error: string };

/**
 * Indique si les rôles contiennent le super-utilisateur du portail.
 *
 * @param roles - Rôles User.role et harpuseroles
 * @returns true si PORTAL_ADMIN est présent
 */
export function hasPortalAdminRole(roles: string[]): boolean {
  return roles.includes(PORTAL_ADMIN_ROLE);
}

/**
 * Normalise les codes envoyés par le client.
 * Un tableau qui n'est pas composé uniquement de chaînes est refusé.
 *
 * @param value - Valeur brute reçue par la Server Action
 * @returns Les chaînes reçues, ou une erreur
 */
export function normalizeRequestedScopeCodes(
  value: unknown
): { ok: true; codes: string[] } | { ok: false; error: string } {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    return { ok: false, error: "Données invalides" };
  }
  return { ok: true, codes: value };
}

/**
 * Décide si un opérateur peut remplacer les périmètres d'un utilisateur.
 * La décision ne lit pas la base : le catalogue est fourni par l'appelant.
 * Les identifiants retenus viennent de ce catalogue, jamais d'une constante.
 *
 * @param input.operatorRoles - Rôles de la session, lus en base
 * @param input.targetRoles - Rôles de l'utilisateur cible
 * @param input.requestedCodes - Codes demandés, déjà normalisés en chaînes
 * @param input.catalog - Lignes harpscope réellement chargées
 * @returns Les scopeId à écrire, ou un refus sans écriture
 */
export function prepareUserScopeUpdate(input: {
  operatorRoles: string[];
  targetRoles: string[];
  requestedCodes: string[];
  catalog: ScopeCatalogRow[];
}): UserScopeUpdateResult {
  if (!hasPortalAdminRole(input.operatorRoles)) {
    return { ok: false, error: "Accès refusé" };
  }

  if (hasPortalAdminRole(input.targetRoles)) {
    return {
      ok: false,
      error: "Un administrateur du portail ne reçoit pas de périmètre individuel",
    };
  }

  const requested = [...new Set(input.requestedCodes.map((code) => code.trim()))];
  const forbidden = requested.filter(
    (code) => !ASSIGNABLE_USER_SCOPE_CODES.includes(code as AssignableUserScopeCode)
  );
  if (forbidden.length > 0) {
    return { ok: false, error: "Périmètre non autorisé" };
  }

  const assignable = new Map(
    input.catalog
      .filter((row) =>
        ASSIGNABLE_USER_SCOPE_CODES.includes(row.code as AssignableUserScopeCode)
      )
      .map((row) => [row.code, row.id])
  );

  const scopeIds: number[] = [];
  for (const code of ASSIGNABLE_USER_SCOPE_CODES) {
    if (!requested.includes(code)) {
      continue;
    }
    const scopeId = assignable.get(code);
    if (scopeId == null) {
      return { ok: false, error: "Périmètre introuvable" };
    }
    scopeIds.push(scopeId);
  }

  return { ok: true, scopeIds };
}
