import prisma from "@/lib/prisma";
import { RechercheTable } from "@/components/recherche/RechercheTable";

// Toujours exécuter la requête côté serveur avec les données à jour (évite cache en production)
export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Recherche",
  description: "Recherche environnements, types d'env, serveurs (typsrv, env, typenv, srv, site).",
};

/**
 * Équivalent Prisma de la requête SQL :
 * SELECT i.typsrv, e.env, t.typenv, s.srv, s.site, t.id, e.url, e.oraschema, s.ip
 * FROM envsharp e, harptypenv t, harpenvserv i, harpserve s
 * WHERE e.typenvid = t.typenvid AND e.id = i.envId AND i.serverId = s.id
 */
async function getRechercheData() {
  const envServList = await prisma.harpenvserv.findMany({
    where: { envId: { not: null }, serverId: { not: null } },
    include: { harpserve: true },
    orderBy: [{ envId: "asc" }, { typsrv: "asc" }],
  });

  const envIds = [...new Set(envServList.map((i) => i.envId!).filter(Boolean))] as number[];
  if (envIds.length === 0) return [];

  const envSharpList = await prisma.envsharp.findMany({
    where: { id: { in: envIds }, typenvid: { not: null } },
    include: { harptypenv: true },
  });
  const envMap = new Map(envSharpList.map((e) => [e.id, e]));

  const rows: {
    typsrv: string | null;
    env: string;
    typenv: string | null;
    typenvIdForUrl: number | null;
    srv: string;
    site: string | null;
    url: string | null;
    oraschema: string | null;
    ip: string;
  }[] = [];

  for (const i of envServList) {
    if (i.envId == null || i.serverId == null) continue;
    const e = envMap.get(i.envId);
    if (!e?.harptypenv) continue;
    const s = i.harpserve;
    if (!s) continue;
    const t = e.harptypenv;
    rows.push({
      typsrv: i.typsrv,
      env: e.env,
      typenv: t.typenv,
      typenvIdForUrl: t.typenvid,
      srv: s.srv,
      site: s.site,
      url: e.url,
      oraschema: e.oraschema,
      ip: s.ip,
    });
  }

  return rows;
}

export default async function RecherchePage() {
  const data = await getRechercheData();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-200 to-orange-50 p-4 sm:p-6">
      <RechercheTable data={data} />
    </div>
  );
}
