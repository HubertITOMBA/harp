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
     <section className="py-2">
             <div className="container ">
                 <h1 className="text-3xl font-semibold">Tous les Utilisateur par Rôle </h1>
                 <DataTable columns= {columns} data = {data} />
              </div>
         </section>
  )    
}

export default UserRoleListPage