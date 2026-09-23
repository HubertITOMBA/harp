import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { migrerLesUtilisateurs } from "@/actions/importharp";

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
 * Route API pour forcer la migration des utilisateurs depuis psadm_user vers User.
 * Réservée à un PORTAL_ADMIN authentifié, rôles lus en base.
 *
 * GET /api/migrate-users : Exécute la migration des utilisateurs
 */
export async function GET() {
  try {
    const denied = await requirePortalAdmin();
    if (denied) {
      return denied;
    }

    console.log("[API Migrate Users] Démarrage de la migration des utilisateurs...");
    
    const result = await migrerLesUtilisateurs();
    
    if (result.error) {
      console.error("[API Migrate Users] Erreur:", result.error);
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 400 });
    }

    if (result.success) {
      console.log("[API Migrate Users] Succès:", result.success);
      return NextResponse.json({
        success: true,
        message: result.success
      }, { status: 200 });
    }

    if (result.info) {
      console.log("[API Migrate Users] Info:", result.info);
      return NextResponse.json({
        success: true,
        info: result.info
      }, { status: 200 });
    }

    return NextResponse.json({
      success: false,
      error: "Résultat inattendu de la migration"
    }, { status: 500 });

  } catch (error) {
    console.error("[API Migrate Users] Erreur critique:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Erreur inconnue lors de la migration"
    }, { status: 500 });
  }
}

/**
 * POST /api/migrate-users : Même fonctionnalité que GET
 */
export async function POST() {
  return GET();
}

