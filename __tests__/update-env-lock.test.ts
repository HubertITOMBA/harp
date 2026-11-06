/**
 * @jest-environment node
 */
import { requirePortalAdmin } from "@/lib/require-portal-admin";
import prisma from "@/lib/prisma";
import { db } from "@/lib/db";
import { HarpDisplayLockError } from "@/lib/harp-display-lock";
import { updateEnv } from "@/actions/update-env";
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
    $transaction: jest.fn(),
  },
}));

jest.mock("@/lib/db", () => ({
  db: {
    envsharp: {
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
  },
}));

const adminGuard = requirePortalAdmin as jest.MockedFunction<typeof requirePortalAdmin>;
const transaction = prisma.$transaction as jest.Mock;
const directLookup = db.envsharp.findUnique as jest.Mock;
const directUpdate = db.envsharp.update as jest.Mock;
const directUpdateMany = db.envsharp.updateMany as jest.Mock;
const refresh = revalidatePath as jest.Mock;

type EnvTx = {
  $executeRaw: jest.Mock;
  envsharp: {
    findUnique: jest.Mock;
    update: jest.Mock;
  };
};

function sqlText(query: unknown): string {
  if (query && typeof query === "object" && "strings" in query) {
    return (query as { strings: readonly string[] }).strings.join("?");
  }
  return "";
}

function createTx(row: { typenvid: number | null; statenvId: number | null } | null): EnvTx {
  return {
    $executeRaw: jest.fn(async () => 1),
    envsharp: {
      findUnique: jest.fn(async () => row),
      update: jest.fn(async () => ({ id: 1 })),
    },
  };
}

function useTransaction(tx: EnvTx) {
  transaction.mockImplementation(async (work: (client: EnvTx) => Promise<unknown>) => work(tx));
}

function form(fields: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    data.set(key, value);
  }
  return data;
}

describe("updateEnv et le verrou de display", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    adminGuard.mockResolvedValue({ ok: true });
    directUpdate.mockResolvedValue({ id: 1 });
    directUpdateMany.mockResolvedValue({ count: 1 });
  });

  it("refuse sans administration et sans lecture", async () => {
    adminGuard.mockResolvedValue({ ok: false, error: "Accès refusé" });

    await expect(updateEnv("DEV01", form({ typenvid: "10" }))).resolves.toEqual({
      success: false,
      error: "Accès refusé",
    });

    expect(directLookup).not.toHaveBeenCalled();
    expect(transaction).not.toHaveBeenCalled();
    expect(refresh).not.toHaveBeenCalled();
  });

  it("n'écrit pas typenvid quand le champ est absent", async () => {
    directLookup.mockResolvedValue({ typenvid: 3, statenvId: 4 });

    await expect(updateEnv("DEV01", form({ descr: "fiche" }))).resolves.toEqual({
      success: true,
      message: "L'environnement DEV01 a été mis à jour avec succès",
    });

    expect(transaction).not.toHaveBeenCalled();
    expect(directUpdateMany).not.toHaveBeenCalled();
    const written = directUpdate.mock.calls[0][0].data;
    expect(written).toEqual(expect.objectContaining({ statenvId: 4, descr: "fiche" }));
    expect(written).not.toHaveProperty("typenvid");
    expect(refresh).toHaveBeenCalledWith("/list/envs");
    expect(refresh).toHaveBeenCalledWith("/list/envs/DEV01");
  });

  it("laisse la famille à 10 si elle a changé avant un formulaire sans typenvid", async () => {
    let family = 3;
    directLookup.mockImplementation(async () => {
      const seen = family;
      family = 10;
      return { typenvid: seen, statenvId: 4 };
    });
    directUpdate.mockImplementation(async ({ data }: { data: { typenvid?: number } }) => {
      if (Object.prototype.hasOwnProperty.call(data, "typenvid")) {
        family = data.typenvid as number;
      }
      return { id: 1 };
    });

    await expect(updateEnv("DEV01", form({ descr: "fiche" }))).resolves.toMatchObject({
      success: true,
    });

    expect(family).toBe(10);
    expect(directUpdate.mock.calls[0][0].data).not.toHaveProperty("typenvid");
    expect(transaction).not.toHaveBeenCalled();
  });

  it("traite un typenvid vide comme un champ absent", async () => {
    directLookup.mockResolvedValue({ typenvid: 3, statenvId: 4 });

    await expect(updateEnv("DEV01", form({ typenvid: "", descr: "fiche" }))).resolves.toMatchObject({
      success: true,
    });

    expect(transaction).not.toHaveBeenCalled();
    expect(directUpdate.mock.calls[0][0].data).not.toHaveProperty("typenvid");
  });

  it("ne verrouille pas une famille explicitement inchangée", async () => {
    directLookup.mockResolvedValue({ typenvid: 10, statenvId: 4 });

    await expect(updateEnv("DEV01", form({ typenvid: "10", descr: "fiche" }))).resolves.toMatchObject({
      success: true,
    });

    expect(transaction).not.toHaveBeenCalled();
    expect(directUpdate).not.toHaveBeenCalled();
    expect(directUpdateMany).toHaveBeenCalledWith({
      where: { env: "DEV01", typenvid: 10 },
      data: expect.objectContaining({ typenvid: 10, descr: "fiche" }),
    });
  });

  it("verrouille la famille d'arrivée et relit avant l'écriture", async () => {
    directLookup.mockResolvedValue({ typenvid: 3, statenvId: 8 });
    const tx = createTx({ typenvid: 3, statenvId: 9 });
    useTransaction(tx);

    await expect(updateEnv("DEV01", form({ typenvid: "10" }))).resolves.toMatchObject({
      success: true,
    });

    expect(directUpdate).not.toHaveBeenCalled();
    expect(directUpdateMany).not.toHaveBeenCalled();
    expect(transaction.mock.calls[0][1]).toEqual({ maxWait: 2000, timeout: 15000 });
    expect(sqlText(tx.$executeRaw.mock.calls[0][0])).toContain("harpdisplaylock");
    expect(tx.envsharp.findUnique).toHaveBeenCalledWith({ where: { env: "DEV01" } });
    expect(tx.envsharp.update).toHaveBeenCalledWith({
      where: { env: "DEV01" },
      data: expect.objectContaining({ typenvid: 10, statenvId: 9 }),
    });
  });

  it("reprend le verrou si la famille a changé après la lecture initiale", async () => {
    directLookup.mockResolvedValue({ typenvid: 10, statenvId: 4 });
    directUpdateMany.mockResolvedValue({ count: 0 });
    const tx = createTx({ typenvid: 4, statenvId: 4 });
    useTransaction(tx);

    await expect(updateEnv("DEV01", form({ typenvid: "10" }))).resolves.toMatchObject({
      success: true,
    });

    expect(directUpdateMany).toHaveBeenCalled();
    expect(tx.envsharp.update).toHaveBeenCalledWith({
      where: { env: "DEV01" },
      data: expect.objectContaining({ typenvid: 10 }),
    });
  });

  it("n'écrit pas si l'environnement disparaît avant l'écriture verrouillée", async () => {
    directLookup.mockResolvedValue({ typenvid: 3, statenvId: 4 });
    const tx = createTx(null);
    useTransaction(tx);

    await expect(updateEnv("DEV01", form({ typenvid: "10" }))).resolves.toEqual({
      success: false,
      error: "Environnement non trouvé",
    });

    expect(tx.envsharp.update).not.toHaveBeenCalled();
  });

  it("écrit 0, une valeur hors plage ou NaN sans verrou", async () => {
    for (const [typenvid, written] of [
      ["0", 0],
      ["32768", 32768],
      ["abc", Number.NaN],
    ] as const) {
      jest.clearAllMocks();
      adminGuard.mockResolvedValue({ ok: true });
      directLookup.mockResolvedValue({ typenvid: 3, statenvId: 4 });
      directUpdate.mockResolvedValue({ id: 1 });

      await expect(updateEnv("DEV01", form({ typenvid }))).resolves.toMatchObject({
        success: true,
      });

      expect(transaction).not.toHaveBeenCalled();
      expect(directUpdate).toHaveBeenCalledWith({
        where: { env: "DEV01" },
        data: expect.objectContaining({ typenvid: written }),
      });
    }
  });

  it("conserve parseInt et verrouille l'entier obtenu", async () => {
    directLookup.mockResolvedValue({ typenvid: 3, statenvId: 4 });
    const tx = createTx({ typenvid: 3, statenvId: 4 });
    useTransaction(tx);

    await expect(updateEnv("DEV01", form({ typenvid: "10abc" }))).resolves.toMatchObject({
      success: true,
    });

    expect(tx.envsharp.update).toHaveBeenCalledWith({
      where: { env: "DEV01" },
      data: expect.objectContaining({ typenvid: 10 }),
    });
  });

  it("renvoie le message du verrou", async () => {
    directLookup.mockResolvedValue({ typenvid: 3, statenvId: 4 });
    transaction.mockRejectedValue(
      new HarpDisplayLockError("Le verrou de la famille 10 n'a pas été obtenu dans le délai", 10),
    );

    await expect(updateEnv("DEV01", form({ typenvid: "10" }))).resolves.toEqual({
      success: false,
      error: "Le verrou de la famille 10 n'a pas été obtenu dans le délai",
    });
    expect(directUpdate).not.toHaveBeenCalled();
  });
});
