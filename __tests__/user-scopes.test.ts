import { prepareUserScopeUpdate, normalizeRequestedScopeCodes } from "@/lib/user-scopes";

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

describe("normalizeRequestedScopeCodes", () => {
  it("refuse une valeur qui n'est pas une liste de chaînes", () => {
    expect(normalizeRequestedScopeCodes(999).ok).toBe(false);
    expect(normalizeRequestedScopeCodes(["4K", 20]).ok).toBe(false);
    expect(normalizeRequestedScopeCodes("4K").ok).toBe(false);
  });
});
