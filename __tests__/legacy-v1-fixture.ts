import { createHmac } from "crypto";
import { LAUNCHER_TOKEN_TTL_SECONDS } from "@/lib/launcher-token";

/**
 * Construit un ancien jeton v1 pour les tests de refus.
 * Ce helper n'est pas un émetteur de production.
 *
 * @param input - Identité et outil du jeton historique
 * @param secret - Secret HMAC de test
 * @param nowMs - Instant utilisé pour l'expiration
 */
export function signLegacyV1Fixture(
  input: { netid: string; tool: string },
  secret: string,
  nowMs: number = Date.now()
): string {
  const payload = {
    v: 1,
    netid: input.netid,
    tool: input.tool,
    exp: Math.floor(nowMs / 1000) + LAUNCHER_TOKEN_TTL_SECONDS,
  };
  const body = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const signature = createHmac("sha256", secret).update(body).digest("base64url");
  return `${body}.${signature}`;
}
