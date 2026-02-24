import { signOut } from "@/auth";
import { NextResponse } from "next/server";

/**
 * Route de déconnexion.
 * redirect: false évite que NextAuth redirige vers AUTH_URL (ex. localhost en prod),
 * ce qui provoquerait une erreur CORS quand l'utilisateur est sur une autre origine (ex. 172.24.250.48).
 * On redirige explicitement vers la même origine que la requête.
 */
export async function GET(request: Request) {
  await signOut({ redirect: false });
  const url = new URL(request.url);
  const loginUrl = new URL("/login", url.origin);
  return NextResponse.redirect(loginUrl);
}

