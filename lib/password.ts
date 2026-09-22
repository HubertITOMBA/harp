import { createHash, timingSafeEqual } from "crypto";
import bcrypt from "bcryptjs";
import { LoginSchema } from "@/schemas";

const BCRYPT_PREFIX = /^\$2[aby]\$/;
const MYSQL_PASSWORD_LEGACY = /^\*[0-9A-Fa-f]{40}$/;

/**
 * Hash compatible MySQL PASSWORD() 4.1+ :
 * SHA1(password) binaire → SHA1(digest) → '*' + hex majuscule (41 caractères).
 *
 * @param plainPassword - Mot de passe en clair (UTF-8)
 * @returns Chaîne `*` + 40 hex majuscules
 */
export function mysqlPasswordHash(plainPassword: string): string {
  const stage1 = createHash("sha1").update(plainPassword, "utf8").digest();
  const stage2 = createHash("sha1").update(stage1).digest("hex").toUpperCase();
  return `*${stage2}`;
}

/**
 * Comparaison en temps constant de deux chaînes (après encodage UTF-8).
 * Retourne false si les longueurs diffèrent (sans fuite via timingSafeEqual).
 */
function timingSafeEqualString(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) {
    return false;
  }
  return timingSafeEqual(bufA, bufB);
}

/**
 * Vérifie un mot de passe fourni contre la valeur stockée.
 * Formats supportés : bcrypt ($2a$/$2b$/$2y$), legacy MySQL PASSWORD() (*+40 hex).
 * Pas de fallback plaintext. Ne loggue jamais plain ni stored.
 *
 * @param plainPassword - Mot de passe saisi
 * @param storedPassword - Valeur en base (User.password)
 * @returns true uniquement si la vérification réussit
 */
export async function verifyPassword(
  plainPassword: string | null | undefined,
  storedPassword: string | null | undefined
): Promise<boolean> {
  if (plainPassword === null || plainPassword === undefined) {
    return false;
  }
  if (storedPassword === null || storedPassword === undefined) {
    return false;
  }

  const plain = String(plainPassword);
  const stored = String(storedPassword);

  if (plain.length === 0 || stored.length === 0) {
    return false;
  }

  if (stored.startsWith("DISABLED_")) {
    return false;
  }

  if (BCRYPT_PREFIX.test(stored)) {
    return bcrypt.compare(plain, stored);
  }

  if (MYSQL_PASSWORD_LEGACY.test(stored)) {
    const computed = mysqlPasswordHash(plain);
    return timingSafeEqualString(computed.toUpperCase(), stored.toUpperCase());
  }

  return false;
}

export type CredentialsUser = {
  id?: number | string;
  netid?: string | null;
  password: string | null;
  [key: string]: unknown;
};

type FindUserByNetId = (netid: string) => Promise<CredentialsUser | null>;

/**
 * Logique d'autorisation Credentials (netid + password) utilisable par Auth.js et les tests.
 * Aucun return user si verifyPassword échoue.
 *
 * @param credentials - Objet credentials brut (netid, password)
 * @param findUserByNetId - Résolveur utilisateur (injectable pour les tests)
 * @returns L'utilisateur si authentifié, sinon null
 */
export async function authorizeCredentials(
  credentials: unknown,
  findUserByNetId: FindUserByNetId
): Promise<CredentialsUser | null> {
  const validatedFields = LoginSchema.safeParse(credentials);
  if (!validatedFields.success) {
    return null;
  }

  const { netid, password } = validatedFields.data;
  const user = await findUserByNetId(netid);

  if (!user || !user.password) {
    return null;
  }

  const ok = await verifyPassword(password, user.password);
  if (!ok) {
    return null;
  }

  return user;
}
