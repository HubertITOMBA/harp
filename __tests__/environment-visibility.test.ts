/**
 * @jest-environment node
 */
import { accessibleTypenvIds, canAccessTypeEnv, type TypeEnvAccessGrant } from "@/lib/user-roles";
import {
  canSeeEnvironment,
  environmentVisibilitySql,
  environmentVisibilityWhere,
  type EnvironmentAccessContext,
} from "@/lib/user-scopes";

const dev = [2, 3, 4, 5, 6, 7];

function grantsFor(role: string, typenvids: number[]): TypeEnvAccessGrant[] {
  return typenvids.map((typenvid) => ({ role, active: true, typenvid }));
}

const rbacGrants: TypeEnvAccessGrant[] = [
  ...grantsFor("TMA_LOCAL", [...dev, 8, 9, 10, 11, 12, 15, 21]),
  ...grantsFor("TMA_OFFSHORE", [...dev, 8, 9, 21]),
  ...grantsFor("FT-MOE", [10, 12]),
];

function contextFor(roles: string[], scopeIds: number[]): EnvironmentAccessContext {
  return {
    authenticated: true,
    portalAdmin: roles.includes("PORTAL_ADMIN"),
    allowedTypenvIds: accessibleTypenvIds({ userRoles: roles, grants: rbacGrants }),
    scopeFilter: roles.includes("PORTAL_ADMIN")
      ? { mode: "all" }
      : { mode: "restricted", scopeIds },
  };
}

describe("visibilité des listes d'environnements", () => {
  it("montre une famille autorisée dans le scope", () => {
    const context = contextFor(["TMA_LOCAL"], [41]);
    expect(canSeeEnvironment(context, { typenvid: 11, scopeId: 41 })).toBe(true);
    expect(environmentVisibilityWhere(context)).toEqual({
      typenvid: { in: expect.arrayContaining([11]) },
      scopeId: { in: [41] },
    });
  });

  it("cache une famille refusée même dans le scope", () => {
    const context = contextFor(["TMA_LOCAL"], [41]);
    expect(canSeeEnvironment(context, { typenvid: 13, scopeId: 41 })).toBe(false);
    expect(canSeeEnvironment(context, { typenvid: 19, scopeId: 41 })).toBe(false);
  });

  it("cache une famille autorisée hors scope", () => {
    const context = contextFor(["TMA_LOCAL"], [52]);
    expect(canSeeEnvironment(context, { typenvid: 11, scopeId: 41 })).toBe(false);
  });

  it("unit les familles de plusieurs rôles", () => {
    const roles = ["TMA_LOCAL", "FT-MOE"];
    const ids = accessibleTypenvIds({ userRoles: roles, grants: rbacGrants });
    expect(ids).toEqual(expect.arrayContaining([11, 12, 13].filter((id) => id !== 13)));
    expect(ids).toEqual(expect.arrayContaining([11, 12]));
    expect(ids).not.toContain(13);
    const context = contextFor(roles, [41]);
    expect(canSeeEnvironment(context, { typenvid: 11, scopeId: 41 })).toBe(true);
    expect(canSeeEnvironment(context, { typenvid: 12, scopeId: 41 })).toBe(true);
    expect(canAccessTypeEnv({ userRoles: roles, typenvid: 12, grants: rbacGrants })).toBe(true);
  });

  it("laisse PORTAL_ADMIN voir une famille et un scope quelconques", () => {
    const context = contextFor(["PORTAL_ADMIN"], []);
    expect(context.allowedTypenvIds).toBeNull();
    expect(environmentVisibilityWhere(context)).toEqual({});
    expect(canSeeEnvironment(context, { typenvid: 13, scopeId: null })).toBe(true);
    expect(environmentVisibilitySql(context)?.strings.join("")).toContain("1 = 1");
  });

  it("ne donne aucune ligne à un rôle sans mapping", () => {
    const context = contextFor(["DADS"], [41]);
    expect(context.allowedTypenvIds).toEqual([]);
    expect(environmentVisibilityWhere(context)).toBeNull();
    expect(environmentVisibilitySql(context)).toBeNull();
    expect(canSeeEnvironment(context, { typenvid: 11, scopeId: 41 })).toBe(false);
  });

  it("ne fait pas réapparaître un environnement invisible par son nom exact", () => {
    const context = contextFor(["TMA_LOCAL"], [41]);
    const rows = [
      { env: "SECRET13", typenvid: 13, scopeId: 41 },
      { env: "VISIBLE11", typenvid: 11, scopeId: 41 },
    ];
    const searched = rows.filter(
      (row) => row.env === "SECRET13" && canSeeEnvironment(context, row)
    );
    expect(searched).toEqual([]);
    const visible = rows.filter((row) => canSeeEnvironment(context, row));
    expect(visible.map((row) => row.env)).toEqual(["VISIBLE11"]);
  });

  it("pousse famille et scope dans la même clause SQL", () => {
    const sql = environmentVisibilitySql(contextFor(["FT-MOE"], [41]));
    const text = sql?.strings.join(" ") ?? "";
    expect(text).toContain("e.typenvid IN");
    expect(text).toContain("e.scopeId IN");
    expect(sql?.values).toEqual(expect.arrayContaining([10, 12, 41]));
    expect(sql?.values).not.toContain(13);
  });
});
