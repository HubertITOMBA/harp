import { prepareUserScopeUpdate, normalizeRequestedScopeCodes, resolveEnvironmentScopeFilter } from "@/lib/user-scopes";

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

describe("normalizeRequestedScopeCodes", () => {
  it("refuse une valeur qui n'est pas une liste de chaînes", () => {
    expect(normalizeRequestedScopeCodes(999).ok).toBe(false);
    expect(normalizeRequestedScopeCodes(["4K", 20]).ok).toBe(false);
    expect(normalizeRequestedScopeCodes("4K").ok).toBe(false);
  });
});
