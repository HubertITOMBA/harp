import prisma from "@/lib/prisma";
import { loadEnvironmentAccessContextForSession } from "@/lib/environment-access";
import { environmentVisibilitySql } from "@/lib/user-scopes";
import { RechercheTable, type RechercheRow } from "@/components/recherche/RechercheTable";

// Toujours exécuter la requête côté serveur avec les données à jour (évite cache en production)
export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Recherche",
  description: "Recherche environnements, types d'env, serveurs (typsrv, env, typenv, srv, site).",
};

/** Raw row: MySQL/Prisma renvoie les alias en minuscules (typenvidforurl, etc.) */
type RawRow = {
  typsrv: string | null;
  env: string;
  typenv: string | null;
  typenvidforurl: number | null;
  srv: string;
  site: string | null;
  url: string | null;
  oraschema: string | null;
  ip: string;
  envid: number;
  serverid: number;
};

/**
 * Requête SQL explicite pour garantir la jointure sur typenvid :
 * le type d'environnement (PRE-PRODUCTION, PRODUCTION, etc.) vient de harptypenv.typenv
 * via envsharp.typenvid = harptypenv.typenvid (et non harptypenv.id).
 * On mappe les clés brutes (minuscules) vers RechercheRow pour le composant.
 */
async function getRechercheData(): Promise<RechercheRow[]> {
  const context = await loadEnvironmentAccessContextForSession();
  const visibility = environmentVisibilitySql(context);
  if (visibility == null) {
    return [];
  }

  const raw = await prisma.$queryRaw<RawRow[]>`
    SELECT
      i.typsrv AS typsrv,
      e.env AS env,
      t.typenv AS typenv,
      t.typenvid AS typenvidforurl,
      s.srv AS srv,
      s.site AS site,
      e.url AS url,
      e.oraschema AS oraschema,
      s.ip AS ip,
      e.id AS envid,
      s.id AS serverid
    FROM harpenvserv i
    INNER JOIN harpserve s ON i.serverId = s.id
    INNER JOIN envsharp e ON i.envId = e.id
    INNER JOIN harptypenv t ON e.typenvid = t.typenvid
    WHERE i.envId IS NOT NULL
      AND i.serverId IS NOT NULL
      AND e.typenvid IS NOT NULL
      AND ${visibility}
    ORDER BY i.envId ASC, i.typsrv ASC
  `;

  return raw.map((r) => ({
    typsrv: r.typsrv,
    env: r.env,
    typenv: r.typenv,
    typenvIdForUrl: r.typenvidforurl,
    srv: r.srv,
    site: r.site,
    url: r.url,
    oraschema: r.oraschema,
    ip: r.ip,
    envId: Number(r.envid),
    serverId: Number(r.serverid),
  }));
}

export default async function RecherchePage() {
  const data = await getRechercheData();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-200 to-orange-50 p-4 sm:p-6">
      <RechercheTable data={data} />
    </div>
  );
}
