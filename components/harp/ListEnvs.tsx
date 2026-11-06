import prisma from "@/lib/prisma";
import { loadEnvironmentScopeFilter } from "@/lib/load-environment-scope-filter";
import { type EnvironmentScopeFilter } from "@/lib/user-scopes";
import type { Prisma } from "@prisma/client";
import { Card } from "@/components/ui/card";
import { EnvSearchAndNavigation } from "./EnvSearchAndNavigation";
import { EnvFamilyRow } from "./EnvFamilyRow";
import { EnvFamilyCloseAllButton, EnvFamilyCloseProvider } from "./EnvFamilyCloseProvider";

interface EnvInfoProps {
  typenvid: number;
}

type EnvsharpRow = Prisma.envsharpGetPayload<{
  select: {
    id: true;
    env: true;
    descr: true;
    url: true;
    anonym: true;
    edi: true;
    appli: true;
    harprelease: true;
    statutenv: {
      select: {
        id: true;
        statenv: true;
        icone: true;
      };
    };
  };
}>;

const HarpEnvPage = async ({ typenvid }: EnvInfoProps) => {
  // Optimisation : Une seule requête avec tous les includes nécessaires
  // Ajout de gestion d'erreur pour éviter les crashes du worker
  let DescEnvs: EnvsharpRow[] = [];
  let scopeFilter: EnvironmentScopeFilter = { mode: "restricted", scopeIds: [] };
  try {
    scopeFilter = await loadEnvironmentScopeFilter();
  } catch (error) {
    console.error("Erreur lors de la lecture des périmètres:", error);
    scopeFilter = { mode: "restricted", scopeIds: [] };
  }

  const skipEnvironments =
    scopeFilter.mode === "restricted" && scopeFilter.scopeIds.length === 0;

  try {
    if (skipEnvironments) {
      DescEnvs = [];
    } else {
    DescEnvs = await prisma.envsharp.findMany({
      where: {
        typenvid: typenvid,
        ...(scopeFilter.mode === "restricted"
          ? { scopeId: { in: scopeFilter.scopeIds } }
          : {}),
      },
      select: {
        id: true,
        env: true,
        descr: true,
        url: true,
        anonym: true,
        edi: true,
        appli: true,
        harprelease: true,
        statutenv: {
          select: {
            id: true,
            statenv: true,
            icone: true,
          },
        },
      },
      orderBy: {
        env: "asc",
      },
    });
    }
  } catch (error) {
    console.error("Erreur lors de la récupération des environnements:", error);
    // Retourner un tableau vide en cas d'erreur pour éviter un crash
    DescEnvs = [];
  }

  // Récupérer les serveurs pour chaque environnement avec gestion d'erreur
  const envIds = DescEnvs.map(env => env.id);
  
  // Uniquement les environnements déjà retenus par le filtre de périmètre.
  const allServers = envIds.length === 0 ? [] : await prisma.harpenvserv.findMany({
    where: {
      envId: { in: envIds },
    },
    select: {
      envId: true,
      typsrv: true,
      harpserve: {
        select: {
          srv: true,
          ip: true,
        },
      },
    },
    orderBy: [
      { typsrv: 'asc' }, // Prioriser les serveurs DB
      { envId: 'asc' },
    ],
  }).catch((error) => {
    console.error("Erreur lors de la récupération des serveurs:", error);
    return [];
  });

  // Organiser les serveurs par envId
  type EnvServRow = (typeof allServers)[number];
  const serversByEnvId = new Map<number, EnvServRow[]>();
  allServers.forEach((server) => {
    if (server.envId == null) return;
    if (!serversByEnvId.has(server.envId)) {
      serversByEnvId.set(server.envId, []);
    }
    serversByEnvId.get(server.envId)!.push(server);
  });

  // Associer les serveurs aux environnements
  const envsWithServers = DescEnvs.map((env) => {
    const envServers = serversByEnvId.get(env.id) || [];
    
    // Prioriser le serveur DB, sinon prendre le premier
    const dbServer = envServers.find(s => s.typsrv === "DB");
    const serverInfo = dbServer?.harpserve || envServers[0]?.harpserve || null;

    return {
      ...env,
      serverInfo,
    };
  });

  // Le compteur suit la liste déjà filtrée, pas la famille entière.
  const envCount = DescEnvs.length;
  let menuName = `Menu ${typenvid}`;

  try {
    const menu = await prisma.harpmenus.findFirst({
      where: { display: typenvid },
      select: { menu: true },
    });
    menuName = menu?.menu || `Menu ${typenvid}`;
  } catch (error) {
    console.error("Erreur lors de la récupération du menu:", error);
    // menuName reste à la valeur par défaut
  }

  return (
    <div className="min-h-full bg-gradient-to-br from-gray-100 via-gray-200 to-orange-50 px-3 py-3 sm:px-4 sm:py-4">
      <EnvFamilyCloseProvider>
      <div className="mx-auto max-w-7xl space-y-3">
      {/* Header avec statistiques */}
      <div className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between bg-gradient-to-r from-orange-500/10 to-orange-600/10 rounded-lg border border-orange-300/30 shadow-md">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-harpOrange">
            {menuName} : {envCount} Environnement{envCount > 1 ? "s" : ""}
          </h1>
        </div>
        <EnvFamilyCloseAllButton />
      </div>

      {/* Liste des environnements avec recherche et navigation */}
      <EnvSearchAndNavigation 
        envCount={envCount}
        envsData={envsWithServers.map((env) => ({
          id: env.id,
          env: env.env,
          descr: env.descr,
          harprelease: env.harprelease,
          statutenv: env.statutenv,
          serverInfo: env.serverInfo
            ? { srv: env.serverInfo.srv, ip: env.serverInfo.ip }
            : null,
        }))}
      >
        {envsWithServers.map((envsharp) => (
          <EnvFamilyRow
            key={envsharp.id}
            data-env-id={envsharp.id}
            envId={envsharp.id}
            name={envsharp.env}
            url={envsharp.url}
            anonym={envsharp.anonym}
            edi={envsharp.edi}
            descr={envsharp.descr}
            statenv={envsharp.statutenv?.statenv ?? null}
            icone={envsharp.statutenv?.icone ?? null}
            appli={envsharp.appli}
            harprelease={envsharp.harprelease}
            serverLabel={envsharp.serverInfo?.srv || envsharp.serverInfo?.ip || null}
          />
        ))}
      </EnvSearchAndNavigation>

      {/* Message si aucun environnement */}
      {envsWithServers.length === 0 && (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">
            Aucun environnement trouvé pour ce type.
          </p>
        </Card>
      )}
      </div>
      </EnvFamilyCloseProvider>
    </div>
  );
};

export default HarpEnvPage;
