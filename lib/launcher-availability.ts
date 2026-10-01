import { readLauncherAvailability } from "@/lib/launcher-tool";
import { verifyAvailabilityToken } from "@/lib/launcher-token";

export type AvailabilityCheckResult = {
  status: number;
  body: Record<string, unknown>;
};

export type AvailabilityCheckQuery = {
  token: string | null;
  tool: string | null;
  secret?: string;
  nowMs?: number;
  ip?: string | null;
  host?: string | null;
  aliasql?: string | null;
  ptversion?: string | null;
  queryNetid?: string | null;
};

function refuse(status: 401 | 403 | 500, error: string): AvailabilityCheckResult {
  return { status, body: { error } };
}

/**
 * Répond à la disponibilité d'un outil configuré.
 * Les champs de cible de la query sont ignorés. Ce chemin ne construit pas de commande.
 *
 * @param input - Jeton de disponibilité et outil annoncé
 */
export async function executeAvailabilityRequest(
  input: AvailabilityCheckQuery
): Promise<AvailabilityCheckResult> {
  void input.ip;
  void input.host;
  void input.aliasql;
  void input.ptversion;
  void input.queryNetid;

  const token = input.token?.trim() ?? "";
  if (!token) {
    return refuse(401, "Jeton absent");
  }
  if (!input.secret) {
    return refuse(500, "Configuration d'authentification indisponible");
  }

  const verified = verifyAvailabilityToken(token, input.secret, input.nowMs);
  if (!verified.ok) {
    if (verified.reason === "expired") {
      return refuse(401, "Jeton expiré");
    }
    if (verified.reason === "unknown_version") {
      return refuse(401, "Version de jeton inconnue");
    }
    return refuse(401, "Jeton invalide");
  }

  const announced = input.tool?.trim() ?? "";
  if (announced !== verified.tool) {
    return refuse(403, "Outil non autorisé par le jeton");
  }

  return readLauncherAvailability({ tool: verified.tool, netid: verified.netid });
}
