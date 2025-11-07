import { NextResponse } from "next/server";
import { checkOrCreateUser } from "@/actions/check-or-create-user";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { netid, password } = body;

    if (!netid || !password) {
      return NextResponse.json(
        { error: "NetID et mot de passe requis" },
        { status: 400 }
      );
    }

    const result = await checkOrCreateUser(netid, password);
    
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: `Erreur: ${error instanceof Error ? error.message : "Erreur inconnue"}` },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Utilisez POST avec { netid: 'hitomba', password: 'hitomba' }"
  });
}

