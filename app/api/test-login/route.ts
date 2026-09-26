import { NextResponse } from "next/server";

/**
 * Ancienne route de test. Elle ne crée plus de compte et ne modifie plus de mot de passe.
 */
export async function POST() {
  return NextResponse.json(
    { success: false, error: "Accès refusé" },
    { status: 403 }
  );
}

/**
 * Ancienne route de test. Elle ne décrit plus comment écrire un utilisateur.
 */
export async function GET() {
  return NextResponse.json(
    { success: false, error: "Accès refusé" },
    { status: 403 }
  );
}
