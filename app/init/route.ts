import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { ensureFullDatabaseMigration } from "@/lib/init-full-migration";

export const dynamic = "force-dynamic";

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
 * Charge initiale GO LIVE.
 * Réservée à un PORTAL_ADMIN authentifié, rôles lus en base.
 * Un visiteur anonyme reçoit 401 et ne déclenche aucune écriture.
 */
export async function GET() {
  const denied = await requirePortalAdmin();
  if (denied) {
    return denied;
  }

  const result = await ensureFullDatabaseMigration();
  const status = result.success ? 200 : 409;
  return NextResponse.json(result, { status });
}

/**
 * Même garde que GET : un POST anonyme ne peut pas lancer la charge.
 */
export async function POST() {
  return GET();
}
