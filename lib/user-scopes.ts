import { Prisma } from "@prisma/client";
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

/** Décision d'une mutation ou d'une opération technique d'administration. */
export type PortalAdminAccess = "allowed" | "unauthenticated" | "forbidden";

/**
 * Autorise une mutation seulement pour une session PORTAL_ADMIN.
 * Les scopes 4K et 150K ne sont pas des rôles et n'entrent pas dans cette décision.
 * PSADMIN n'est pas accepté.
 *
 * @param input.authenticated - Présence d'une session serveur
 * @param input.userRoles - Rôles lus en base, jamais fournis par le client
 * @returns allowed, unauthenticated ou forbidden
 */
/**
 * Nettoie le nom d'environnement saisi, sans en changer la casse ni le contenu.
 * Une valeur vide ou plus longue que la colonne envsharp.env est refusée.
 *
 * @param value - Texte reçu de l'appelant
 * @returns Le nom conservé, ou null
 */
export function normalizeEnvironmentName(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const name = value.trim();
  if (name.length === 0 || name.length > 32) {
    return null;
  }
  return name;
}

export function decidePortalAdminAccess(input: {
  authenticated: boolean;
  userRoles: string[];
}): PortalAdminAccess {
  if (!input.authenticated) {
    return "unauthenticated";
  }
  if (!hasPortalAdminRole(input.userRoles)) {
    return "forbidden";
  }
  return "allowed";
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

/** Aucun prédicat scopeId, ou restriction aux identifiants 4K/150K réellement affectés. */
export type EnvironmentScopeFilter =
  | { mode: "all" }
  | { mode: "restricted"; scopeIds: number[] };

/**
 * Décide le filtre de lecture des environnements.
 * PORTAL_ADMIN ne reçoit aucun filtre : UNASSIGNED, NULL et tout futur code restent visibles.
 * Un autre utilisateur ne conserve que les codes 4K et 150K de ses affectations.
 * Les identifiants viennent des lignes fournies, jamais d'une constante.
 * Une liste vide signifie zéro environnement, pas un accès global.
 *
 * @param input.userRoles - Rôles de la session, User.role et harpuseroles
 * @param input.assignedScopes - Lignes harpscope liées à l'utilisateur
 * @returns mode all, ou les scopeId autorisés
 */
export function resolveEnvironmentScopeFilter(input: {
  userRoles: string[];
  assignedScopes: ScopeCatalogRow[];
}): EnvironmentScopeFilter {
  if (hasPortalAdminRole(input.userRoles)) {
    return { mode: "all" };
  }

  const scopeIdByCode = new Map<string, number>();
  for (const scope of input.assignedScopes) {
    if (!ASSIGNABLE_USER_SCOPE_CODES.includes(scope.code as AssignableUserScopeCode)) {
      continue;
    }
    if (!scopeIdByCode.has(scope.code)) {
      scopeIdByCode.set(scope.code, scope.id);
    }
  }

  const scopeIds = ASSIGNABLE_USER_SCOPE_CODES.flatMap((code) => {
    const scopeId = scopeIdByCode.get(code);
    return scopeId == null ? [] : [scopeId];
  });

  return { mode: "restricted", scopeIds };
}

/**
 * Traduit le filtre de lecture en clause Prisma.
 * Une restriction vide signifie de ne pas interroger envsharp.
 *
 * @param filter - Décision déjà produite par resolveEnvironmentScopeFilter
 * @returns null s'il ne faut rien charger, sinon le where de scope
 */
export function environmentScopeWhere(
  filter: EnvironmentScopeFilter
): { scopeId?: { in: number[] } } | null {
  if (filter.mode === "all") {
    return {};
  }
  if (filter.scopeIds.length === 0) {
    return null;
  }
  return { scopeId: { in: filter.scopeIds } };
}

/** Code HTTP de l'accès aux serveurs d'un environnement. */
export type EnvironmentServerAccess = 200 | 401 | 403 | 404;

/**
 * Autorise la lecture des serveurs d'un environnement.
 * Sans session : 401, avant de révéler si l'environnement existe.
 * PORTAL_ADMIN (mode all) : 200, y compris UNASSIGNED et scopeId null.
 * Un autre utilisateur : 200 seulement si scopeId est dans ses identifiants 4K/150K.
 *
 * @param input.authenticated - Présence d'une session serveur
 * @param input.environment - Ligne envsharp, ou null si elle n'existe pas
 * @param input.scopeFilter - Filtre déjà résolu pour l'utilisateur
 * @returns 200, 401, 403 ou 404
 */
export function decideEnvironmentServerAccess(input: {
  authenticated: boolean;
  environment: { scopeId: number | null } | null;
  scopeFilter: EnvironmentScopeFilter;
}): EnvironmentServerAccess {
  if (!input.authenticated) {
    return 401;
  }
  if (input.environment == null) {
    return 404;
  }
  if (input.scopeFilter.mode === "all") {
    return 200;
  }
  const scopeId = input.environment.scopeId;
  if (scopeId == null || !input.scopeFilter.scopeIds.includes(scopeId)) {
    return 403;
  }
  return 200;
}

/**
 * Autorise les serveurs d'un environnement déjà résolu en base.
 * Le typenvid vient de cette ligne, jamais d'un paramètre client.
 * La famille RBAC est exigée avant le périmètre. PORTAL_ADMIN n'est pas
 * filtré par 4K/150K lorsque le filtre reçu est mode all.
 *
 * @param input.authenticated - Présence d'une session
 * @param input.environment - Ligne envsharp, ou null
 * @param input.familyAllowed - Résultat RBAC pour le typenvid de cette ligne
 * @param input.scopeFilter - Filtre de périmètre déjà résolu
 * @returns 200, 401, 403 ou 404
 */
export function decideEnvironmentFamilyAndScope(input: {
  authenticated: boolean;
  environment: { scopeId: number | null } | null;
  familyAllowed: boolean;
  scopeFilter: EnvironmentScopeFilter;
}): EnvironmentServerAccess {
  if (!input.authenticated) {
    return 401;
  }
  if (input.environment == null) {
    return 404;
  }
  if (!input.familyAllowed) {
    return 403;
  }
  return decideEnvironmentServerAccess({
    authenticated: true,
    environment: input.environment,
    scopeFilter: input.scopeFilter,
  });
}

/**
 * Contexte de visibilité chargé une fois pour une liste.
 * allowedTypenvIds null : toutes les familles, réservé à PORTAL_ADMIN.
 */
export type EnvironmentAccessContext = {
  authenticated: boolean;
  portalAdmin: boolean;
  allowedTypenvIds: number[] | null;
  scopeFilter: EnvironmentScopeFilter;
};

/**
 * Décide si une ligne envsharp déjà lue peut être montrée.
 * PORTAL_ADMIN voit la ligne, y compris sans typenvid et sans scope 4K/150K.
 * Un autre utilisateur doit avoir la famille et le scope.
 *
 * @param context - Contexte de session déjà chargé
 * @param environment - typenvid et scopeId lus sur envsharp
 * @returns true seulement si la ligne est visible
 */
export function canSeeEnvironment(
  context: EnvironmentAccessContext,
  environment: { typenvid: number | null; scopeId: number | null }
): boolean {
  if (!context.authenticated) {
    return false;
  }
  if (context.portalAdmin) {
    return true;
  }
  const familyAllowed =
    context.allowedTypenvIds != null &&
    environment.typenvid != null &&
    context.allowedTypenvIds.includes(environment.typenvid);
  return (
    decideEnvironmentFamilyAndScope({
      authenticated: true,
      environment,
      familyAllowed,
      scopeFilter: context.scopeFilter,
    }) === 200
  );
}

/**
 * Clause Prisma pour ne charger que les envsharp visibles.
 * null signifie de ne rien interroger. {} signifie aucun filtre supplémentaire.
 *
 * @param context - Contexte de session déjà chargé
 * @returns null, un objet vide, ou typenvid et scopeId
 */
export function environmentVisibilityWhere(context: EnvironmentAccessContext): {
  typenvid?: { in: number[] };
  scopeId?: { in: number[] };
} | null {
  if (!context.authenticated) {
    return null;
  }
  if (context.portalAdmin) {
    return {};
  }
  if (context.allowedTypenvIds == null || context.allowedTypenvIds.length === 0) {
    return null;
  }
  const scopeWhere = environmentScopeWhere(context.scopeFilter);
  if (scopeWhere == null) {
    return null;
  }
  return {
    typenvid: { in: context.allowedTypenvIds },
    ...scopeWhere,
  };
}

/**
 * Traduit le contexte en prédicat SQL sur l'alias envsharp `e`.
 * null signifie qu'aucune ligne ne doit être lue.
 *
 * @param context - Contexte déjà chargé
 * @returns Fragment SQL, ou null pour une liste vide
 */
export function environmentVisibilitySql(context: EnvironmentAccessContext): Prisma.Sql | null {
  const where = environmentVisibilityWhere(context);
  if (where == null) {
    return null;
  }
  if (context.portalAdmin) {
    return Prisma.sql`1 = 1`;
  }
  const typenvids = where.typenvid?.in ?? [];
  const scopeIds = where.scopeId?.in ?? [];
  if (typenvids.length === 0 || scopeIds.length === 0) {
    return null;
  }
  return Prisma.sql`e.typenvid IN (${Prisma.join(typenvids)}) AND e.scopeId IN (${Prisma.join(scopeIds)})`;
}
