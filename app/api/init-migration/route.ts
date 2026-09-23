import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { ensureUserMigration } from "@/lib/init-migration";

/**
 * Vérifie en base que la session courante appartient à un PORTAL_ADMIN.
 * User.role et harpuseroles/harproles font foi, pas le cache de session.
 *
 * @returns null si l'accès est autorisé, sinon la réponse HTTP 401 ou 403
 */
async function requirePortalAdmin(): Promise<NextResponse | null> {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: "Non authentifié" },
      { status: 401 }
    );
  }

  const userId = parseInt(session.user.id, 10);
  if (isNaN(userId) || userId <= 0) {
    return NextResponse.json(
      { success: false, error: "Session invalide" },
      { status: 401 }
    );
  }

  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      role: true,
      harpuseroles: {
        select: {
          harproles: {
            select: { role: true },
          },
        },
      },
    },
  });

  if (!user) {
    return NextResponse.json(
      { success: false, error: "Session invalide" },
      { status: 401 }
    );
  }

  const isPortalAdmin =
    user.role === "PORTAL_ADMIN" ||
    user.harpuseroles.some((userRole) => userRole.harproles.role === "PORTAL_ADMIN");

  if (!isPortalAdmin) {
    return NextResponse.json(
      { success: false, error: "Accès refusé" },
      { status: 403 }
    );
  }

  return null;
}

/**
 * Route API pour initialiser la migration des utilisateurs.
 * Réservée à un PORTAL_ADMIN authentifié, rôles lus en base.
 *
 * Pour forcer une nouvelle exécution (ex. userCount resté à 0) :
 *   GET /api/init-migration?force=1  ou  ?force=true
 */
export async function GET(request: Request) {
  try {
    const denied = await requirePortalAdmin();
    if (denied) {
      return denied;
    }

    const { searchParams } = new URL(request.url);
    const force = searchParams.get("force") === "1" || searchParams.get("force") === "true";
    const result = await ensureUserMigration(force);
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: "Migration exécutée avec succès",
        userCount: result.userCount,
        details: {
          usersMigration: result.usersMigration,
          rolesMigration: result.rolesMigration
        }
      }, { status: 200 });
    }

    if (result.skipped) {
      return NextResponse.json({
        success: true,
        skipped: true,
        reason: result.reason,
        userCount: result.userCount || 0
      }, { status: 200 });
    }

    return NextResponse.json({
      success: false,
      error: result.error,
      step: result.step
    }, { status: 500 });

  } catch (error) {
    console.error("[API Init Migration] Erreur:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Erreur inconnue"
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  return GET(request);
}

