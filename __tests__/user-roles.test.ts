import { authorizeIdentifiedMenu, canAccessActiveMenu, hasAnyRole, hasAllRoles, parseRolesFromString, rolesStringIncludesAny } from "@/lib/user-roles";

describe("lib/user-roles helpers", () => {
  it("parseRolesFromString retourne un tableau vide si chaîne vide", () => {
    expect(parseRolesFromString("")).toEqual([]);
  });

  it("parseRolesFromString parse une chaîne format menu", () => {
    expect(parseRolesFromString('"ADMIN", "USER"')).toEqual(["ADMIN", "USER"]);
  });

  it("hasAnyRole détecte au moins un rôle commun", () => {
    expect(hasAnyRole(["ADMIN", "USER"], ["USER", "OTHER"])).toBe(true);
    expect(hasAnyRole(["ADMIN"], ["USER"])).toBe(false);
  });

  it("hasAllRoles vérifie que tous les rôles sont présents", () => {
    expect(hasAllRoles(["ADMIN", "USER"], ["ADMIN"])).toBe(true);
    expect(hasAllRoles(["ADMIN", "USER"], ["ADMIN", "USER"])).toBe(true);
    expect(hasAllRoles(["ADMIN", "USER"], ["ADMIN", "OTHER"])).toBe(false);
  });

  it("rolesStringIncludesAny fonctionne sur une chaîne formatée", () => {
    expect(rolesStringIncludesAny('"ADMIN", "USER"', ["USER"])).toBe(true);
    expect(rolesStringIncludesAny('"ADMIN"', ["USER"])).toBe(false);
  });

  it("PORTAL_ADMIN voit tous les menus actifs sans TMA_LOCAL ni PSADMIN", () => {
    expect(canAccessActiveMenu(["PORTAL_ADMIN"], ["TMA_LOCAL"])).toBe(true);
    expect(canAccessActiveMenu(["PORTAL_ADMIN"], ["PSADMIN"])).toBe(true);
    expect(canAccessActiveMenu(["PORTAL_ADMIN"], [])).toBe(true);
  });

  it("les autres rôles restent sur l'intersection du menu", () => {
    expect(canAccessActiveMenu(["TMA_LOCAL"], ["TMA_LOCAL"])).toBe(true);
    expect(canAccessActiveMenu(["TMA_LOCAL"], ["PSADMIN"])).toBe(false);
    expect(canAccessActiveMenu(["FT-MOE"], ["TMA_LOCAL"])).toBe(false);
    expect(canAccessActiveMenu(["FT-MOE"], [])).toBe(true);
  });

  it("n'autorise une famille que si le menu existe et est actif", () => {
    expect(authorizeIdentifiedMenu(["PORTAL_ADMIN"], { active: 1, roles: ["PSADMIN"] })).toBe(true);
    expect(authorizeIdentifiedMenu(["TMA_LOCAL"], { active: 1, roles: ["TMA_LOCAL"] })).toBe(true);
    expect(authorizeIdentifiedMenu(["TMA_LOCAL"], { active: 1, roles: ["PSADMIN"] })).toBe(false);
    expect(authorizeIdentifiedMenu(["FT-MOE"], { active: 1, roles: ["TMA_LOCAL"] })).toBe(false);
    expect(authorizeIdentifiedMenu(["PORTAL_ADMIN"], { active: 0, roles: ["TMA_LOCAL"] })).toBe(false);
    expect(authorizeIdentifiedMenu(["PORTAL_ADMIN"], null)).toBe(false);
  });
});

