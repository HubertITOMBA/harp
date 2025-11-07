import { NextResponse } from "next/server";
import { ensureUserMigration } from "@/lib/init-migration";

/**
 * Route API pour initialiser la migration des utilisateurs
 * S'exécute automatiquement une seule fois si la table User est vide
 * 
 * Cette route peut être appelée :
 * - Automatiquement au démarrage de l'application
 * - Manuellement via une requête GET/POST
 */
export async function GET() {
  try {
    const result = await ensureUserMigration();
    
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

export async function POST() {
  // Même logique que GET
  return GET();
}

