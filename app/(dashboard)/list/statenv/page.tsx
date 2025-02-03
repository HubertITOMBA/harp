import React from 'react'
import { columns } from './columns'
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

  const data = await db.psadm_dispo.findMany({
    select: {
      env: true,
      fromdate: true,
      msg: true,
      statenvId: true,
      statutenv: {
        select: {
          id: true,
          statenv: true,
          descr: true,
          icone: true
        }
      }
    },
    orderBy: {
      fromdate: 'desc'
    },
    // include: {
    //   statutenv: true
    // }
  });
 
  return (
     <section className="py-2">
             <div className="container ">
                 <h1 className="text-3xl font-semibold">Historique Statut des Environnements</h1>
                 <DataTable columns= {columns} data = {data} />
              </div>
         </section>
  )    
}

export default EnvDispoListPage