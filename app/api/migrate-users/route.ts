import { NextResponse } from "next/server";
import { migrerLesUtilisateurs } from "@/actions/importharp";

/**
 * Route API pour forcer la migration des utilisateurs depuis psadm_user vers User
 * 
 * Cette route peut être appelée pour :
 * - Forcer l'import des utilisateurs même si la table User n'est pas vide
 * - Synchroniser les utilisateurs pour permettre l'authentification
 * 
 * GET /api/migrate-users : Exécute la migration des utilisateurs
 */
export async function GET() {
  try {
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

