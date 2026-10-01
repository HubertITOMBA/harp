import prisma from "@/lib/prisma";
import { canAccessEnvironmentForSession } from "@/lib/environment-access";
import { NextResponse } from "next/server";

/**
 * Ancienne lecture des serveurs d'un environnement.
 * Le fichier n'est pas une route dynamique : l'identifiant n'arrive que s'il
 * est présent dans params. Sans identifiant valide, ou sans décision 200,
 * harpenvserv n'est pas lu.
 */
export async function GET(
  _request: Request,
  context?: { params?: Promise<{ id?: string }> | { id?: string } }
) {
  try {
    const params = context?.params ? await context.params : undefined;
    const envId = Number.parseInt(params?.id ?? "", 10);

    if (!Number.isInteger(envId) || envId <= 0) {
      return NextResponse.json({ error: "ID invalide" }, { status: 400 });
    }

    const access = await canAccessEnvironmentForSession(envId);

    if (access === 401) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    if (access === 400) {
      return NextResponse.json({ error: "ID invalide" }, { status: 400 });
    }
    if (access === 404) {
      return NextResponse.json({ error: "Environnement introuvable" }, { status: 404 });
    }
    if (access !== 200) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const servers = await prisma.harpenvserv.findMany({
      where: {
        envId: envId,
      },
      select: {
        serverId: true,
        typsrv: true,
        status: true,
        harpserve: {
          select: {
            srv: true,
            ip: true,
            pshome: true,
            os: true,
            psuser: true,
            domain: true,
          },
        },
        statutenv: {
          select: {
            statenv: true,
            descr: true,
            icone: true,
          },
        },
      },
    });

    return NextResponse.json(servers);
  } catch (error) {
    console.error("Erreur:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des données" },
      { status: 500 }
    );
  }
}
