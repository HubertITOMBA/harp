import {
  prepareUserScopeUpdate,
  normalizeRequestedScopeCodes,
  resolveEnvironmentScopeFilter,
  environmentScopeWhere,
  decideEnvironmentServerAccess,
  decidePortalAdminAccess,
  normalizeEnvironmentName,
} from "@/lib/user-scopes";
import { updateInstance } from "@/schemas";

const catalog = [
  { id: 10, code: "4K" },
  { id: 20, code: "150K" },
  { id: 30, code: "UNASSIGNED" },
];

const admin = ["PORTAL_ADMIN"];
const user = ["TMA_LOCAL", "REF", "DRP", "POC92"];

describe("prepareUserScopeUpdate", () => {
  it("un opérateur PORTAL_ADMIN peut affecter 4K", () => {
    expect(
      prepareUserScopeUpdate({
        operatorRoles: admin,
        targetRoles: user,
        requestedCodes: ["4K"],
        catalog,
      })
    ).toEqual({ ok: true, scopeIds: [10] });
  });

  it("un opérateur PORTAL_ADMIN peut affecter 150K", () => {
    expect(
      prepareUserScopeUpdate({
        operatorRoles: admin,
        targetRoles: user,
        requestedCodes: ["150K"],
        catalog,
      })
    ).toEqual({ ok: true, scopeIds: [20] });
  });

  it("un opérateur PORTAL_ADMIN peut affecter 4K et 150K", () => {
    expect(
      prepareUserScopeUpdate({
        operatorRoles: admin,
        targetRoles: user,
        requestedCodes: ["150K", "4K"],
        catalog,
      })
    ).toEqual({ ok: true, scopeIds: [10, 20] });
  });

  it("un opérateur PORTAL_ADMIN peut retirer tous les scopes", () => {
    expect(
      prepareUserScopeUpdate({
        operatorRoles: admin,
        targetRoles: user,
        requestedCodes: [],
        catalog,
      })
    ).toEqual({ ok: true, scopeIds: [] });
  });

  it("refuse UNASSIGNED même combiné à un scope valide", () => {
    expect(
      prepareUserScopeUpdate({
        operatorRoles: admin,
        targetRoles: user,
        requestedCodes: ["4K", "UNASSIGNED"],
        catalog,
      }).ok
    ).toBe(false);
  });

  it("refuse un scope inconnu, ALL, ADMIN ou un identifiant", () => {
    for (const code of ["INCONNU", "ALL", "ADMIN", "PORTAL_ADMIN", "999"]) {
      expect(
        prepareUserScopeUpdate({
          operatorRoles: admin,
          targetRoles: user,
          requestedCodes: [code],
          catalog,
        }).ok
      ).toBe(false);
    }
  });

  it("refuse un opérateur qui n'est pas PORTAL_ADMIN", () => {
    expect(
      prepareUserScopeUpdate({
        operatorRoles: ["TMA_LOCAL"],
        targetRoles: user,
        requestedCodes: ["4K"],
        catalog,
      })
    ).toEqual({ ok: false, error: "Accès refusé" });
  });

  it("refuse d'affecter un périmètre à une cible PORTAL_ADMIN", () => {
    const result = prepareUserScopeUpdate({
      operatorRoles: admin,
      targetRoles: ["PORTAL_ADMIN", "TMA_LOCAL", "REF"],
      requestedCodes: ["4K", "150K"],
      catalog,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/périmètre individuel/);
    }
  });

  it("ignore UNASSIGNED présent dans le catalogue lors d'une sélection valide", () => {
    const result = prepareUserScopeUpdate({
      operatorRoles: admin,
      targetRoles: user,
      requestedCodes: ["4K"],
      catalog,
    });
    expect(result).toEqual({ ok: true, scopeIds: [10] });
  });
});

describe("resolveEnvironmentScopeFilter", () => {
  const assigned = [
    { id: 41, code: "4K" },
    { id: 52, code: "150K" },
    { id: 63, code: "UNASSIGNED" },
    { id: 77, code: "INCONNU" },
  ];

  it("PORTAL_ADMIN n'applique aucun filtre, même sans affectation", () => {
    expect(
      resolveEnvironmentScopeFilter({
        userRoles: ["PORTAL_ADMIN"],
        assignedScopes: [],
      })
    ).toEqual({ mode: "all" });
  });

  it("PORTAL_ADMIN ignore une ligne UNASSIGNED et ne filtre pas", () => {
    expect(
      resolveEnvironmentScopeFilter({
        userRoles: ["PORTAL_ADMIN", "TMA_LOCAL"],
        assignedScopes: [{ id: 63, code: "UNASSIGNED" }],
      })
    ).toEqual({ mode: "all" });
  });

  it("conserve 4K et 150K et écarte UNASSIGNED ainsi qu'un code inconnu", () => {
    expect(
      resolveEnvironmentScopeFilter({
        userRoles: ["TMA_LOCAL"],
        assignedScopes: assigned,
      })
    ).toEqual({ mode: "restricted", scopeIds: [41, 52] });
  });

  it("un utilisateur seulement 4K ne reçoit pas 150K", () => {
    const result = resolveEnvironmentScopeFilter({
      userRoles: ["TMA_LOCAL", "REF"],
      assignedScopes: [{ id: 41, code: "4K" }, { id: 63, code: "UNASSIGNED" }],
    });
    expect(result).toEqual({ mode: "restricted", scopeIds: [41] });
  });

  it("un utilisateur seulement 150K ne reçoit pas 4K", () => {
    expect(
      resolveEnvironmentScopeFilter({
        userRoles: ["TMA_LOCAL"],
        assignedScopes: [{ id: 52, code: "150K" }],
      })
    ).toEqual({ mode: "restricted", scopeIds: [52] });
  });

  it("4K et 150K forment l'union, dans l'ordre du catalogue affectable", () => {
    expect(
      resolveEnvironmentScopeFilter({
        userRoles: ["DRP"],
        assignedScopes: [
          { id: 52, code: "150K" },
          { id: 41, code: "4K" },
        ],
      })
    ).toEqual({ mode: "restricted", scopeIds: [41, 52] });
  });

  it("aucun scope autorisé produit une liste vide", () => {
    expect(
      resolveEnvironmentScopeFilter({
        userRoles: ["TMA_LOCAL", "POC92"],
        assignedScopes: [],
      })
    ).toEqual({ mode: "restricted", scopeIds: [] });
  });

  it("UNASSIGNED et un code inconnu sont ignorés", () => {
    const result = resolveEnvironmentScopeFilter({
      userRoles: ["FT-MOE"],
      assignedScopes: [
        { id: 63, code: "UNASSIGNED" },
        { id: 77, code: "INCONNU" },
      ],
    });
    expect(result).toEqual({ mode: "restricted", scopeIds: [] });
    if (result.mode === "restricted") {
      expect(result.scopeIds).not.toEqual(expect.arrayContaining([1, 2, 3, 63, 77]));
    }
  });
});

const scope4k = { id: 41, code: "4K" };
const scope150k = { id: 52, code: "150K" };
const scopeUnassigned = { id: 63, code: "UNASSIGNED" };
const scopeUnknown = { id: 77, code: "INCONNU" };

describe("export des environnements par scope", () => {
  it("PORTAL_ADMIN exporte sans clause de scope", () => {
    const filter = resolveEnvironmentScopeFilter({
      userRoles: ["PORTAL_ADMIN"],
      assignedScopes: [],
    });
    expect(environmentScopeWhere(filter)).toEqual({});
  });

  it("un utilisateur 4K n'exporte que son identifiant de scope", () => {
    const filter = resolveEnvironmentScopeFilter({
      userRoles: ["TMA_LOCAL"],
      assignedScopes: [scope4k],
    });
    expect(environmentScopeWhere(filter)).toEqual({ scopeId: { in: [41] } });
  });

  it("un utilisateur 150K n'exporte que son identifiant de scope", () => {
    const filter = resolveEnvironmentScopeFilter({
      userRoles: ["TMA_LOCAL"],
      assignedScopes: [scope150k],
    });
    expect(environmentScopeWhere(filter)).toEqual({ scopeId: { in: [52] } });
  });

  it("4K et 150K forment l'union exportée", () => {
    const filter = resolveEnvironmentScopeFilter({
      userRoles: ["DRP"],
      assignedScopes: [scope150k, scope4k],
    });
    expect(environmentScopeWhere(filter)).toEqual({ scopeId: { in: [41, 52] } });
  });

  it("aucun scope n'autorise aucun chargement", () => {
    const filter = resolveEnvironmentScopeFilter({
      userRoles: ["TMA_LOCAL"],
      assignedScopes: [],
    });
    expect(environmentScopeWhere(filter)).toBeNull();
  });

  it("UNASSIGNED seul n'autorise aucun chargement", () => {
    const filter = resolveEnvironmentScopeFilter({
      userRoles: ["TMA_LOCAL"],
      assignedScopes: [scopeUnassigned],
    });
    expect(environmentScopeWhere(filter)).toBeNull();
  });

  it("un scope inconnu est ignoré", () => {
    const filter = resolveEnvironmentScopeFilter({
      userRoles: ["FT-MOE"],
      assignedScopes: [scopeUnknown, scopeUnassigned],
    });
    expect(environmentScopeWhere(filter)).toBeNull();
  });

  it("PSADMIN seul n'ouvre pas l'export global", () => {
    const filter = resolveEnvironmentScopeFilter({
      userRoles: ["PSADMIN"],
      assignedScopes: [],
    });
    expect(filter).toEqual({ mode: "restricted", scopeIds: [] });
    expect(environmentScopeWhere(filter)).toBeNull();
  });
});

describe("accès GET /api/envserv", () => {
  const env4k = { scopeId: 41 };
  const env150k = { scopeId: 52 };
  const envUnassigned = { scopeId: 63 };
  const envNull = { scopeId: null };

  it("refuse sans session avant de regarder l'environnement", () => {
    expect(
      decideEnvironmentServerAccess({
        authenticated: false,
        environment: env4k,
        scopeFilter: { mode: "restricted", scopeIds: [41] },
      })
    ).toBe(401);
  });

  it("PORTAL_ADMIN lit 4K, 150K, UNASSIGNED et un scope nul sans affectation", () => {
    const scopeFilter = resolveEnvironmentScopeFilter({
      userRoles: ["PORTAL_ADMIN"],
      assignedScopes: [],
    });
    for (const environment of [env4k, env150k, envUnassigned, envNull]) {
      expect(
        decideEnvironmentServerAccess({
          authenticated: true,
          environment,
          scopeFilter,
        })
      ).toBe(200);
    }
  });

  it("un utilisateur 4K lit son environnement et pas celui du 150K", () => {
    const scopeFilter = resolveEnvironmentScopeFilter({
      userRoles: ["TMA_LOCAL"],
      assignedScopes: [scope4k],
    });
    expect(decideEnvironmentServerAccess({ authenticated: true, environment: env4k, scopeFilter })).toBe(200);
    expect(decideEnvironmentServerAccess({ authenticated: true, environment: env150k, scopeFilter })).toBe(403);
  });

  it("un utilisateur 150K lit son environnement et pas celui du 4K", () => {
    const scopeFilter = resolveEnvironmentScopeFilter({
      userRoles: ["TMA_LOCAL"],
      assignedScopes: [scope150k],
    });
    expect(decideEnvironmentServerAccess({ authenticated: true, environment: env150k, scopeFilter })).toBe(200);
    expect(decideEnvironmentServerAccess({ authenticated: true, environment: env4k, scopeFilter })).toBe(403);
  });

  it("4K et 150K autorisent les deux environnements", () => {
    const scopeFilter = resolveEnvironmentScopeFilter({
      userRoles: ["DRP"],
      assignedScopes: [scope4k, scope150k],
    });
    expect(decideEnvironmentServerAccess({ authenticated: true, environment: env4k, scopeFilter })).toBe(200);
    expect(decideEnvironmentServerAccess({ authenticated: true, environment: env150k, scopeFilter })).toBe(200);
  });

  it("aucun scope, UNASSIGNED et un scope nul sont refusés", () => {
    const empty = resolveEnvironmentScopeFilter({
      userRoles: ["TMA_LOCAL"],
      assignedScopes: [],
    });
    const unassignedOnly = resolveEnvironmentScopeFilter({
      userRoles: ["TMA_LOCAL"],
      assignedScopes: [scopeUnassigned],
    });
    expect(decideEnvironmentServerAccess({ authenticated: true, environment: env4k, scopeFilter: empty })).toBe(403);
    expect(decideEnvironmentServerAccess({ authenticated: true, environment: envUnassigned, scopeFilter: unassignedOnly })).toBe(403);
    expect(decideEnvironmentServerAccess({ authenticated: true, environment: envNull, scopeFilter: empty })).toBe(403);
  });

  it("un environnement absent répond 404", () => {
    const scopeFilter = resolveEnvironmentScopeFilter({
      userRoles: ["PORTAL_ADMIN"],
      assignedScopes: [],
    });
    expect(
      decideEnvironmentServerAccess({
        authenticated: true,
        environment: null,
        scopeFilter,
      })
    ).toBe(404);
  });

  it("PSADMIN seul n'obtient pas les environnements hors affectation", () => {
    const scopeFilter = resolveEnvironmentScopeFilter({
      userRoles: ["PSADMIN"],
      assignedScopes: [scopeUnassigned],
    });
    expect(scopeFilter.mode).toBe("restricted");
    expect(decideEnvironmentServerAccess({ authenticated: true, environment: env4k, scopeFilter })).toBe(403);
    expect(decideEnvironmentServerAccess({ authenticated: true, environment: env150k, scopeFilter })).toBe(403);
    expect(decideEnvironmentServerAccess({ authenticated: true, environment: envUnassigned, scopeFilter })).toBe(403);
  });
});

describe("mutations réservées à PORTAL_ADMIN", () => {
  it("refuse une session absente", () => {
    expect(decidePortalAdminAccess({ authenticated: false, userRoles: [] })).toBe("unauthenticated");
  });

  it("refuse un utilisateur normal, un libellé de scope ou PSADMIN", () => {
    for (const userRoles of [
      ["TMA_LOCAL"],
      ["REF"],
      ["DRP"],
      ["4K"],
      ["150K"],
      ["4K", "150K"],
      ["PSADMIN"],
      ["PSADMIN", "TMA_LOCAL"],
      [],
    ]) {
      expect(decidePortalAdminAccess({ authenticated: true, userRoles })).toBe("forbidden");
    }
  });

  it("autorise seulement PORTAL_ADMIN", () => {
    expect(decidePortalAdminAccess({ authenticated: true, userRoles: ["PORTAL_ADMIN"] })).toBe("allowed");
    expect(
      decidePortalAdminAccess({ authenticated: true, userRoles: ["PSADMIN", "PORTAL_ADMIN"] })
    ).toBe("allowed");
  });
});

describe("lecture getServerData", () => {
  const env4k = { scopeId: 41 };
  const env150k = { scopeId: 52 };
  const envUnassigned = { scopeId: 63 };
  const envNull = { scopeId: null };

  it("PORTAL_ADMIN lit tous les classements, sans affectation", () => {
    const scopeFilter = resolveEnvironmentScopeFilter({
      userRoles: ["PORTAL_ADMIN"],
      assignedScopes: [],
    });
    expect(scopeFilter).toEqual({ mode: "all" });
    for (const environment of [env4k, env150k, envUnassigned, envNull]) {
      expect(
        decideEnvironmentServerAccess({ authenticated: true, environment, scopeFilter })
      ).toBe(200);
    }
  });

  it("un utilisateur 4K ne lit pas le 150K", () => {
    const scopeFilter = resolveEnvironmentScopeFilter({
      userRoles: ["TMA_LOCAL"],
      assignedScopes: [{ id: 41, code: "4K" }],
    });
    expect(decideEnvironmentServerAccess({ authenticated: true, environment: env4k, scopeFilter })).toBe(200);
    expect(decideEnvironmentServerAccess({ authenticated: true, environment: env150k, scopeFilter })).toBe(403);
  });

  it("un utilisateur 150K ne lit pas le 4K", () => {
    const scopeFilter = resolveEnvironmentScopeFilter({
      userRoles: ["TMA_LOCAL"],
      assignedScopes: [{ id: 52, code: "150K" }],
    });
    expect(decideEnvironmentServerAccess({ authenticated: true, environment: env150k, scopeFilter })).toBe(200);
    expect(decideEnvironmentServerAccess({ authenticated: true, environment: env4k, scopeFilter })).toBe(403);
  });

  it("4K et 150K autorisent les deux environnements", () => {
    const scopeFilter = resolveEnvironmentScopeFilter({
      userRoles: ["DRP"],
      assignedScopes: [
        { id: 41, code: "4K" },
        { id: 52, code: "150K" },
      ],
    });
    expect(decideEnvironmentServerAccess({ authenticated: true, environment: env4k, scopeFilter })).toBe(200);
    expect(decideEnvironmentServerAccess({ authenticated: true, environment: env150k, scopeFilter })).toBe(200);
  });

  it("aucun scope, UNASSIGNED, un code inconnu, un environnement non affecté ou un scope nul sont refusés", () => {
    const empty = resolveEnvironmentScopeFilter({
      userRoles: ["TMA_LOCAL"],
      assignedScopes: [],
    });
    const unassignedOnly = resolveEnvironmentScopeFilter({
      userRoles: ["TMA_LOCAL"],
      assignedScopes: [{ id: 63, code: "UNASSIGNED" }],
    });
    const unknown = resolveEnvironmentScopeFilter({
      userRoles: ["FT-MOE"],
      assignedScopes: [{ id: 77, code: "INCONNU" }],
    });
    expect(decideEnvironmentServerAccess({ authenticated: true, environment: env4k, scopeFilter: empty })).toBe(403);
    expect(decideEnvironmentServerAccess({ authenticated: true, environment: envUnassigned, scopeFilter: unassignedOnly })).toBe(403);
    expect(decideEnvironmentServerAccess({ authenticated: true, environment: env4k, scopeFilter: unknown })).toBe(403);
    expect(decideEnvironmentServerAccess({ authenticated: true, environment: envNull, scopeFilter: empty })).toBe(403);
  });

  it("PSADMIN seul n'obtient pas l'accès global", () => {
    const scopeFilter = resolveEnvironmentScopeFilter({
      userRoles: ["PSADMIN"],
      assignedScopes: [],
    });
    expect(scopeFilter).toEqual({ mode: "restricted", scopeIds: [] });
    expect(decideEnvironmentServerAccess({ authenticated: true, environment: env4k, scopeFilter })).toBe(403);
    expect(decideEnvironmentServerAccess({ authenticated: true, environment: env150k, scopeFilter })).toBe(403);
    expect(decideEnvironmentServerAccess({ authenticated: true, environment: envUnassigned, scopeFilter })).toBe(403);
    expect(decideEnvironmentServerAccess({ authenticated: true, environment: envNull, scopeFilter })).toBe(403);
  });

  it("conserve le nom métier saisi, après suppression des blancs de bord", () => {
    expect(normalizeEnvironmentName("FHHPR1")).toBe("FHHPR1");
    expect(normalizeEnvironmentName("  FHHPR1  ")).toBe("FHHPR1");
    expect(normalizeEnvironmentName("")).toBeNull();
    expect(normalizeEnvironmentName("   ")).toBeNull();
    expect(normalizeEnvironmentName(12)).toBeNull();
  });
});

describe("cible de updateInst", () => {
  it("le payload correspond aux colonnes de harpinstance, pas à envsharp", () => {
    expect(Object.keys(updateInstance.shape).sort()).toEqual([
      "descr",
      "id",
      "oracle_sid",
      "serverId",
      "typebaseId",
    ]);
  });
});

describe("normalizeRequestedScopeCodes", () => {
  it("refuse une valeur qui n'est pas une liste de chaînes", () => {
    expect(normalizeRequestedScopeCodes(999).ok).toBe(false);
    expect(normalizeRequestedScopeCodes(["4K", 20]).ok).toBe(false);
    expect(normalizeRequestedScopeCodes("4K").ok).toBe(false);
  });
});
