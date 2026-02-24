import { signOut } from "@/auth";
import { NextResponse } from "next/server";

/**
 * Construit l'origine côté client (host visible par le navigateur).
 * En production derrière un proxy ou quand le serveur voit request.url en localhost,
 * on s'appuie sur Host / X-Forwarded-Host pour rediriger vers la bonne URL.
 */
function getClientOrigin(request: Request): string {
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "";
  const proto = request.headers.get("x-forwarded-proto") ?? (request.url.startsWith("https") ? "https" : "http");
  if (host) return `${proto}://${host}`;
  const url = new URL(request.url);
  return url.origin;
}

/**
 * Route de déconnexion.
 * redirect: false évite que NextAuth redirige vers AUTH_URL (ex. localhost en prod).
 * On redirige vers /login sur l'origine côté client (Host / X-Forwarded-Host) pour éviter
 * localhost et les erreurs CORS / ERR_CONNECTION_REFUSED.
 */
export async function GET(request: Request) {
  await signOut({ redirect: false });
  const origin = getClientOrigin(request);
  const loginUrl = new URL("/login", origin);
  return NextResponse.redirect(loginUrl);
}

