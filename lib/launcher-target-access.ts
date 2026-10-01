import prisma from "@/lib/prisma";
import { canAccessEnvironmentForSession } from "@/lib/environment-access";
import { normalizePeopleToolsVersion } from "@/lib/ptools-path";

/** Outils dont la cible est un serveur rattaché à l'environnement. */
export const LAUNCHER_SERVER_TOOLS = ["putty", "filezilla"] as const;

/** Outils dont la cible est l'environnement lui-même. */
export const LAUNCHER_ENVIRONMENT_TOOLS = ["sqlplus", "pside", "psdmt"] as const;

export type LauncherServerTool = (typeof LAUNCHER_SERVER_TOOLS)[number];
export type LauncherEnvironmentTool = (typeof LAUNCHER_ENVIRONMENT_TOOLS)[number];

const SERVER_TOOLS = new Set<string>(LAUNCHER_SERVER_TOOLS);
const ENVIRONMENT_TOOLS = new Set<string>(LAUNCHER_ENVIRONMENT_TOOLS);

/**
 * Demande d'autorisation. Les champs hors de cette forme sont ignorés.
 * aliasql, ptversion, IP et hostname ne font pas partie de l'entrée.
 */
export type LauncherTargetRequest =
  | {
      targetType: "server";
      envId: unknown;
      serverId: unknown;
      tool: unknown;
    }
  | {
      targetType: "environment";
      envId: unknown;
      tool: unknown;
    };

export type LauncherTargetDenyReason =
  | "unauthenticated"
  | "invalid_environment"
  | "environment_not_found"
  | "forbidden"
  | "unsupported_tool"
  | "invalid_server"
  | "server_not_found"
  | "server_not_linked"
  | "target_unresolved";

export type LauncherTargetDenial = {
  authorized: false;
  reason: LauncherTargetDenyReason;
};

export type AuthorizedServerTarget = {
  authorized: true;
  targetType: "server";
  envId: number;
  serverId: number;
  tool: LauncherServerTool;
  hostname: string;
  ip: string;
};

export type AuthorizedSqlplusTarget = {
  authorized: true;
  targetType: "environment";
  envId: number;
  tool: "sqlplus";
  aliasql: string;
};

export type AuthorizedPeopleSoftTarget = {
  authorized: true;
  targetType: "environment";
  envId: number;
  tool: "pside" | "psdmt";
  aliasql: string | null;
  ptversion: string;
};

export type LauncherTargetDecision =
  | AuthorizedServerTarget
  | AuthorizedSqlplusTarget
  | AuthorizedPeopleSoftTarget
  | LauncherTargetDenial;

function deny(reason: LauncherTargetDenyReason): LauncherTargetDenial {
  return { authorized: false, reason };
}

function positiveInt(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isInteger(value) || value <= 0) {
    return null;
  }
  return value;
}

/**
 * Autorise une cible de lancement pour la session courante.
 * La famille et le périmètre viennent de canAccessEnvironmentForSession.
 * L'hôte n'est accepté que s'il est lié à cet envsharp par harpenvserv.
 * Aucun appelant de production ne doit utiliser cette fonction dans ce palier.
 *
 * @param request - Environnement, outil, et serveur lorsque l'outil est un hôte
 * @returns Cible relue en base, ou un refus sans donnée de lancement
 */
export async function authorizeLauncherTargetForSession(
  request: LauncherTargetRequest
): Promise<LauncherTargetDecision> {
  const tool = typeof request.tool === "string" ? request.tool.trim() : "";
  const serverTool = request.targetType === "server" && SERVER_TOOLS.has(tool);
  const environmentTool = request.targetType === "environment" && ENVIRONMENT_TOOLS.has(tool);
  if (!serverTool && !environmentTool) {
    return deny("unsupported_tool");
  }

  const envId = positiveInt(request.envId);
  if (envId == null) {
    return deny("invalid_environment");
  }

  const serverId = request.targetType === "server" ? positiveInt(request.serverId) : null;
  if (request.targetType === "server" && serverId == null) {
    return deny("invalid_server");
  }

  const access = await canAccessEnvironmentForSession(envId);
  if (access === 401) {
    return deny("unauthenticated");
  }
  if (access === 400) {
    return deny("invalid_environment");
  }
  if (access === 404) {
    return deny("environment_not_found");
  }
  if (access !== 200) {
    return deny("forbidden");
  }

  if (request.targetType === "server") {
    return authorizeServerTarget(envId, serverId as number, tool as LauncherServerTool);
  }
  return authorizeEnvironmentTarget(envId, tool as LauncherEnvironmentTool);
}

async function authorizeServerTarget(
  envId: number,
  serverId: number,
  tool: LauncherServerTool
): Promise<LauncherTargetDecision> {
  const server = await prisma.harpserve.findUnique({
    where: { id: serverId },
    select: { id: true, srv: true, ip: true },
  });
  if (server == null) {
    return deny("server_not_found");
  }

  const link = await prisma.harpenvserv.findFirst({
    where: { envId, serverId },
    select: { id: true },
  });
  if (link == null) {
    return deny("server_not_linked");
  }

  const hostname = server.srv.trim();
  const ip = server.ip.trim();
  if (tool === "filezilla" && ip === "") {
    return deny("target_unresolved");
  }
  if (tool === "putty" && hostname === "" && ip === "") {
    return deny("target_unresolved");
  }

  return {
    authorized: true,
    targetType: "server",
    envId,
    serverId,
    tool,
    hostname,
    ip,
  };
}

async function authorizeEnvironmentTarget(
  envId: number,
  tool: LauncherEnvironmentTool
): Promise<LauncherTargetDecision> {
  const environment = await prisma.envsharp.findUnique({
    where: { id: envId },
    select: { aliasql: true, ptversion: true },
  });
  if (environment == null) {
    return deny("environment_not_found");
  }

  const aliasql = environment.aliasql?.trim() ?? "";

  if (tool === "sqlplus") {
    if (aliasql === "") {
      return deny("target_unresolved");
    }
    return {
      authorized: true,
      targetType: "environment",
      envId,
      tool,
      aliasql,
    };
  }

  const version = normalizePeopleToolsVersion(environment.ptversion);
  if (!version.ok) {
    return deny("target_unresolved");
  }

  return {
    authorized: true,
    targetType: "environment",
    envId,
    tool,
    aliasql: aliasql === "" ? null : aliasql,
    ptversion: version.display,
  };
}
