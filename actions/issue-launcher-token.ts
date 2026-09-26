"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { signLauncherToken } from "@/lib/launcher-token";

const TOOL_NAME = /^[a-z][a-z0-9_-]{0,31}$/;

export type IssuedLauncherToken =
  | { success: true; token: string }
  | { success: false; error: string };

/**
 * Émet un jeton de lancement signé pour l'utilisateur de la session.
 * Le nom d'outil vient du client. Le netid vient uniquement de la session.
 *
 * @param tool - nom d'outil demandé
 * @returns Jeton court, ou un refus sans jeton
 */
export async function issueLauncherToken(tool: string): Promise<IssuedLauncherToken> {
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

  return { success: true, token: signLauncherToken({ netid, tool: requested }, secret) };
}
