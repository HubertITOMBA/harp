import { authorizeIdentifiedMenu, canAccessActiveMenu, canAccessTypeEnv, hasAnyRole, hasAllRoles, parseRolesFromString, rolesStringIncludesAny, type TypeEnvAccessGrant } from "@/lib/user-roles";

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

const dev = [2, 3, 4, 5, 6, 7];

function grantsFor(role: string, typenvids: number[], active = true): TypeEnvAccessGrant[] {
  return typenvids.map((typenvid) => ({ role, active, typenvid }));
}

/** Matrice validée, fournie au moteur. Les tests ne lisent pas DEV. */
const rbacGrants: TypeEnvAccessGrant[] = [
  ...grantsFor("TMA_LOCAL", [...dev, 8, 9, 10, 11, 12, 15, 21]),
  ...grantsFor("TMA_OFFSHORE", [...dev, 8, 9, 21]),
  ...grantsFor("FT-MOE", [10, 12]),
  ...grantsFor("PSADMIN", [11]),
];

describe("canAccessTypeEnv", () => {
  it("autorise PORTAL_ADMIN sans ligne harprolesubrole", () => {
    expect(canAccessTypeEnv({ userRoles: ["PORTAL_ADMIN"], typenvid: 12, grants: [] })).toBe(true);
    expect(canAccessTypeEnv({ userRoles: ["USER", "PORTAL_ADMIN"], typenvid: 16, grants: [] })).toBe(true);
  });

  it.each([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 15, 21])(
    "autorise TMA_LOCAL sur le typenvid %s",
    (typenvid: number) => {
      expect(canAccessTypeEnv({ userRoles: ["TMA_LOCAL"], typenvid, grants: rbacGrants })).toBe(true);
    }
  );

  it.each([13, 16, 19])("refuse TMA_LOCAL sur le typenvid %s", (typenvid: number) => {
    expect(canAccessTypeEnv({ userRoles: ["TMA_LOCAL"], typenvid, grants: rbacGrants })).toBe(false);
  });

  it.each([2, 3, 4, 5, 6, 7, 8, 9, 21])(
    "autorise TMA_OFFSHORE sur le typenvid %s",
    (typenvid: number) => {
      expect(canAccessTypeEnv({ userRoles: ["TMA_OFFSHORE"], typenvid, grants: rbacGrants })).toBe(true);
    }
  );

  it.each([10, 11, 12, 13, 15, 16, 19])(
    "refuse TMA_OFFSHORE sur le typenvid %s",
    (typenvid: number) => {
      expect(canAccessTypeEnv({ userRoles: ["TMA_OFFSHORE"], typenvid, grants: rbacGrants })).toBe(false);
    }
  );

  it("autorise FT-MOE sur la recette et la production", () => {
    expect(canAccessTypeEnv({ userRoles: ["FT-MOE"], typenvid: 10, grants: rbacGrants })).toBe(true);
    expect(canAccessTypeEnv({ userRoles: ["FT-MOE"], typenvid: 12, grants: rbacGrants })).toBe(true);
  });

  it.each([9, 11, 13])("refuse FT-MOE sur le typenvid %s", (typenvid: number) => {
    expect(canAccessTypeEnv({ userRoles: ["FT-MOE"], typenvid, grants: rbacGrants })).toBe(false);
  });

  it("autorise PSADMIN seulement sur la pré-production", () => {
    expect(canAccessTypeEnv({ userRoles: ["PSADMIN"], typenvid: 11, grants: rbacGrants })).toBe(true);
    expect(canAccessTypeEnv({ userRoles: ["PSADMIN"], typenvid: 10, grants: rbacGrants })).toBe(false);
    expect(canAccessTypeEnv({ userRoles: ["PSADMIN"], typenvid: 12, grants: rbacGrants })).toBe(false);
  });

  it("refuse un rôle sans mapping, USER seul, un typenvid inconnu et une liste de rôles vide", () => {
    expect(canAccessTypeEnv({ userRoles: ["DADS"], typenvid: 9, grants: rbacGrants })).toBe(false);
    expect(canAccessTypeEnv({ userRoles: ["USER"], typenvid: 8, grants: rbacGrants })).toBe(false);
    expect(canAccessTypeEnv({ userRoles: ["TMA_LOCAL"], typenvid: 99, grants: rbacGrants })).toBe(false);
    expect(canAccessTypeEnv({ userRoles: [], typenvid: 8, grants: rbacGrants })).toBe(false);
  });

  it("refuse un sous-rôle inactif et un typenvid qui n'est pas un identifiant", () => {
    const inactive = grantsFor("TMA_LOCAL", [8], false);
    expect(canAccessTypeEnv({ userRoles: ["TMA_LOCAL"], typenvid: 8, grants: inactive })).toBe(false);
    expect(canAccessTypeEnv({ userRoles: ["PORTAL_ADMIN"], typenvid: 0, grants: [] })).toBe(false);
    expect(canAccessTypeEnv({ userRoles: ["TMA_LOCAL"], typenvid: 1.5, grants: rbacGrants })).toBe(false);
  });
});

