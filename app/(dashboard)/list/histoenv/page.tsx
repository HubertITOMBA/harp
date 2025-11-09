import React from 'react'
import { columns, StatusEnv } from './columns'
import { db } from "@/lib/db";
import { DataTable } from './data-table';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { History } from "lucide-react";

const EnvDispoListPage = async () => {
  const dataRaw = await db.psadm_dispo.findMany({
    select: {
      env: true,
      fromdate: true,
      msg: true,
      statenvId: true,
      statenv: true
    },
    orderBy: {
      fromdate: 'desc'
    }
  });

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
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-200 to-orange-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
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