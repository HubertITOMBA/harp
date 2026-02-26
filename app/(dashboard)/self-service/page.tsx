import prisma from "@/lib/prisma";
import { getSessionsFromLog } from "@/lib/parse-sessions-log";
import { OracleSelfService } from "@/components/self-service/OracleSelfService";

export const metadata = {
  title: "Self-service Oracle",
};

export default async function SelfServicePage() {
  // Récupérer tous les enregistrements harpora (instances Oracle)
  const harporaRows = await prisma.harpora.findMany({
    orderBy: { oracle_sid: "asc" },
  });

  if (harporaRows.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-200 to-orange-50 p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto space-y-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Self-service Oracle
          </h1>
          <p className="text-sm text-gray-600">
            Aucun enregistrement trouvé dans la table <code>harpora</code>.
          </p>
        </div>
      </div>
    );
  }

  const envIds = Array.from(
    new Set(harporaRows.map((row) => row.envId).filter((id) => id !== null)),
  ) as number[];

  // Récupérer les serveurs DB (harpenvserv + harpserve) pour ces environnements
  const envServers = await prisma.harpenvserv.findMany({
    where: {
      envId: { in: envIds },
      typsrv: "DB",
    },
    include: {
      harpserve: true,
    },
    orderBy: [{ envId: "asc" }],
  });

  const serversByEnvId = new Map<number, typeof envServers>();
  for (const s of envServers) {
    if (s.envId == null) continue;
    if (!serversByEnvId.has(s.envId)) {
      serversByEnvId.set(s.envId, []);
    }
    serversByEnvId.get(s.envId)!.push(s);
  }

  const records = harporaRows.map((row) => {
    const envId = row.envId;
    const envList = envId != null ? serversByEnvId.get(envId) || [] : [];
    const dbServer = envList[0] || null;
    const serverInfo = dbServer?.harpserve || null;

    return {
      id: row.id,
      oracle_sid: row.oracle_sid,
      aliasql: row.aliasql,
      oraschema: row.oraschema,
      descr: row.descr,
      orarelease: row.orarelease,
      envId: row.envId,
      srv: serverInfo?.srv ?? null,
      site: serverInfo?.site ?? null,
      ip: serverInfo?.ip ?? null,
      typsrv: dbServer?.typsrv ?? null,
    };
  });

  const sessions = getSessionsFromLog();

  return <OracleSelfService records={records} sessions={sessions} />;
}

