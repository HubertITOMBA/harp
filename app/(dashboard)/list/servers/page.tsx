import React from 'react'
import { columns } from './columns'
import { db } from "@/lib/db";
import { DataTable } from './data-table';



const ServerListPage = async () => {
     
  const data = await db.psadm_srv.findMany();
 
  return (
     <section className="py-2">
             <div className="container ">
                 <h1 className="text-3xl font-semibold">Tous les Serveurs</h1>
                 <DataTable columns= {columns} data = {data} />
              </div>
         </section>
  )    
}

export default ServerListPage