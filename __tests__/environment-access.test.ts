import { canAccessTypeEnv, type TypeEnvAccessGrant } from "@/lib/user-roles";
import { decideEnvironmentFamilyAndScope, resolveEnvironmentScopeFilter } from "@/lib/user-scopes";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { getAllUserRoles } from "@/actions/get-all-user-roles";
import { loadEnvironmentScopeFilter } from "@/lib/load-environment-scope-filter";
import { canAccessTypeEnvForSession } from "@/lib/type-env-access";
import {
  authorizeResolvedEnvironment,
  canAccessEnvironmentForSession,
} from "@/lib/environment-access";

jest.mock("@/auth", () => ({
  auth: jest.fn(),
}));

jest.mock("@/actions/get-all-user-roles", () => ({
  getAllUserRoles: jest.fn(),
}));

jest.mock("@/lib/load-environment-scope-filter", () => ({
  loadEnvironmentScopeFilter: jest.fn(),
}));

jest.mock("@/lib/type-env-access", () => ({
  canAccessTypeEnvForSession: jest.fn(),
}));

jest.mock("@/lib/prisma", () => ({
  __esModule: true,
  default: {
    envsharp: { findUnique: jest.fn() },
  },
}));

const dev = [2, 3, 4, 5, 6, 7];

function grantsFor(role: string, typenvids: number[]): TypeEnvAccessGrant[] {
  return typenvids.map((typenvid) => ({ role, active: true, typenvid }));
}

const rbacGrants: TypeEnvAccessGrant[] = [
  ...grantsFor("TMA_LOCAL", [...dev, 8, 9, 10, 11, 12, 15, 21]),
  ...grantsFor("TMA_OFFSHORE", [...dev, 8, 9, 21]),
  ...grantsFor("FT-MOE", [10, 12]),
  ...grantsFor("PSADMIN", [11]),
];

const scopeIn = { mode: "restricted" as const, scopeIds: [41] };
const scopeOut = { mode: "restricted" as const, scopeIds: [52] };

function pageAllows(roles: string[], typenvid: number): boolean {
  return canAccessTypeEnv({ userRoles: roles, typenvid, grants: rbacGrants });
}

function serverStatus(roles: string[], typenvid: number, scopeId: number, scopeFilter = scopeIn) {
  return decideEnvironmentFamilyAndScope({
    authenticated: true,
    environment: { scopeId },
    familyAllowed: pageAllows(roles, typenvid),
    scopeFilter,
  });
}

describe("décision environnement = RBAC famille puis scope", () => {
  it("TMA_LOCAL autorise la famille 11 dans le scope", () => {
    expect(pageAllows(["TMA_LOCAL"], 11)).toBe(true);
    expect(serverStatus(["TMA_LOCAL"], 11, 41)).toBe(200);
  });

  it("TMA_LOCAL refuse la famille 13 même dans le scope", () => {
    expect(pageAllows(["TMA_LOCAL"], 13)).toBe(false);
    expect(serverStatus(["TMA_LOCAL"], 13, 41)).toBe(403);
  });

  it("TMA_LOCAL refuse la famille 19", () => {
    expect(pageAllows(["TMA_LOCAL"], 19)).toBe(false);
    expect(serverStatus(["TMA_LOCAL"], 19, 41)).toBe(403);
  });

  it("TMA_OFFSHORE autorise la famille 2 dans le scope et refuse la 15", () => {
    expect(serverStatus(["TMA_OFFSHORE"], 2, 41)).toBe(200);
    expect(pageAllows(["TMA_OFFSHORE"], 15)).toBe(false);
    expect(serverStatus(["TMA_OFFSHORE"], 15, 41)).toBe(403);
  });

  it("FT-MOE autorise la famille 10 dans le scope et refuse la 13", () => {
    expect(serverStatus(["FT-MOE"], 10, 41)).toBe(200);
    expect(pageAllows(["FT-MOE"], 13)).toBe(false);
    expect(serverStatus(["FT-MOE"], 13, 41)).toBe(403);
  });

  it("refuse une famille autorisée hors scope et l'accepte dans le scope", () => {
    expect(serverStatus(["TMA_LOCAL"], 11, 41, scopeOut)).toBe(403);
    expect(serverStatus(["TMA_LOCAL"], 11, 41, scopeIn)).toBe(200);
  });

  it("PORTAL_ADMIN reste autorisé sans filtre 4K/150K", () => {
    const scopeFilter = resolveEnvironmentScopeFilter({
      userRoles: ["PORTAL_ADMIN"],
      assignedScopes: [],
    });
    expect(scopeFilter).toEqual({ mode: "all" });
    expect(pageAllows(["PORTAL_ADMIN"], 13)).toBe(true);
    expect(
      decideEnvironmentFamilyAndScope({
        authenticated: true,
        environment: { scopeId: null },
        familyAllowed: true,
        scopeFilter,
      })
    ).toBe(200);
  });

  it("refuse un rôle sans mapping", () => {
    expect(pageAllows(["DADS"], 8)).toBe(false);
    expect(serverStatus(["DADS"], 8, 41)).toBe(403);
  });

  it("refuse sans session avant de décrire l'environnement", () => {
    expect(
      decideEnvironmentFamilyAndScope({
        authenticated: false,
        environment: { scopeId: 41 },
        familyAllowed: true,
        scopeFilter: scopeIn,
      })
    ).toBe(401);
  });

  it("refuse un environnement absent", () => {
    expect(
      decideEnvironmentFamilyAndScope({
        authenticated: true,
        environment: null,
        familyAllowed: true,
        scopeFilter: scopeIn,
      })
    ).toBe(404);
  });

  it("une page refusée ne peut pas être autorisée par la décision serveur", () => {
    for (const [roles, typenvid] of [
      [["TMA_LOCAL"], 13],
      [["TMA_LOCAL"], 19],
      [["TMA_OFFSHORE"], 15],
      [["FT-MOE"], 13],
      [["DADS"], 11],
    ] as const) {
      expect(pageAllows([...roles], typenvid)).toBe(false);
      expect(serverStatus([...roles], typenvid, 41)).toBe(403);
    }
  });
});

const sessionAuth = auth as jest.MockedFunction<typeof auth>;
const roles = getAllUserRoles as jest.MockedFunction<typeof getAllUserRoles>;
const scopeFilter = loadEnvironmentScopeFilter as jest.MockedFunction<typeof loadEnvironmentScopeFilter>;
const family = canAccessTypeEnvForSession as jest.MockedFunction<typeof canAccessTypeEnvForSession>;
const findEnv = prisma.envsharp.findUnique as jest.Mock;

describe("canAccessEnvironmentForSession", () => {
  beforeEach(() => {
    sessionAuth.mockReset();
    roles.mockReset();
    scopeFilter.mockReset();
    family.mockReset();
    findEnv.mockReset();
    sessionAuth.mockResolvedValue({ user: { id: "7" } } as never);
  });

  it("refuse un identifiant invalide sans lire l'environnement", async () => {
    await expect(canAccessEnvironmentForSession(0)).resolves.toBe(400);
    await expect(canAccessEnvironmentForSession(-3)).resolves.toBe(400);
    expect(findEnv).not.toHaveBeenCalled();
  });

  it("refuse sans session avant la lecture", async () => {
    sessionAuth.mockResolvedValue(null as never);
    await expect(canAccessEnvironmentForSession(9)).resolves.toBe(401);
    expect(findEnv).not.toHaveBeenCalled();
  });

  it("refuse un environnement inexistant", async () => {
    findEnv.mockResolvedValue(null);
    await expect(canAccessEnvironmentForSession(9)).resolves.toBe(404);
  });

  it("dérive le typenvid de la ligne et refuse la famille avant le scope", async () => {
    findEnv.mockResolvedValue({ id: 9, typenvid: 13, scopeId: 41 });
    family.mockResolvedValue(false);

    await expect(canAccessEnvironmentForSession(9)).resolves.toBe(403);
    expect(family).toHaveBeenCalledWith(13);
    expect(scopeFilter).not.toHaveBeenCalled();
  });

  it("autorise seulement si la famille et le scope passent", async () => {
    findEnv.mockResolvedValue({ id: 9, typenvid: 11, scopeId: 41 });
    family.mockResolvedValue(true);
    scopeFilter.mockResolvedValue({ mode: "restricted", scopeIds: [41] });

    await expect(canAccessEnvironmentForSession(9)).resolves.toBe(200);
    expect(family).toHaveBeenCalledWith(11);
  });

  it("refuse le scope même si la famille est autorisée", async () => {
    findEnv.mockResolvedValue({ id: 9, typenvid: 11, scopeId: 41 });
    family.mockResolvedValue(true);
    scopeFilter.mockResolvedValue({ mode: "restricted", scopeIds: [52] });

    await expect(canAccessEnvironmentForSession(9)).resolves.toBe(403);
  });

  it("laisse PORTAL_ADMIN sur le filtre ouvert, y compris scope nul", async () => {
    findEnv.mockResolvedValue({ id: 9, typenvid: 19, scopeId: null });
    family.mockResolvedValue(true);
    scopeFilter.mockResolvedValue({ mode: "all" });

    await expect(canAccessEnvironmentForSession(9)).resolves.toBe(200);
    expect(family).toHaveBeenCalledWith(19);
  });
});

describe("authorizeResolvedEnvironment", () => {
  beforeEach(() => {
    sessionAuth.mockReset();
    roles.mockReset();
    scopeFilter.mockReset();
    family.mockReset();
    sessionAuth.mockResolvedValue({ user: { id: "7" } } as never);
  });

  it("produit le même refus que l'accès par identifiant pour la famille 13", async () => {
    family.mockResolvedValue(false);
    const byRow = await authorizeResolvedEnvironment({ id: 9, typenvid: 13, scopeId: 41 });
    expect(byRow).toBe(403);
    expect(scopeFilter).not.toHaveBeenCalled();
  });

  it("autorise PORTAL_ADMIN sans typenvid et sans filtre 4K/150K", async () => {
    roles.mockResolvedValue(["PORTAL_ADMIN"]);
    scopeFilter.mockResolvedValue({ mode: "all" });

    await expect(
      authorizeResolvedEnvironment({ id: 9, typenvid: null, scopeId: null })
    ).resolves.toBe(200);
    expect(family).not.toHaveBeenCalled();
  });

  it("refuse une famille absente pour un rôle ordinaire", async () => {
    roles.mockResolvedValue(["TMA_LOCAL"]);

    await expect(
      authorizeResolvedEnvironment({ id: 9, typenvid: null, scopeId: 41 })
    ).resolves.toBe(403);
    expect(family).not.toHaveBeenCalled();
    expect(scopeFilter).not.toHaveBeenCalled();
  });
});
