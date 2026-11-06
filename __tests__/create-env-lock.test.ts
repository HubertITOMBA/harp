/**
 * @jest-environment node
 */
import { requirePortalAdmin } from "@/lib/require-portal-admin";
import prisma from "@/lib/prisma";
import { db } from "@/lib/db";
import { HarpDisplayLockError } from "@/lib/harp-display-lock";
import { createEnv } from "@/actions/create-env";
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
      create: jest.fn(),
    },
  },
}));

const adminGuard = requirePortalAdmin as jest.MockedFunction<typeof requirePortalAdmin>;
const transaction = prisma.$transaction as jest.Mock;
const directLookup = db.envsharp.findUnique as jest.Mock;
const directCreate = db.envsharp.create as jest.Mock;
const refresh = revalidatePath as jest.Mock;

type EnvTx = {
  $executeRaw: jest.Mock;
  envsharp: {
    findUnique: jest.Mock;
    create: jest.Mock;
  };
};

function sqlText(query: unknown): string {
  if (query && typeof query === "object" && "strings" in query) {
    return (query as { strings: readonly string[] }).strings.join("?");
  }
  return "";
}

function createTx(): EnvTx {
  return {
    $executeRaw: jest.fn(async () => 1),
    envsharp: {
      findUnique: jest.fn(async () => null),
      create: jest.fn(async () => ({ id: 1 })),
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

describe("createEnv et le verrou de display", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    adminGuard.mockResolvedValue({ ok: true });
  });

  it("refuse sans administration et sans écriture", async () => {
    adminGuard.mockResolvedValue({ ok: false, error: "Accès refusé" });

    await expect(createEnv(form({ env: "DEV01", typenvid: "10" }))).resolves.toEqual({
      success: false,
      error: "Accès refusé",
    });

    expect(transaction).not.toHaveBeenCalled();
    expect(directCreate).not.toHaveBeenCalled();
    expect(refresh).not.toHaveBeenCalled();
  });

  it("crée sans verrou quand typenvid est absent", async () => {
    directLookup.mockResolvedValue(null);

    await expect(createEnv(form({ env: "DEV01" }))).resolves.toEqual({
      success: true,
      message: "L'environnement DEV01 a été créé avec succès",
    });

    expect(transaction).not.toHaveBeenCalled();
    expect(directLookup).toHaveBeenCalledWith({ where: { env: "DEV01" } });
    expect(directCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({ env: "DEV01", typenvid: null, statenvId: 4 }),
    });
    expect(refresh).toHaveBeenCalledWith("/list/envs");
  });

  it("verrouille le typenvid puis contrôle et insère avec le même tx", async () => {
    const tx = createTx();
    useTransaction(tx);

    await expect(createEnv(form({ env: "DEV01", typenvid: "10" }))).resolves.toMatchObject({
      success: true,
    });

    expect(transaction).toHaveBeenCalledTimes(1);
    expect(transaction.mock.calls[0][1]).toEqual({ maxWait: 2000, timeout: 15000 });
    expect(sqlText(tx.$executeRaw.mock.calls[0][0])).toContain("harpdisplaylock");
    expect(tx.envsharp.findUnique).toHaveBeenCalledWith({ where: { env: "DEV01" } });
    expect(tx.envsharp.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ typenvid: 10, statenvId: 4 }),
    });
    expect(directLookup).not.toHaveBeenCalled();
    expect(directCreate).not.toHaveBeenCalled();
  });

  it("prend le verrou aux bornes 1 et 32767", async () => {
    for (const typenvid of ["1", "32767"]) {
      const tx = createTx();
      useTransaction(tx);

      await expect(createEnv(form({ env: "DEV01", typenvid }))).resolves.toMatchObject({
        success: true,
      });
      expect(tx.envsharp.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ typenvid: Number(typenvid) }),
      });
      expect(sqlText(tx.$executeRaw.mock.calls[0][0])).toContain("harpdisplaylock");
    }
  });

  it("n'appelle pas le verrou pour 0, un négatif, une valeur trop grande ou NaN", async () => {
    directLookup.mockResolvedValue(null);

    for (const [typenvid, written] of [
      ["0", 0],
      ["-3", -3],
      ["32768", 32768],
      ["abc", Number.NaN],
    ] as const) {
      jest.clearAllMocks();
      adminGuard.mockResolvedValue({ ok: true });
      directLookup.mockResolvedValue(null);

      await expect(createEnv(form({ env: "DEV01", typenvid }))).resolves.toMatchObject({
        success: true,
      });

      expect(transaction).not.toHaveBeenCalled();
      expect(directCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({ typenvid: written }),
      });
    }
  });

  it("conserve parseInt pour une chaîne numérique tronquée et verrouille le résultat", async () => {
    const tx = createTx();
    useTransaction(tx);

    await expect(createEnv(form({ env: "DEV01", typenvid: "10abc" }))).resolves.toMatchObject({
      success: true,
    });

    expect(transaction.mock.calls[0][1]).toEqual({ maxWait: 2000, timeout: 15000 });
    expect(tx.envsharp.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ typenvid: 10 }),
    });
  });

  it("refuse un nom déjà utilisé sous le verrou, sans insertion", async () => {
    const tx = createTx();
    tx.envsharp.findUnique.mockResolvedValue({ id: 4 });
    useTransaction(tx);

    await expect(createEnv(form({ env: "DEV01", typenvid: "10" }))).resolves.toEqual({
      success: false,
      error: "Un environnement avec ce nom existe déjà",
    });

    expect(tx.envsharp.create).not.toHaveBeenCalled();
    expect(refresh).toHaveBeenCalledWith("/list/envs");
  });

  it("renvoie le message du verrou", async () => {
    transaction.mockRejectedValue(
      new HarpDisplayLockError("Le verrou de la famille 10 n'a pas été obtenu dans le délai", 10),
    );

    await expect(createEnv(form({ env: "DEV01", typenvid: "10" }))).resolves.toEqual({
      success: false,
      error: "Le verrou de la famille 10 n'a pas été obtenu dans le délai",
    });
    expect(directCreate).not.toHaveBeenCalled();
  });
});
