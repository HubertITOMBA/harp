import React from 'react'
import { columns } from './columns'
import { db } from "@/lib/db";
import { DataTable } from './data-table';



const ServRoleListPage = async () => {
     
  const data = await db.psadm_rolesrv.findMany({
    include: {
      psadm_srv: true,
      psadm_typsrv: true,
    }
});
 
  return (
     <section className="py-2">
             <div className="container ">
                 <h1 className="text-3xl font-semibold">Tous les Serveurs</h1>
                 <DataTable columns= {columns} data = {data} />
              </div>
         </section>
  )    
}

export default ServRoleListPage