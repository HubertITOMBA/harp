import React from 'react'
import { columns } from './columns'
import { db } from "@/lib/db";
import { DataTable } from './data-table';



const UserRoleListPage = async () => {
     
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

  const data = await db.psadm_roleuser.findMany({
    orderBy: {
      datmaj: 'desc'
    },
  });
 
  return (
     <section className="px-2 sm:px-4 py-2">
             <div className="container mx-auto max-w-full">
                 <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold mb-2 sm:mb-4">Tous les Utilisateur par Rôle </h1>
                 <DataTable columns= {columns} data = {data} />
              </div>
         </section>
  )    
}

export default UserRoleListPage