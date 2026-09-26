import fs from "fs";
import path from "path";
import { requirePortalAdmin } from "@/lib/require-portal-admin";
import prisma from "@/lib/prisma";
import { db } from "@/lib/db";
import { checkOrCreateUser } from "@/actions/check-or-create-user";
import { addUserRoles, removeUserRole } from "@/actions/user-roles";
import { createUserRoles } from "@/actions/create-useroles";
import { updateUserRoles } from "@/actions/update-useroles";
import { createUser } from "@/actions/create-user";
import { updateUser } from "@/actions/update-user";
import { importerLesStatus } from "@/actions/importharp";
import { decidePortalAdminAccess } from "@/lib/user-scopes";

jest.mock("@/lib/require-portal-admin", () => ({
  requirePortalAdmin: jest.fn(),
}));

jest.mock("@/lib/prisma", () => ({
  __esModule: true,
  default: {
    user: { findUnique: jest.fn() },
    harproles: { findMany: jest.fn(), findFirst: jest.fn() },
    harpuseroles: {
      findMany: jest.fn(),
      create: jest.fn(),
      createMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    statutenv: { findMany: jest.fn(), createMany: jest.fn() },
    $executeRaw: jest.fn(),
  },
}));

jest.mock("@/lib/db", () => ({
  db: {
    psadm_user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    user: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
    harproles: { findFirst: jest.fn() },
    harpuseroles: { findFirst: jest.fn(), create: jest.fn() },
  },
}));

jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}));

jest.mock("react-toastify", () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

const adminGuard = requirePortalAdmin as jest.MockedFunction<typeof requirePortalAdmin>;
const userLookup = prisma.user.findUnique as jest.Mock;
const statusLookup = prisma.statutenv.findMany as jest.Mock;
const legacyUserCreate = db.psadm_user.create as jest.Mock;
const legacyUserUpdate = db.psadm_user.update as jest.Mock;

describe("checkOrCreateUser neutralisé", () => {
  it("refuse sans lire ni écrire un utilisateur", async () => {
    const result = await checkOrCreateUser("quelquun", "mauvais-mot-de-passe");
    expect(result.success).toBe(false);
    expect(result.message).toBe("Accès refusé");
    expect(db.user.update).not.toHaveBeenCalled();
    expect(db.user.create).not.toHaveBeenCalled();
  });

  it("la route de test ne crée plus de compte et répond par un refus", () => {
    const source = fs.readFileSync(
      path.join(process.cwd(), "app", "api", "test-login", "route.ts"),
      "utf8"
    );
    expect(source).not.toContain("checkOrCreateUser");
    expect(source).toContain("status: 403");
    expect(source).toContain("Accès refusé");
  });
});

describe("attributions de rôles réservées à PORTAL_ADMIN", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("refuse une session absente avant toute lecture", async () => {
    adminGuard.mockResolvedValue({ ok: false, error: "Non authentifié" });
    const result = await addUserRoles("mbiaye", ["PORTAL_ADMIN"]);
    expect(result).toEqual({ success: false, error: "Non authentifié" });
    expect(userLookup).not.toHaveBeenCalled();
    expect(prisma.harpuseroles.create).not.toHaveBeenCalled();
    expect(prisma.harpuseroles.createMany).not.toHaveBeenCalled();
  });

  it("refuse un utilisateur authentifié, PSADMIN et un libellé de scope", async () => {
    adminGuard.mockResolvedValue({ ok: false, error: "Accès refusé" });
    const formData = new FormData();
    formData.set("netid", "mbiaye");
    formData.set("role", "PORTAL_ADMIN");

    await expect(removeUserRole("mbiaye", "TMA_LOCAL")).resolves.toEqual({
      success: false,
      error: "Accès refusé",
    });
    await expect(createUserRoles(formData)).resolves.toEqual({
      success: false,
      error: "Accès refusé",
    });
    await expect(updateUserRoles("mbiaye", "PSADMIN", formData)).resolves.toEqual({
      success: false,
      error: "Accès refusé",
    });
    expect(userLookup).not.toHaveBeenCalled();
    expect(db.user.findUnique).not.toHaveBeenCalled();
    expect(db.harpuseroles.create).not.toHaveBeenCalled();
  });

  it("laisse passer PORTAL_ADMIN puis s'arrête si la cible est inconnue", async () => {
    adminGuard.mockResolvedValue({ ok: true });
    userLookup.mockResolvedValue(null);
    const result = await addUserRoles("inconnu", ["TMA_LOCAL"]);
    expect(result.success).toBe(false);
    expect(userLookup).toHaveBeenCalledTimes(1);
    expect(prisma.harpuseroles.create).not.toHaveBeenCalled();
    expect(prisma.harpuseroles.createMany).not.toHaveBeenCalled();
  });
});

describe("création et mise à jour utilisateur", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("refuse l'anonyme et l'utilisateur normal avant toute écriture", async () => {
    adminGuard.mockResolvedValue({ ok: false, error: "Accès refusé" });
    const formData = new FormData();
    formData.set("netid", "nouveau");
    formData.set("password", "secret123");
    formData.set("pkeyfile", "C:\\cles\\autre.ppk");

    await expect(createUser(formData)).resolves.toEqual({
      success: false,
      error: "Accès refusé",
    });
    await expect(updateUser("mbiaye", formData)).resolves.toEqual({
      success: false,
      error: "Accès refusé",
    });
    expect(legacyUserCreate).not.toHaveBeenCalled();
    expect(legacyUserUpdate).not.toHaveBeenCalled();
    expect(db.psadm_user.findUnique).not.toHaveBeenCalled();
  });

  it("laisse passer PORTAL_ADMIN jusqu'à la validation, sans écriture si le formulaire est vide", async () => {
    adminGuard.mockResolvedValue({ ok: true });
    const result = await createUser(new FormData());
    expect(result.success).toBe(false);
    expect(result.error).not.toBe("Accès refusé");
    expect(legacyUserCreate).not.toHaveBeenCalled();
  });
});

describe("imports GO LIVE", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("refuse importerLesStatus avant toute lecture Prisma", async () => {
    adminGuard.mockResolvedValue({ ok: false, error: "Accès refusé" });
    await expect(importerLesStatus()).resolves.toEqual({ error: "Accès refusé" });
    expect(statusLookup).not.toHaveBeenCalled();
    expect(prisma.statutenv.createMany).not.toHaveBeenCalled();
  });

  it("place requirePortalAdmin au début de chaque export", () => {
    const source = fs.readFileSync(
      path.join(process.cwd(), "actions", "importharp.ts"),
      "utf8"
    );
    const exports = source
      .split("\n")
      .filter((line) => /^\s*export (async function|const \w+ = async)/.test(line));
    expect(exports.length).toBeGreaterThan(20);
    const lines = source.split("\n");
    for (let index = 0; index < lines.length; index += 1) {
      if (!/^\s*export (async function|const \w+ = async)/.test(lines[index])) {
        continue;
      }
      const window = lines.slice(index, index + 5).join("\n");
      expect(window).toContain("await requirePortalAdmin()");
    }
  });
});

describe("décision pure déjà utilisée par les gardes", () => {
  it("n'accepte ni PSADMIN, ni un scope, ni l'absence de session", () => {
    expect(decidePortalAdminAccess({ authenticated: false, userRoles: [] })).toBe("unauthenticated");
    expect(decidePortalAdminAccess({ authenticated: true, userRoles: ["PSADMIN"] })).toBe("forbidden");
    expect(decidePortalAdminAccess({ authenticated: true, userRoles: ["4K", "150K"] })).toBe("forbidden");
    expect(decidePortalAdminAccess({ authenticated: true, userRoles: ["PORTAL_ADMIN"] })).toBe("allowed");
  });
});
