import React from 'react'
import { columns } from './columns'
import { db } from "@/lib/db";
import { DataTable } from './data-table';



const ToolsListPage = async () => {
     
  
  const data = await db.psadm_tools.findMany();
 
  return (
     <section className="py-2">
             <div className="container ">
                 <h1 className="text-3xl font-semibold">Les outils</h1>
                 <DataTable columns= {columns} data = {data} />
              </div>
         </section>
  )    
}

export default ToolsListPage