import React from 'react'
import { columns, StatusEnv } from './columns'
import { db } from "@/lib/db";
import { DataTable } from './data-table';



const EnvDispoListPage = async () => {
     
  // const data = await db.psadm_dispo.findMany( {
  //   include: {
  //     statutenv: true
  //   },
  //   //  where: {
  //   //    id: db.psadm_dispo.statenvId 
  //   //  }, 
  //   orderBy: [
  //     {
  //       fromdate: "desc",
  //     },
  //  ],
  // });

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
 
  return (
     <section className="px-2 sm:px-4 py-2">
             <div className="container mx-auto max-w-full">
                 <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold mb-2 sm:mb-4">Historique Statut des Environnements</h1>
                 <DataTable columns={columns} data={data as StatusEnv[]} />
              </div>
         </section>
  )    
}

export default EnvDispoListPage