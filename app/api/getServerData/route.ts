import { auth } from "@/auth";
import { db } from "@/lib/db";
import prisma from "@/lib/prisma";
import { authorizeResolvedEnvironment } from "@/lib/environment-access";
import { NextResponse } from "next/server";

/** Environnement legacy codé en dur par cette route. */
const LEGACY_ENVIRONMENT_NAME = "FHHPR1";

/**
 * Serveurs legacy de FHHPR1.
 * Le nom est résolu sur envsharp avant toute lecture de psadm_rolesrv.
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const environment = await prisma.envsharp.findUnique({
      where: { env: LEGACY_ENVIRONMENT_NAME },
      select: { id: true, typenvid: true, scopeId: true },
    });
    const access = await authorizeResolvedEnvironment(environment);
    if (access === 401) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    if (access === 404) {
      return NextResponse.json({ error: "Environnement introuvable" }, { status: 404 });
    }
    if (access !== 200) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const data = await db.psadm_rolesrv.findMany({
      where: {
        env: LEGACY_ENVIRONMENT_NAME,
      },
      include: {
        psadm_srv: true,
      },
    });

    const formattedData = data.map((item) => ({
      srv: item.srv,
      ip: item.psadm_srv.ip,
      pshome: item.psadm_srv.pshome,
      os: item.psadm_srv.os,
      psuser: item.psadm_srv.psuser,
      domain: item.psadm_srv.domain,
      env: item.env,
      typsrv: item.typsrv,
      status: item.status,
    }));

    return NextResponse.json(formattedData);
  } catch (error) {
    return NextResponse.json(
      { error: "Erreur lors de la récupération des données" },
      { status: 500 }
    );
  }
}
