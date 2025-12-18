import React from 'react'
import { columns } from './columns'
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Server } from "lucide-react";
import { EnvListPageClient } from './page-client';

export default async function EnvListPage () {
  const data = await db.envsharp.findMany({
    include: {
      statutenv: true,
    },
    orderBy: {
      env: 'asc',
    },
  });

  // Récupérer les données harpora pour chaque environnement
  const envIds = data.map(env => env.id);
  const harporaData = await db.harpora.findMany({
    where: {
      envId: {
        in: envIds,
      },
    },
    select: {
      envId: true,
      orarelease: true,
      descr: true,
    },
    orderBy: {
      createddt: 'desc', // Prendre le plus récent si plusieurs entrées
    },
  });

  // Créer un map pour accéder rapidement aux données harpora par envId
  // Si plusieurs entrées existent pour un même envId, seule la première (la plus récente) sera conservée
  const harporaMap = new Map<number, { orarelease: string | null; descr: string | null }>();
  harporaData.forEach(ora => {
    if (!harporaMap.has(ora.envId)) {
      harporaMap.set(ora.envId, { orarelease: ora.orarelease, descr: ora.descr });
    }
  });

  // Récupérer les données harpenvserv avec harpserve pour chaque environnement (typsrv = 'DB')
  const harpenvservData = await db.harpenvserv.findMany({
    where: {
      envId: {
        in: envIds,
      },
      typsrv: 'DB',
    },
    select: {
      envId: true,
      harpserve: {
        select: {
          srv: true,
        },
      },
    },
  });

  // Créer un map pour accéder rapidement au serveur par envId
  // Si plusieurs entrées existent pour un même envId, seule la première sera conservée
  const serverMap = new Map<number, string | null>();
  harpenvservData.forEach(envserv => {
    if (envserv.envId && !serverMap.has(envserv.envId)) {
      serverMap.set(envserv.envId, envserv.harpserve?.srv || null);
    }
  });

  // Enrichir les données avec les informations harpora et serveur
  const enrichedData = data.map(env => ({
    ...env,
    harpora: harporaMap.get(env.id) || { orarelease: null, descr: null },
    server: serverMap.get(env.id) || null,
  }));

  const envCount = enrichedData.length;
  
  return <EnvListPageClient data={enrichedData} envCount={envCount} columns={columns} />;
}
