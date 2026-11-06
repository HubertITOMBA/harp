/**
 * @jest-environment node
 */
import { Prisma } from "@prisma/client";
import { requirePortalAdmin } from "@/lib/require-portal-admin";
import prisma from "@/lib/prisma";
import { HarpDisplayLockError } from "@/lib/harp-display-lock";
import { createFamily } from "@/actions/family-admin";
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
    harptypenv: { findMany: jest.fn() },
    harpmenus: { findMany: jest.fn() },
    psadm_typenv: { findMany: jest.fn() },
    $transaction: jest.fn(),
  },
}));

const adminGuard = requirePortalAdmin as jest.MockedFunction<typeof requirePortalAdmin>;
const families = prisma.harptypenv.findMany as jest.Mock;
const menus = prisma.harpmenus.findMany as jest.Mock;
const legacy = prisma.psadm_typenv.findMany as jest.Mock;
const transaction = prisma.$transaction as jest.Mock;
const refresh = revalidatePath as jest.Mock;

type CreateTx = {
  $executeRaw: jest.Mock;
  harptypenv: { findFirst: jest.Mock; create: jest.Mock };
  harpmenus: { findMany: jest.Mock };
  psadm_typenv: { findMany: jest.Mock };
};

function form(name: string, descr?: string, typenvid?: string) {
  const data = new FormData();
  data.set("typenv", name);
  if (descr !== undefined) {
    data.set("descr", descr);
  }
  if (typenvid !== undefined) {
    data.set("typenvid", typenvid);
  }
  return data;
}

function createTx(options?: {
  sameId?: boolean;
  sameName?: boolean;
  menus?: string[];
  legacy?: string[];
  create?: jest.Mock;
}): CreateTx {
  return {
    $executeRaw: jest.fn(async () => 1),
    harptypenv: {
      findFirst: jest.fn(async ({ where }: { where: { typenvid?: number; typenv?: string } }) => {
        if (where.typenvid != null && options?.sameId) {
          return { typenv: "PRISE" };
        }
        if (where.typenv != null && options?.sameName) {
          return { typenvid: 8 };
        }
        return null;
      }),
      create: options?.create ?? jest.fn(async () => ({ id: 1 })),
    },
    harpmenus: {
      findMany: jest.fn(async () => (options?.menus ?? []).map((menu) => ({ menu }))),
    },
    psadm_typenv: {
      findMany: jest.fn(async () => (options?.legacy ?? []).map((typenv) => ({ typenv }))),
    },
  };
}

function lockValue(query: unknown): number | null {
  if (query && typeof query === "object" && "values" in query) {
    const value = (query as { values: unknown[] }).values.find((item) => typeof item === "number");
    return typeof value === "number" ? value : null;
  }
  return null;
}

function useTransactions(txs: CreateTx[]) {
  const locked: number[] = [];
  transaction.mockImplementation(async (work: (client: CreateTx) => Promise<unknown>, options: unknown) => {
    const tx = txs.shift() ?? createTx();
    tx.$executeRaw.mockImplementation(async (query: unknown) => {
      const value = lockValue(query);
      if (value != null) {
        locked.push(value);
      }
      return 1;
    });
    expect(options).toEqual({ maxWait: 2000, timeout: 15000 });
    return work(tx);
  });
  return locked;
}

function occupy(ids: number[]) {
  families.mockResolvedValue(ids.map((typenvid) => ({ typenvid })));
  menus.mockResolvedValue([]);
  legacy.mockResolvedValue([]);
}

describe("création de famille avec identifiant automatique", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    adminGuard.mockResolvedValue({ ok: true });
    occupy([]);
  });

  it("attribue le plus petit identifiant libre et ignore celui du formulaire", async () => {
    const tx = createTx();
    const locked = useTransactions([tx]);

    const result = await createFamily(form("NOUVELLE", "Texte", "99"));

    expect(result).toEqual({ success: true, message: "La famille NOUVELLE a été créée" });
    expect(result.message).not.toMatch(/\d/);
    expect(locked).toEqual([1]);
    expect(tx.harptypenv.create).toHaveBeenCalledWith({
      data: { typenvid: 1, typenv: "NOUVELLE", descr: "Texte", href: null },
    });
    expect(refresh).toHaveBeenCalledWith("/list/families");
    expect(families).toHaveBeenCalledWith({
      where: { typenvid: { gte: 1, lte: 32767 } },
      select: { typenvid: true },
    });
    expect(menus).toHaveBeenCalledWith({
      where: { level: 3, display: { gte: 1, lte: 32767 } },
      select: { display: true },
    });
    expect(legacy).toHaveBeenCalledWith({
      where: { display: { gte: 1, lte: 32767 } },
      select: { display: true },
    });
  });

  it("saute les identifiants occupés par une famille, un menu de niveau 3 ou psadm_typenv", async () => {
    families.mockResolvedValue([{ typenvid: 1 }, { typenvid: 4 }]);
    menus.mockResolvedValue([{ display: 2 }]);
    legacy.mockResolvedValue([{ display: 3 }]);
    const tx = createTx();
    const locked = useTransactions([tx]);

    const result = await createFamily(form("NOUVELLE"));

    expect(result.success).toBe(true);
    expect(locked).toEqual([5]);
    expect(tx.harptypenv.create).toHaveBeenCalledWith({
      data: { typenvid: 5, typenv: "NOUVELLE", descr: null, href: null },
    });
  });

  it("reprend l'identifiant suivant quand une création simultanée prend le candidat", async () => {
    families
      .mockResolvedValueOnce([{ typenvid: 1 }])
      .mockResolvedValueOnce([{ typenvid: 1 }, { typenvid: 2 }]);
    const first = createTx({ sameId: true });
    const second = createTx();
    const locked = useTransactions([first, second]);

    const result = await createFamily(form("NOUVELLE"));

    expect(result).toEqual({ success: true, message: "La famille NOUVELLE a été créée" });
    expect(locked).toEqual([2, 3]);
    expect(first.harptypenv.create).not.toHaveBeenCalled();
    expect(second.harptypenv.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ typenvid: 3 }) }),
    );
  });

  it("s'arrête sur un nom déjà utilisé, même si l'identifiant est libre", async () => {
    const tx = createTx({ sameName: true, sameId: true });
    useTransactions([tx]);

    const result = await createFamily(form("DEJA"));

    expect(result).toEqual({
      success: false,
      error: "Le nom DEJA est déjà utilisé par une famille",
    });
    expect(transaction).toHaveBeenCalledTimes(1);
    expect(tx.harptypenv.create).not.toHaveBeenCalled();
    expect(refresh).not.toHaveBeenCalled();
  });

  it("refuse sans verrou lorsque toute la plage est occupée", async () => {
    occupy(Array.from({ length: 32767 }, (_, index) => index + 1));

    const result = await createFamily(form("NOUVELLE"));

    expect(result).toEqual({
      success: false,
      error: "Aucun identifiant de famille n'est disponible entre 1 et 32767.",
    });
    expect(transaction).not.toHaveBeenCalled();
  });

  it("s'arrête après trois identifiants pris simultanément", async () => {
    const locked = useTransactions([
      createTx({ sameId: true }),
      createTx({ sameId: true }),
      createTx({ sameId: true }),
    ]);

    const result = await createFamily(form("NOUVELLE"));

    expect(result).toEqual({
      success: false,
      error: "Les identifiants libres ont été pris par des créations simultanées. Réessayez.",
    });
    expect(locked).toEqual([1, 1, 1]);
    expect(transaction).toHaveBeenCalledTimes(3);
  });

  it("traite une unicité de nom sans nouvelle tentative", async () => {
    const create = jest.fn(async () => {
      throw new Prisma.PrismaClientKnownRequestError("Unique", {
        code: "P2002",
        clientVersion: "test",
        meta: { target: "harptypenv_typenv_key" },
      });
    });
    useTransactions([createTx({ create })]);

    const result = await createFamily(form("DEJA"));

    expect(result).toEqual({
      success: false,
      error: "Le nom DEJA est déjà utilisé par une famille",
    });
    expect(transaction).toHaveBeenCalledTimes(1);
  });

  it("reprend après une unicité d'identifiant puis confirme sans numéro", async () => {
    const rejected = jest.fn(async () => {
      throw new Prisma.PrismaClientKnownRequestError("Unique", {
        code: "P2002",
        clientVersion: "test",
        meta: { target: ["typenvid"] },
      });
    });
    const created = jest.fn(async () => ({ id: 2 }));
    const locked = useTransactions([
      createTx({ create: rejected }),
      createTx({ create: created }),
    ]);

    const result = await createFamily(form("NOUVELLE"));

    expect(result).toEqual({ success: true, message: "La famille NOUVELLE a été créée" });
    expect(locked).toEqual([1, 1]);
    expect(created).toHaveBeenCalledTimes(1);
  });

  it("rend le message du verrou sans chercher un autre identifiant", async () => {
    transaction.mockRejectedValue(
      new HarpDisplayLockError("Le verrou de la famille 1 n'a pas été obtenu dans le délai", 1),
    );

    const result = await createFamily(form("NOUVELLE"));

    expect(result).toEqual({
      success: false,
      error: "Le verrou de la famille 1 n'a pas été obtenu dans le délai",
    });
    expect(transaction).toHaveBeenCalledTimes(1);
  });
});
