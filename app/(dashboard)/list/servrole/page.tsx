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
     <section className="px-2 sm:px-4 py-2">
             <div className="container mx-auto max-w-full">
                 <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold mb-2 sm:mb-4">Tous les Serveurs</h1>
                 <DataTable columns= {columns} data = {data} />
              </div>
         </section>
  )    
}

export default ServRoleListPage