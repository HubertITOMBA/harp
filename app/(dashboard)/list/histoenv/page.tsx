import React from 'react'
import { columns, StatusEnv } from './columns'
import { db } from "@/lib/db";
import { DataTable } from './data-table';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { History } from "lucide-react";

/** Row brut : MySQL/Prisma renvoie souvent les colonnes en minuscules (statenvid). */
type RawDispoRow = {
  env: string;
  fromdate: Date;
  msg: string | null;
  statenvid: number | null;
  statenv: string;
};

const EnvDispoListPage = async () => {
  const raw = await db.$queryRaw<RawDispoRow[]>`
    SELECT env, fromdate, msg, statenvId AS statenvid, statenv
    FROM psadm_dispo
    WHERE (fromdate IS NULL OR fromdate >= '1900-01-01')
    ORDER BY fromdate DESC
  `;
  const dataRaw = raw.map((r) => ({
    env: r.env,
    fromdate: r.fromdate,
    msg: r.msg,
    statenvId: r.statenvid ?? 0,
    statenv: r.statenv,
  }));

  // Récupérer les icônes depuis statutenv
  const statutenvIds = dataRaw
    .map(d => d.statenvId)
    .filter((id): id is number => id !== null && id !== undefined);
  
  const statutenvs = await db.statutenv.findMany({
    where: {
      id: {
        in: statutenvIds.length > 0 ? statutenvIds : [-1] // -1 pour éviter une erreur si vide
      }
    },
    select: {
      id: true,
      icone: true
    }
  });

  // Créer un map pour les icônes
  const iconeMap = new Map(statutenvs.map(s => [s.id, s.icone]));

  // Joindre les données avec les icônes
  const data = dataRaw.map(item => ({
    ...item,
    icone: item.statenvId ? iconeMap.get(item.statenvId) || null : null
  }));

  const historyCount = data.length;
 
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-200 to-orange-50 p-3 sm:p-4 lg:p-6">
      <div className="space-y-4 sm:space-y-6">
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="harp-card-header">
            <CardTitle className="flex items-center gap-3 text-xl sm:text-2xl lg:text-3xl font-bold">
              <History className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8" />
              Historique Statut des Environnements
            </CardTitle>
            <p className="text-orange-50 text-sm sm:text-base mt-2">
              {historyCount} entrée{historyCount > 1 ? "s" : ""} enregistrée{historyCount > 1 ? "s" : ""}
            </p>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <DataTable columns={columns} data={data as StatusEnv[]} />
          </CardContent>
        </Card>
      </div>
    </div>
  )    
}

export default EnvDispoListPage