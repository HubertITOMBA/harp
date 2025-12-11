import { signOut } from "@/auth";
import { redirect } from "next/navigation";

/**
 * Route de déconnexion
 * Redirige vers la page de connexion après déconnexion
 */
export async function GET() {
  await signOut();
  redirect("/auth/signin");
}

