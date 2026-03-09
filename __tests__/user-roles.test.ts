import { hasAnyRole, hasAllRoles, parseRolesFromString, rolesStringIncludesAny } from "@/lib/user-roles";

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
});

