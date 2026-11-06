/**
 * @jest-environment node
 */
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { HarpDisplayLockError, withHarpDisplayLock } from "@/lib/harp-display-lock";

jest.mock("@/lib/prisma", () => ({
  __esModule: true,
  default: {
    $transaction: jest.fn(),
  },
}));

const transaction = prisma.$transaction as jest.Mock;

function prismaError(message: string, code: string) {
  return new Prisma.PrismaClientKnownRequestError(message, {
    code,
    clientVersion: "test",
  });
}

describe("délai Prisma du verrou de display", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("convertit l'expiration de la transaction en message de délai", async () => {
    const cause = prismaError(
      "Transaction API error: A commit cannot be executed on an expired transaction. The timeout for this transaction was 15000 ms, however 15020 ms passed since the start of the transaction. Consider increasing the interactive transaction timeout or doing less work in the transaction.",
      "P2028",
    );
    transaction.mockRejectedValue(cause);

    await expect(withHarpDisplayLock(10, async () => "ok")).rejects.toMatchObject({
      name: "HarpDisplayLockError",
      typenvid: 10,
      message: "Le verrou de la famille 10 n'a pas été obtenu dans le délai",
      cause,
    });
  });

  it("convertit l'impossibilité de démarrer la transaction dans le délai", async () => {
    const cause = prismaError(
      "Transaction API error: Unable to start a transaction in the given time.",
      "P2028",
    );
    transaction.mockRejectedValue(cause);

    await expect(withHarpDisplayLock(7, async () => "ok")).rejects.toEqual(
      expect.any(HarpDisplayLockError),
    );
    await expect(withHarpDisplayLock(7, async () => "ok")).rejects.toMatchObject({
      message: "Le verrou de la famille 7 n'a pas été obtenu dans le délai",
      cause,
    });
  });

  it("laisse intact un P2028 de transaction introuvable", async () => {
    const cause = prismaError(
      "Transaction API error: Transaction not found. Transaction ID is invalid, refers to an old closed transaction Prisma doesn't have information about anymore, or was obtained before disconnecting.",
      "P2028",
    );
    transaction.mockRejectedValue(cause);

    await expect(withHarpDisplayLock(10, async () => "ok")).rejects.toBe(cause);
  });

  it("laisse intact un P2028 de transaction déjà validée ou annulée", async () => {
    const committed = prismaError(
      "Transaction API error: Transaction already closed: A commit cannot be executed on a committed transaction.",
      "P2028",
    );
    const rolledBack = prismaError(
      "Transaction API error: Transaction already closed: A query cannot be executed on a transaction that was rolled back.",
      "P2028",
    );
    transaction.mockRejectedValueOnce(committed).mockRejectedValueOnce(rolledBack);

    await expect(withHarpDisplayLock(10, async () => "ok")).rejects.toBe(committed);
    await expect(withHarpDisplayLock(10, async () => "ok")).rejects.toBe(rolledBack);
  });
});
