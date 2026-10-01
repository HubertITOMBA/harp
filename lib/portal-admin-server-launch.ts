import prisma from "@/lib/prisma";
import { requirePortalAdmin } from "@/lib/require-portal-admin";

export type PortalAdminServerLaunchRequest = {
  serverId: unknown;
  tool: unknown;
};

export type PortalAdminServerLaunchDenyReason =
  | "unauthenticated"
  | "forbidden"
  | "invalid_server"
  | "server_not_found"
  | "target_unresolved"
  | "unsupported_tool";

export type PortalAdminServerLaunchDecision =
  | {
      authorized: true;
      tool: "putty";
      serverId: number;
      hostname: string;
      ip: string;
    }
  | { authorized: false; reason: PortalAdminServerLaunchDenyReason };

function positiveInt(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isInteger(value) || value <= 0) {
    return null;
  }
  return value;
}

/**
 * Autorise un PuTTY d'administration sur un harpserve précis.
 * PORTAL_ADMIN est relu en base. Aucun environnement n'est consulté.
 * IP et hostname du client ne font pas partie de l'entrée.
 *
 * @param request - serverId et l'outil putty
 * @returns Décision. Un refus ne contient pas les champs du serveur.
 */
export async function authorizePortalAdminServerLaunch(
  request: PortalAdminServerLaunchRequest
): Promise<PortalAdminServerLaunchDecision> {
  const admin = await requirePortalAdmin();
  if (!admin.ok) {
    return {
      authorized: false,
      reason: admin.error === "Non authentifié" ? "unauthenticated" : "forbidden",
    };
  }

  if (request.tool !== "putty") {
    return { authorized: false, reason: "unsupported_tool" };
  }

  const serverId = positiveInt(request.serverId);
  if (serverId == null) {
    return { authorized: false, reason: "invalid_server" };
  }

  const server = await prisma.harpserve.findUnique({
    where: { id: serverId },
    select: { id: true, srv: true, ip: true },
  });
  if (!server) {
    return { authorized: false, reason: "server_not_found" };
  }

  const hostname = server.srv?.trim() ?? "";
  const ip = server.ip?.trim() ?? "";
  if (hostname === "" && ip === "") {
    return { authorized: false, reason: "target_unresolved" };
  }

  return {
    authorized: true,
    tool: "putty",
    serverId: server.id,
    hostname,
    ip,
  };
}
