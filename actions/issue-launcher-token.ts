"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { authorizeLauncherTargetForSession, type LauncherTargetRequest } from "@/lib/launcher-target-access";
import { normalizeFreeSshHost } from "@/lib/free-ssh-host";
import { authorizePortalAdminServerLaunch } from "@/lib/portal-admin-server-launch";
import {
  LAUNCHER_ADMIN_SERVER_TARGET,
  LAUNCHER_FREE_SSH_TARGET,
  LAUNCHER_LOCAL_TOOL_TARGET,
  LAUNCHER_TOKEN_TTL_SECONDS,
  LAUNCHER_TOKEN_VERSION_ADMIN_SERVER,
  LAUNCHER_TOKEN_VERSION_FREE_SSH,
  LAUNCHER_TOKEN_VERSION_LOCAL_TOOL,
  LAUNCHER_TOKEN_VERSION_TARGET,
  signAdminServerLauncherToken,
  signAvailabilityToken,
  signFreeSshLauncherToken,
  signLocalToolLauncherToken,
  signTargetBoundLauncherToken,
  type AdminServerLaunchPayload,
  type FreeSshLaunchPayload,
  type LocalToolLaunchPayload,
  type TargetBoundPayload,
} from "@/lib/launcher-token";

const TOOL_NAME = /^[a-z][a-z0-9_-]{0,31}$/;

export type IssuedLauncherToken =
  | { success: true; token: string }
  | { success: false; error: string };

/**
 * Émet un jeton de disponibilité. Il n'autorise pas une commande.
 * Aucune cible n'est inscrite dans le payload.
 *
 * @param tool - Nom d'outil à vérifier
 * @returns Jeton d'usage availability, ou un refus sans jeton
 */
export async function issueAvailabilityToken(tool: string): Promise<IssuedLauncherToken> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Non authentifié" };
  }

  const requested = tool?.trim() ?? "";
  if (!TOOL_NAME.test(requested)) {
    return { success: false, error: "Outil invalide" };
  }

  let netid = session.user.netid?.trim() ?? "";
  if (!netid) {
    const userId = Number(session.user.id);
    if (Number.isInteger(userId) && userId > 0) {
      const row = await db.user.findUnique({
        where: { id: userId },
        select: { netid: true },
      });
      netid = row?.netid?.trim() ?? "";
    }
  }

  if (!netid) {
    return { success: false, error: "Identité de session incomplète" };
  }

  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    return { success: false, error: "Configuration d'authentification indisponible" };
  }

  return { success: true, token: signAvailabilityToken({ netid, tool: requested }, secret) };
}

/**
 * Émet un jeton v2 uniquement après authorizeLauncherTargetForSession.
 * Aucun repli vers le jeton legacy sans cible. Les boutons actuels n'appellent pas cette fonction.
 *
 * @param request - Identifiants stables de la cible. IP, hostname, aliasql et ptversion sont ignorés.
 * @returns Jeton lié à la cible relue en base, ou un refus sans jeton
 */
export async function issueTargetBoundLauncherToken(
  request: LauncherTargetRequest
): Promise<IssuedLauncherToken> {
  const decision = await authorizeLauncherTargetForSession(request);
  if (!decision.authorized) {
    return {
      success: false,
      error: decision.reason === "unauthenticated" ? "Non authentifié" : "Accès refusé",
    };
  }

  const session = await auth();
  let netid = session?.user?.netid?.trim() ?? "";
  if (!netid && session?.user?.id) {
    const userId = Number(session.user.id);
    if (Number.isInteger(userId) && userId > 0) {
      const row = await db.user.findUnique({
        where: { id: userId },
        select: { netid: true },
      });
      netid = row?.netid?.trim() ?? "";
    }
  }
  if (!netid) {
    return { success: false, error: "Identité de session incomplète" };
  }

  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    return { success: false, error: "Configuration d'authentification indisponible" };
  }

  const exp = Math.floor(Date.now() / 1000) + LAUNCHER_TOKEN_TTL_SECONDS;
  const payload: TargetBoundPayload =
    decision.targetType === "server"
      ? {
          v: LAUNCHER_TOKEN_VERSION_TARGET,
          targetType: "server",
          envId: decision.envId,
          serverId: decision.serverId,
          tool: decision.tool,
          hostname: decision.hostname,
          ip: decision.ip,
          netid,
          exp,
        }
      : decision.tool === "sqlplus"
        ? {
            v: LAUNCHER_TOKEN_VERSION_TARGET,
            targetType: "environment",
            envId: decision.envId,
            tool: "sqlplus",
            aliasql: decision.aliasql,
            netid,
            exp,
          }
        : {
            v: LAUNCHER_TOKEN_VERSION_TARGET,
            targetType: "environment",
            envId: decision.envId,
            tool: decision.tool,
            aliasql: decision.aliasql,
            ptversion: decision.ptversion,
            netid,
            exp,
          };

  return { success: true, token: signTargetBoundLauncherToken(payload, secret) };
}

/**
 * Émet un jeton PuTTY d'administration après authorizePortalAdminServerLaunch.
 * Le serveur est relu par id. Aucun environnement n'est signé.
 *
 * @param request - serverId stable et l'outil putty. IP, hostname et clé sont ignorés.
 * @returns Jeton v4, ou un refus sans jeton
 */
export async function issuePortalAdminServerLaunchToken(request: {
  serverId: unknown;
  tool: unknown;
}): Promise<IssuedLauncherToken> {
  const decision = await authorizePortalAdminServerLaunch(request);
  if (!decision.authorized) {
    return {
      success: false,
      error: decision.reason === "unauthenticated" ? "Non authentifié" : "Accès refusé",
    };
  }

  const session = await auth();
  let netid = session?.user?.netid?.trim() ?? "";
  if (!netid && session?.user?.id) {
    const userId = Number(session.user.id);
    if (Number.isInteger(userId) && userId > 0) {
      const row = await db.user.findUnique({
        where: { id: userId },
        select: { netid: true },
      });
      netid = row?.netid?.trim() ?? "";
    }
  }
  if (!netid) {
    return { success: false, error: "Identité de session incomplète" };
  }

  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    return { success: false, error: "Configuration d'authentification indisponible" };
  }

  const payload: AdminServerLaunchPayload = {
    v: LAUNCHER_TOKEN_VERSION_ADMIN_SERVER,
    targetType: LAUNCHER_ADMIN_SERVER_TARGET,
    tool: "putty",
    serverId: decision.serverId,
    hostname: decision.hostname,
    ip: decision.ip,
    netid,
    exp: Math.floor(Date.now() / 1000) + LAUNCHER_TOKEN_TTL_SECONDS,
  };

  return { success: true, token: signAdminServerLauncherToken(payload, secret) };
}

/**
 * Émet un jeton PuTTY SSH libre pour /hub.
 * L'hôte vient du client après validation. Le netid et User.pkeyfile viennent du serveur.
 * user, netid, sshkey et pkeyfile fournis par le client sont ignorés.
 *
 * @param request - Hôte saisi et, éventuellement, l'outil putty
 * @returns Jeton v5, ou un refus sans jeton
 */
export async function issueFreeSshLauncherToken(request: {
  host: unknown;
  tool?: unknown;
}): Promise<IssuedLauncherToken> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Non authentifié" };
  }

  if (request.tool !== undefined && request.tool !== "putty") {
    return { success: false, error: "Outil invalide" };
  }

  const host = normalizeFreeSshHost(request.host);
  if (!host) {
    return { success: false, error: "Hôte invalide" };
  }

  let netid = session.user.netid?.trim() ?? "";
  if (!netid) {
    const userId = Number(session.user.id);
    if (Number.isInteger(userId) && userId > 0) {
      const row = await db.user.findUnique({
        where: { id: userId },
        select: { netid: true },
      });
      netid = row?.netid?.trim() ?? "";
    }
  }
  if (!netid) {
    return { success: false, error: "Identité de session incomplète" };
  }

  const user = await db.user.findUnique({
    where: { netid },
    select: { pkeyfile: true },
  });
  if (!user) {
    return { success: false, error: "Utilisateur introuvable" };
  }
  if ((user.pkeyfile?.trim() ?? "") === "") {
    return { success: false, error: "Clé SSH absente" };
  }

  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    return { success: false, error: "Configuration d'authentification indisponible" };
  }

  const payload: FreeSshLaunchPayload = {
    v: LAUNCHER_TOKEN_VERSION_FREE_SSH,
    targetType: LAUNCHER_FREE_SSH_TARGET,
    tool: "putty",
    host,
    netid,
    exp: Math.floor(Date.now() / 1000) + LAUNCHER_TOKEN_TTL_SECONDS,
  };

  return { success: true, token: signFreeSshLauncherToken(payload, secret) };
}

/**
 * Émet un jeton d'outil local. Seul sqldeveloper est autorisé.
 * Le chemin n'est pas signé : il sera relu dans harptools à l'exécution.
 * Aucune cible d'environnement n'est consultée.
 *
 * @param request - Nom logique de l'outil. path, exe et command sont ignorés.
 * @returns Jeton v6, ou un refus sans jeton
 */
export async function issueLocalToolLauncherToken(request: {
  tool: unknown;
}): Promise<IssuedLauncherToken> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Non authentifié" };
  }

  if (request.tool !== "sqldeveloper") {
    return { success: false, error: "Outil invalide" };
  }

  let netid = session.user.netid?.trim() ?? "";
  if (!netid) {
    const userId = Number(session.user.id);
    if (Number.isInteger(userId) && userId > 0) {
      const row = await db.user.findUnique({
        where: { id: userId },
        select: { netid: true },
      });
      netid = row?.netid?.trim() ?? "";
    }
  }
  if (!netid) {
    return { success: false, error: "Identité de session incomplète" };
  }

  const account = await db.user.findUnique({
    where: { netid },
    select: { id: true },
  });
  if (!account) {
    return { success: false, error: "Utilisateur introuvable" };
  }

  const configured = await db.harptools.findFirst({
    where: { tool: "sqldeveloper" },
    select: { cmd: true },
  });
  if (!configured?.cmd || configured.cmd.trim() === "") {
    return { success: false, error: "Outil non configuré" };
  }

  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    return { success: false, error: "Configuration d'authentification indisponible" };
  }

  const payload: LocalToolLaunchPayload = {
    v: LAUNCHER_TOKEN_VERSION_LOCAL_TOOL,
    targetType: LAUNCHER_LOCAL_TOOL_TARGET,
    tool: "sqldeveloper",
    netid,
    exp: Math.floor(Date.now() / 1000) + LAUNCHER_TOKEN_TTL_SECONDS,
  };

  return { success: true, token: signLocalToolLauncherToken(payload, secret) };
}
