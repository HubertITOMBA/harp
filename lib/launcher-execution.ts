import { readAdminServerPutty, readFreeSshPutty, readLocalTool, readTargetBoundLauncherTool } from "@/lib/launcher-tool";
import {
  classifyLauncherToken,
  verifyAdminServerLauncherToken,
  verifyFreeSshLauncherToken,
  verifyLocalToolLauncherToken,
  verifyTargetBoundLauncherToken,
  type TargetBoundPayload,
} from "@/lib/launcher-token";

export type LauncherExecutionResult = {
  status: number;
  body: Record<string, unknown>;
};

export type LauncherExecutionQuery = {
  token: string | null;
  tool: string | null;
  queryNetid?: string | null;
  ptversion?: string | null;
  aliasql?: string | null;
  ip?: string | null;
  host?: string | null;
  user?: string | null;
  sshkey?: string | null;
  pkeyfile?: string | null;
  path?: string | null;
  exe?: string | null;
  command?: string | null;
  pshome?: string | null;
  envId?: string | null;
  secret?: string;
  nowMs?: number;
};

function refuse(status: 401 | 403 | 500, error: string): LauncherExecutionResult {
  return { status, body: { error } };
}

/**
 * Exécute uniquement un jeton v2. Un jeton v1 est refusé, sans repli.
 * Les champs de cible de la query ne sont pas lus.
 *
 * @param input - Jeton et outil annoncé. Le secret est AUTH_SECRET.
 */
export async function executeTargetBoundLauncherRequest(
  input: LauncherExecutionQuery
): Promise<LauncherExecutionResult> {
  const token = input.token?.trim() ?? "";
  if (!token) {
    return refuse(401, "Jeton absent");
  }
  if (!input.secret) {
    return refuse(500, "Configuration d'authentification indisponible");
  }

  const verified = verifyTargetBoundLauncherToken(token, input.secret, input.nowMs);
  if (!verified.ok) {
    if (verified.reason === "legacy") {
      return refuse(403, "Jeton legacy refusé");
    }
    if (verified.reason === "expired") {
      return refuse(401, "Jeton expiré");
    }
    if (verified.reason === "unknown_version") {
      return refuse(401, "Version de jeton inconnue");
    }
    if (verified.reason === "availability") {
      return refuse(403, "Jeton de disponibilité refusé");
    }
    if (verified.reason === "admin-server") {
      return refuse(403, "Jeton d'administration refusé");
    }
    if (verified.reason === "free-ssh") {
      return refuse(403, "Jeton SSH libre refusé");
    }
    if (verified.reason === "local-tool") {
      return refuse(403, "Jeton d'outil local refusé");
    }
    return refuse(401, "Jeton invalide");
  }

  const announced = input.tool?.trim() ?? "";
  if (announced !== verified.payload.tool) {
    return refuse(403, "Outil non autorisé par le jeton");
  }

  return readTargetBoundLauncherTool(verified.payload);
}

/**
 * Exécute uniquement un jeton PuTTY d'administration.
 * Un jeton v2 d'environnement est refusé. IP, hôte, compte et clé de query sont ignorés.
 *
 * @param input - Jeton v4 et outil annoncé
 */
export async function executeAdminServerLauncherRequest(
  input: LauncherExecutionQuery
): Promise<LauncherExecutionResult> {
  void input.ip;
  void input.host;
  void input.user;
  void input.sshkey;
  void input.pkeyfile;
  void input.queryNetid;
  void input.aliasql;
  void input.ptversion;

  const token = input.token?.trim() ?? "";
  if (!token) {
    return refuse(401, "Jeton absent");
  }
  if (!input.secret) {
    return refuse(500, "Configuration d'authentification indisponible");
  }

  const verified = verifyAdminServerLauncherToken(token, input.secret, input.nowMs);
  if (!verified.ok) {
    if (verified.reason === "expired") {
      return refuse(401, "Jeton expiré");
    }
    if (verified.reason === "unknown_version") {
      return refuse(401, "Version de jeton inconnue");
    }
    if (verified.reason === "target-bound") {
      return refuse(403, "Jeton environnement refusé");
    }
    if (verified.reason === "free-ssh") {
      return refuse(403, "Jeton SSH libre refusé");
    }
    if (verified.reason === "local-tool") {
      return refuse(403, "Jeton d'outil local refusé");
    }
    return refuse(401, "Jeton invalide");
  }

  const announced = input.tool?.trim() ?? "";
  if (announced !== verified.payload.tool) {
    return refuse(403, "Outil non autorisé par le jeton");
  }

  return readAdminServerPutty(verified.payload);
}

/**
 * Exécute uniquement un jeton PuTTY SSH libre.
 * L'hôte signé n'est pas remplaçable par la query. Le compte et la clé viennent du netid signé.
 *
 * @param input - Jeton v5 et outil annoncé
 */
export async function executeFreeSshLauncherRequest(
  input: LauncherExecutionQuery
): Promise<LauncherExecutionResult> {
  void input.ip;
  void input.host;
  void input.user;
  void input.sshkey;
  void input.pkeyfile;
  void input.queryNetid;
  void input.aliasql;
  void input.ptversion;

  const token = input.token?.trim() ?? "";
  if (!token) {
    return refuse(401, "Jeton absent");
  }
  if (!input.secret) {
    return refuse(500, "Configuration d'authentification indisponible");
  }

  const verified = verifyFreeSshLauncherToken(token, input.secret, input.nowMs);
  if (!verified.ok) {
    if (verified.reason === "expired") {
      return refuse(401, "Jeton expiré");
    }
    if (verified.reason === "unknown_version") {
      return refuse(401, "Version de jeton inconnue");
    }
    if (verified.reason === "legacy") {
      return refuse(403, "Jeton legacy refusé");
    }
    if (verified.reason === "target-bound") {
      return refuse(403, "Jeton environnement refusé");
    }
    if (verified.reason === "admin-server") {
      return refuse(403, "Jeton d'administration refusé");
    }
    if (verified.reason === "availability") {
      return refuse(403, "Jeton de disponibilité refusé");
    }
    if (verified.reason === "local-tool") {
      return refuse(403, "Jeton d'outil local refusé");
    }
    return refuse(401, "Jeton invalide");
  }

  const announced = input.tool?.trim() ?? "";
  if (announced !== verified.payload.tool) {
    return refuse(403, "Outil non autorisé par le jeton");
  }

  return readFreeSshPutty(verified.payload);
}

/**
 * Exécute uniquement un jeton d'outil local.
 * Le chemin vient de harptools. Aucun paramètre de query ne choisit l'exécutable.
 *
 * @param input - Jeton v6 et outil annoncé
 */
export async function executeLocalToolLauncherRequest(
  input: LauncherExecutionQuery
): Promise<LauncherExecutionResult> {
  void input.ip;
  void input.host;
  void input.user;
  void input.sshkey;
  void input.pkeyfile;
  void input.queryNetid;
  void input.aliasql;
  void input.ptversion;
  void input.path;
  void input.exe;
  void input.command;
  void input.pshome;
  void input.envId;

  const token = input.token?.trim() ?? "";
  if (!token) {
    return refuse(401, "Jeton absent");
  }
  if (!input.secret) {
    return refuse(500, "Configuration d'authentification indisponible");
  }

  const verified = verifyLocalToolLauncherToken(token, input.secret, input.nowMs);
  if (!verified.ok) {
    if (verified.reason === "expired") {
      return refuse(401, "Jeton expiré");
    }
    if (verified.reason === "unknown_version") {
      return refuse(401, "Version de jeton inconnue");
    }
    if (verified.reason === "legacy") {
      return refuse(403, "Jeton legacy refusé");
    }
    if (verified.reason === "target-bound") {
      return refuse(403, "Jeton environnement refusé");
    }
    if (verified.reason === "admin-server") {
      return refuse(403, "Jeton d'administration refusé");
    }
    if (verified.reason === "free-ssh") {
      return refuse(403, "Jeton SSH libre refusé");
    }
    if (verified.reason === "availability") {
      return refuse(403, "Jeton de disponibilité refusé");
    }
    return refuse(401, "Jeton invalide");
  }

  const announced = input.tool?.trim() ?? "";
  if (announced !== verified.payload.tool) {
    return refuse(403, "Outil non autorisé par le jeton");
  }

  return readLocalTool(verified.payload);
}

/**
 * Choisit le chemin d'exécution d'après la version signée du jeton.
 * Un v1 reconnu est refusé avant toute lecture d'outil ou de clé.
 *
 * @param input - Query du launcher. Les champs libres ne choisissent pas le chemin.
 */
export async function executeLauncherToolRequest(
  input: LauncherExecutionQuery
): Promise<LauncherExecutionResult> {
  const token = input.token?.trim() ?? "";
  if (!token) {
    return refuse(401, "Jeton absent");
  }
  if (!input.secret) {
    return refuse(500, "Configuration d'authentification indisponible");
  }

  const classified = classifyLauncherToken(token, input.secret, input.nowMs);
  if (!classified.ok) {
    if (classified.reason === "expired") {
      return refuse(401, "Jeton expiré");
    }
    if (classified.reason === "unknown_version") {
      return refuse(401, "Version de jeton inconnue");
    }
    return refuse(401, "Jeton invalide");
  }

  if (classified.kind === "availability") {
    return refuse(403, "Jeton de disponibilité refusé");
  }

  if (classified.kind === "target-bound") {
    return executeTargetBoundLauncherRequest(input);
  }

  if (classified.kind === "admin-server") {
    return executeAdminServerLauncherRequest(input);
  }

  if (classified.kind === "free-ssh") {
    return executeFreeSshLauncherRequest(input);
  }

  if (classified.kind === "local-tool") {
    return executeLocalToolLauncherRequest(input);
  }

  if (classified.kind === "legacy") {
    return refuse(403, "Jeton legacy refusé");
  }

  return refuse(401, "Jeton invalide");
}

/**
 * Indique si un payload signé est celui qui a servi à construire la réponse.
 * Utile aux tests pour comparer la cible effective aux paramètres libres.
 *
 * @param payload - Payload v2 vérifié
 */
export function signedLaunchHost(payload: TargetBoundPayload): string {
  if (payload.targetType !== "server") {
    return "";
  }
  const ip = payload.ip.trim();
  return ip !== "" ? ip : payload.hostname.trim();
}
