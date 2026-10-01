import prisma from "@/lib/prisma";
import { loadVisibleEnvironmentNames } from "@/lib/environment-access";
import { NextResponse } from "next/server";

/**
 * Noms d'environnements legacy pour les formulaires.
 * La visibilité est celle d'envsharp, relié par le nom unique env.
 * Une ligne psadm_env sans homonyme envsharp n'est pas renvoyée.
 */
export async function GET() {
  try {
    const visible = await loadVisibleEnvironmentNames();
    if (visible == null) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const environments = await prisma.psadm_env.findMany({
      where: visible.unrestricted ? undefined : { env: { in: visible.names } },
      orderBy: { env: "asc" },
      select: {
        env: true,
        descr: true,
        site: true,
      },
    });

    return NextResponse.json(environments);
  } catch (error) {
    console.error("Erreur lors de la récupération des environnements:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des environnements" },
      { status: 500 }
    );
  }
}
