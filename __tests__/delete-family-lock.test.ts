/**
 * @jest-environment node
 */
import { requirePortalAdmin } from "@/lib/require-portal-admin";
import prisma from "@/lib/prisma";
import { HarpDisplayLockError } from "@/lib/harp-display-lock";
import { deleteFamily } from "@/actions/family-admin";
import { revalidatePath } from "next/cache";

jest.mock("@/lib/require-portal-admin", () => ({
  requirePortalAdmin: jest.fn(),
}));

jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}));

jest.mock("@/lib/prisma", () => ({
  __esModule: true,
  default: {
    harptypenv: { findUnique: jest.fn() },
    $transaction: jest.fn(),
  },
}));

const adminGuard = requirePortalAdmin as jest.MockedFunction<typeof requirePortalAdmin>;
const preview = prisma.harptypenv.findUnique as jest.Mock;
const transaction = prisma.$transaction as jest.Mock;
const refresh = revalidatePath as jest.Mock;

type FamilyRow = { id: number; typenv: string; typenvid: number | null };

type DeleteTx = {
  $executeRaw: jest.Mock;
  $queryRaw: jest.Mock;
  envsharp: { count: jest.Mock };
  harpsubroletypenv: { count: jest.Mock };
  harpmenus: { count: jest.Mock };
};

function sqlText(query: unknown): string {
  if (query && typeof query === "object" && "strings" in query) {
    const strings = (query as { strings: readonly string[] }).strings;
    return strings.join("?");
  }
  if (Array.isArray(query)) {
    return query.join("?");
  }
  return "";
}

function createTx(row: FamilyRow | undefined, removed = 1): DeleteTx {
  return {
    $executeRaw: jest.fn(async (query: unknown) => (sqlText(query).includes("DELETE") ? removed : 1)),
    $queryRaw: jest.fn(async () => (row ? [row] : [])),
    envsharp: { count: jest.fn(async () => 0) },
    harpsubroletypenv: { count: jest.fn(async () => 0) },
    harpmenus: { count: jest.fn(async () => 0) },
  };
}

function useTransaction(tx: DeleteTx) {
  transaction.mockImplementation(async (work: (client: DeleteTx) => Promise<unknown>) => work(tx));
}

describe("deleteFamily et le verrou de display", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    adminGuard.mockResolvedValue({ ok: true });
  });

  it("refuse sans administration et sans lecture", async () => {
    adminGuard.mockResolvedValue({ ok: false, error: "Accès refusé" });

    await expect(deleteFamily(4)).resolves.toEqual({ success: false, error: "Accès refusé" });

    expect(preview).not.toHaveBeenCalled();
    expect(transaction).not.toHaveBeenCalled();
  });

  it("refuse un identifiant technique invalide", async () => {
    await expect(deleteFamily(0)).resolves.toEqual({ success: false, error: "Famille introuvable" });
    expect(preview).not.toHaveBeenCalled();
  });

  it("verrouille le typenvid puis contrôle et supprime avec le même tx", async () => {
    const tx = createTx({ id: 4, typenv: "RECETTE", typenvid: 10 });
    preview.mockResolvedValue({ typenvid: 10 });
    useTransaction(tx);

    await expect(deleteFamily(4)).resolves.toEqual({
      success: true,
      message: "La famille a été supprimée",
    });

    expect(transaction).toHaveBeenCalledTimes(1);
    expect(transaction.mock.calls[0][1]).toEqual({ maxWait: 2000, timeout: 15000 });
    expect(sqlText(tx.$executeRaw.mock.calls[0][0])).toContain("harpdisplaylock");
    expect(sqlText(tx.$queryRaw.mock.calls[0][0])).toContain("FOR UPDATE");
    expect(tx.envsharp.count).toHaveBeenCalledWith({ where: { typenvid: 10 } });
    expect(tx.harpsubroletypenv.count).toHaveBeenCalledWith({ where: { typenvid: 10 } });
    expect(tx.harpmenus.count).toHaveBeenCalledWith({ where: { level: 3, display: 10 } });
    expect(sqlText(tx.$executeRaw.mock.calls[1][0])).toContain("DELETE FROM harptypenv");
    expect(refresh).toHaveBeenCalledWith("/list/families");
  });

  it("prend le verrou aux bornes 1 et 32767", async () => {
    for (const typenvid of [1, 32767]) {
      const tx = createTx({ id: 4, typenv: "BORNE", typenvid });
      preview.mockResolvedValue({ typenvid });
      useTransaction(tx);

      await expect(deleteFamily(4)).resolves.toMatchObject({ success: true });
      expect(sqlText(tx.$executeRaw.mock.calls[0][0])).toContain("harpdisplaylock");
    }
  });

  it("laisse un typenvid nul dans une transaction sans verrou", async () => {
    const tx = createTx({ id: 4, typenv: "SANS-ID", typenvid: null });
    preview.mockResolvedValue({ typenvid: null });
    useTransaction(tx);

    await expect(deleteFamily(4)).resolves.toMatchObject({ success: true });

    expect(transaction.mock.calls[0][1]).toBeUndefined();
    expect(tx.$executeRaw).toHaveBeenCalledTimes(1);
    expect(sqlText(tx.$executeRaw.mock.calls[0][0])).toContain("DELETE FROM harptypenv");
    expect(sqlText(tx.$queryRaw.mock.calls[0][0])).toContain("FOR UPDATE");
    expect(tx.envsharp.count).not.toHaveBeenCalled();
    expect(tx.harpsubroletypenv.count).not.toHaveBeenCalled();
    expect(tx.harpmenus.count).not.toHaveBeenCalled();
  });

  it("n'appelle pas le verrou hors de la plage", async () => {
    for (const typenvid of [0, 32768]) {
      const tx = createTx({ id: 4, typenv: "HORS", typenvid });
      preview.mockResolvedValue({ typenvid });
      useTransaction(tx);

      await expect(deleteFamily(4)).resolves.toMatchObject({ success: true });
      expect(transaction.mock.calls.at(-1)?.[1]).toBeUndefined();
      expect(sqlText(tx.$executeRaw.mock.calls[0][0])).not.toContain("harpdisplaylock");
      expect(tx.harpmenus.count).toHaveBeenCalledWith({ where: { level: 3, display: typenvid } });
    }
  });

  it("n'écrit pas quand le typenvid verrouillé a divergé", async () => {
    const tx = createTx({ id: 4, typenv: "RECETTE", typenvid: 11 });
    preview.mockResolvedValue({ typenvid: 10 });
    useTransaction(tx);

    await expect(deleteFamily(4)).resolves.toEqual({
      success: false,
      error: "L'identifiant de la famille a changé pendant le contrôle. Rien n'a été supprimé.",
    });

    expect(sqlText(tx.$executeRaw.mock.calls[0][0])).toContain("harpdisplaylock");
    expect(tx.$executeRaw).toHaveBeenCalledTimes(1);
    expect(tx.envsharp.count).not.toHaveBeenCalled();
    expect(tx.harpsubroletypenv.count).not.toHaveBeenCalled();
    expect(tx.harpmenus.count).not.toHaveBeenCalled();
    expect(refresh).not.toHaveBeenCalled();
  });

  it("conserve le refus quand un menu de niveau 3 occupe le display", async () => {
    const tx = createTx({ id: 4, typenv: "RECETTE", typenvid: 10 });
    tx.harpmenus.count.mockResolvedValue(2);
    preview.mockResolvedValue({ typenvid: 10 });
    useTransaction(tx);

    await expect(deleteFamily(4)).resolves.toEqual({
      success: false,
      error: "Suppression refusée : 2 menus de niveau 3. Aucun environnement, menu ou droit n'a été modifié.",
    });

    expect(tx.$executeRaw).toHaveBeenCalledTimes(1);
    expect(sqlText(tx.$executeRaw.mock.calls[0][0])).toContain("harpdisplaylock");
  });

  it("conserve le refus si le DELETE conditionnel ne retire rien", async () => {
    const tx = createTx({ id: 4, typenv: "RECETTE", typenvid: 10 }, 0);
    preview.mockResolvedValue({ typenvid: 10 });
    useTransaction(tx);

    await expect(deleteFamily(4)).resolves.toEqual({
      success: false,
      error: "La famille a reçu une dépendance pendant le contrôle. Rien n'a été supprimé.",
    });
    expect(refresh).not.toHaveBeenCalled();
  });

  it("renvoie le message du verrou sans suppression", async () => {
    preview.mockResolvedValue({ typenvid: 10 });
    transaction.mockRejectedValue(
      new HarpDisplayLockError("Le verrou de la famille 10 n'a pas été obtenu dans le délai", 10),
    );

    await expect(deleteFamily(4)).resolves.toEqual({
      success: false,
      error: "Le verrou de la famille 10 n'a pas été obtenu dans le délai",
    });
    expect(refresh).not.toHaveBeenCalled();
  });
});
