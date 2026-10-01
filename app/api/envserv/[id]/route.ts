import prisma from "@/lib/prisma";
import { canAccessEnvironmentForSession } from "@/lib/environment-access";
import { NextResponse } from "next/server";

/**
 * Serveurs d'un environnement.
 * [id] est envsharp.id. La famille est lue sur cette ligne, puis le RBAC
 * et le périmètre sont exigés avant toute lecture de harpenvserv.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const envId = parseInt(id, 10);

    if (Number.isNaN(envId)) {
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
