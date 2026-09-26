import fs from "fs";
import path from "path";
import { requirePortalAdmin } from "@/lib/require-portal-admin";
import prisma from "@/lib/prisma";
import { importerLesStatus } from "@/actions/importharp";
import { importerLesStatus as importerLesStatusCore } from "@/lib/harp-import-core";
import { decidePortalAdminAccess } from "@/lib/user-scopes";

jest.mock("@/lib/require-portal-admin", () => ({
  requirePortalAdmin: jest.fn(),
}));

jest.mock("@/lib/prisma", () => ({
  __esModule: true,
  default: {
    statutenv: {
      findMany: jest.fn(),
      createMany: jest.fn(),
    },
    $executeRaw: jest.fn(),
  },
}));

jest.mock("react-toastify", () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

const adminGuard = requirePortalAdmin as jest.MockedFunction<typeof requirePortalAdmin>;
const statusLookup = prisma.statutenv.findMany as jest.Mock;

const completeCatalog = [
  "ANONYMISE",
  "BASE_ONLY",
  "DECOMMISSION",
  "DUMMY",
  "FERME",
  "INVISIBLE",
  "OBSOLETE",
  "OUVERT",
  "REFRESH",
  "RESTREINT",
].map((statenv) => ({ statenv }));

describe("frontière Web des imports", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("refuse un anonyme avant le métier", async () => {
    expect(decidePortalAdminAccess({ authenticated: false, userRoles: [] })).toBe("unauthenticated");
    adminGuard.mockResolvedValue({ ok: false, error: "Non authentifié" });
    await expect(importerLesStatus()).resolves.toEqual({ error: "Non authentifié" });
    expect(statusLookup).not.toHaveBeenCalled();
  });

  it("refuse un utilisateur normal avant le métier", async () => {
    expect(decidePortalAdminAccess({ authenticated: true, userRoles: ["REF"] })).toBe("forbidden");
    adminGuard.mockResolvedValue({ ok: false, error: "Accès refusé" });
    await expect(importerLesStatus()).resolves.toEqual({ error: "Accès refusé" });
    expect(statusLookup).not.toHaveBeenCalled();
  });

  it("refuse PSADMIN avant le métier", async () => {
    expect(decidePortalAdminAccess({ authenticated: true, userRoles: ["PSADMIN"] })).toBe("forbidden");
    adminGuard.mockResolvedValue({ ok: false, error: "Accès refusé" });
    await expect(importerLesStatus()).resolves.toEqual({ error: "Accès refusé" });
    expect(statusLookup).not.toHaveBeenCalled();
  });

  it("laisse PORTAL_ADMIN atteindre le métier", async () => {
    expect(decidePortalAdminAccess({ authenticated: true, userRoles: ["PORTAL_ADMIN"] })).toBe("allowed");
    adminGuard.mockResolvedValue({ ok: true });
    statusLookup.mockResolvedValue(completeCatalog);
    const result = await importerLesStatus();
    expect(statusLookup).toHaveBeenCalled();
    expect(result).toEqual({ info: "Le seed statutenv est déjà complet. Aucune ligne manquante." });
  });
});

describe("métier de migration indépendant de la session", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("exécute l'import sans appeler le contrôle Web", async () => {
    adminGuard.mockImplementation(() => {
      throw new Error("le métier ne doit pas demander une session");
    });
    statusLookup.mockResolvedValue(completeCatalog);
    const result = await importerLesStatusCore();
    expect(adminGuard).not.toHaveBeenCalled();
    expect(statusLookup).toHaveBeenCalled();
    expect("info" in result && result.info).toContain("déjà complet");
  });

  it("ne contient ni session, ni contournement d'authentification", () => {
    const source = fs.readFileSync(
      path.join(process.cwd(), "lib", "harp-import-core.ts"),
      "utf8"
    );
    expect(source).not.toContain("requirePortalAdmin");
    expect(source).not.toContain("auth(");
    expect(source).not.toContain("skipAuth");
    expect(source).not.toContain("isCli");
    expect(source).not.toContain("bypassAuth");
    expect(source).not.toContain('"use server"');
  });
});

describe("scripts CLI branchés sur le métier", () => {
  it("run-migration et run-init-migration n'importent pas la Server Action", () => {
    const runMigration = fs.readFileSync(
      path.join(process.cwd(), "scripts", "run-migration.ts"),
      "utf8"
    );
    const runInit = fs.readFileSync(
      path.join(process.cwd(), "scripts", "run-init-migration.ts"),
      "utf8"
    );
    const userMigration = fs.readFileSync(
      path.join(process.cwd(), "lib", "init-migration.ts"),
      "utf8"
    );
    const fullMigration = fs.readFileSync(
      path.join(process.cwd(), "lib", "init-full-migration.ts"),
      "utf8"
    );

    expect(runMigration).toContain('from "@/lib/init-migration"');
    expect(runMigration).not.toContain("importharp");
    expect(runInit).toContain('from "@/lib/init-full-migration"');
    expect(runInit).not.toContain("importharp");
    expect(userMigration).toContain('from "@/lib/harp-import-core"');
    expect(userMigration).not.toContain('from "@/actions/importharp"');
    expect(fullMigration).toContain('from "@/lib/harp-import-core"');
    expect(fullMigration).not.toContain('from "@/actions/importharp"');
    expect(userMigration).not.toContain("requirePortalAdmin");
    expect(fullMigration).not.toContain("requirePortalAdmin");
  });
});
