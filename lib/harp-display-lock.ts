import { Prisma, type Prisma as PrismaTypes } from "@prisma/client";
import prisma from "@/lib/prisma";

/** Nombre maximal de reprises après un interblocage. */
const MAX_DEADLOCK_RETRIES = 2;

/** Délai accordé au callback, verrou compris, en millisecondes. */
const TRANSACTION_TIMEOUT_MS = 15_000;

/**
 * Client de la transaction qui détient le verrou de ligne.
 * Les contrôles et les écritures protégés doivent utiliser ce client.
 */
export type HarpDisplayLockClient = PrismaTypes.TransactionClient;

/**
 * Échec d'acquisition du verrou transactionnel d'un typenvid.
 * Une erreur métier du callback n'est pas convertie en cette erreur.
 */
export class HarpDisplayLockError extends Error {
  readonly typenvid: number;

  /**
   * @param message - Message destiné à l'appelant
   * @param typenvid - Identifiant métier du verrou
   * @param cause - Erreur Prisma ou MySQL d'origine
   */
  constructor(message: string, typenvid: number, cause?: unknown) {
    super(message, cause === undefined ? undefined : { cause });
    this.name = "HarpDisplayLockError";
    this.typenvid = typenvid;
  }
}

/**
 * Exécute un travail pendant que la ligne harpdisplaylock du typenvid est verrouillée.
 * L'insertion InnoDB tient le verrou jusqu'au COMMIT ou au ROLLBACK de Prisma.
 * Aucun GET_LOCK n'est utilisé.
 *
 * @param typenvid - Identifiant métier positif
 * @param work - Contrôles et écritures, obligatoirement via tx
 * @returns Le résultat de work
 * @throws {HarpDisplayLockError} Si l'identifiant est illisible, si l'attente InnoDB expire, ou si le délai Prisma de la transaction est dépassé
 */
export async function withHarpDisplayLock<T>(
  typenvid: number,
  work: (tx: HarpDisplayLockClient) => Promise<T>,
): Promise<T> {
  assertTypenvId(typenvid);

  let attempt = 0;
  for (;;) {
    try {
      return await prisma.$transaction(
        async (tx) => {
          await tx.$executeRaw(Prisma.sql`
            INSERT INTO \`harpdisplaylock\` (\`typenvid\`)
            VALUES (${typenvid})
            ON DUPLICATE KEY UPDATE \`typenvid\` = VALUES(\`typenvid\`)
          `);
          return work(tx);
        },
        {
          maxWait: 2_000,
          timeout: TRANSACTION_TIMEOUT_MS,
        },
      );
    } catch (error) {
      if (isDeadlock(error) && attempt < MAX_DEADLOCK_RETRIES) {
        attempt += 1;
        continue;
      }
      if (isLockWaitTimeout(error) || isTransactionDeadline(error)) {
        throw new HarpDisplayLockError(
          `Le verrou de la famille ${typenvid} n'a pas été obtenu dans le délai`,
          typenvid,
          error,
        );
      }
      throw error;
    }
  }
}

/**
 * Refuse un identifiant qui ne peut pas servir de clé primaire.
 *
 * @param typenvid - Valeur reçue par l'appelant
 */
function assertTypenvId(typenvid: number): void {
  if (!Number.isSafeInteger(typenvid) || typenvid <= 0) {
    throw new HarpDisplayLockError("L'identifiant de famille du verrou est invalide", typenvid);
  }
}

/**
 * Reconnaît un interblocage MariaDB, transaction déjà annulée.
 * L'attente de verrou n'est pas un interblocage.
 *
 * @param error - Erreur levée par Prisma
 * @returns true seulement pour l'erreur 1213
 */
function isDeadlock(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034") {
    return true;
  }
  return mysqlErrorCode(error) === 1213;
}

/**
 * Reconnaît une attente de verrou InnoDB dépassée.
 *
 * @param error - Erreur levée par Prisma
 * @returns true pour l'erreur 1205
 */
function isLockWaitTimeout(error: unknown): boolean {
  return mysqlErrorCode(error) === 1205;
}

/**
 * Reconnaît un P2028 dû au délai Prisma, pas une transaction simplement introuvable ou déjà close.
 * Le texte d'origine reste accessible via la cause de HarpDisplayLockError.
 *
 * @param error - Erreur levée par Prisma
 * @returns true pour l'attente maxWait ou l'expiration du timeout interactif
 */
function isTransactionDeadline(error: unknown): boolean {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2028") {
    return false;
  }
  return (
    error.message.includes("expired transaction") ||
    error.message.includes("Unable to start a transaction in the given time")
  );
}

/**
 * Extrait le code MySQL transporté par Prisma.
 *
 * @param error - Erreur inconnue
 * @returns Code numérique, ou null
 */
function mysqlErrorCode(error: unknown): number | null {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) {
    return null;
  }
  const meta = error.meta;
  if (meta && typeof meta === "object" && "code" in meta) {
    const code = Number(meta.code);
    if (Number.isInteger(code)) {
      return code;
    }
  }
  const match = error.message.match(/\b(1213|1205)\b/);
  return match ? Number(match[1]) : null;
}
