import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { loadEnvironmentScopeFilter } from "@/lib/load-environment-scope-filter";
import { decideEnvironmentServerAccess } from "@/lib/user-scopes";
import { NextResponse } from "next/server";

/**
 * Serveurs d'un environnement.
 * La session est obligatoire. Le scope est jugé sur envsharp.scopeId
 * avant toute lecture de harpenvserv.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { id } = await params;
    const envId = parseInt(id, 10);

    if (Number.isNaN(envId)) {
      return NextResponse.json({ error: "ID invalide" }, { status: 400 });
    }

    const environment = await prisma.envsharp.findUnique({
      where: { id: envId },
      select: { id: true, scopeId: true },
    });

    const scopeFilter = await loadEnvironmentScopeFilter();
    const access = decideEnvironmentServerAccess({
      authenticated: true,
      environment,
      scopeFilter,
    });

    if (access === 404) {
      return NextResponse.json({ error: "Environnement introuvable" }, { status: 404 });
    }
    if (access === 403) {
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

    const serversWithDescr = await Promise.all(
      servers.map(async (server) => {
        let psadm_typsrv = null;
        if (server.typsrv) {
          const typsrvData = await prisma.psadm_typsrv.findUnique({
            where: { typsrv: server.typsrv },
            select: { descr: true },
          });
          if (typsrvData) {
            psadm_typsrv = typsrvData;
          }
        }
        return {
          ...server,
          psadm_typsrv,
        };
      })
    );

    return NextResponse.json(serversWithDescr);
  } catch (error) {
    console.error("Erreur:", error);
    return NextResponse.json({ error: "Erreur lors de la récupération des données" }, { status: 500 });
  }
}
