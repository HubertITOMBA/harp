import React from 'react'
import { columns } from './columns'
import { db } from "@/lib/db";
import { DataTable } from './data-table';



const HarpRolesListPage = async () => {
     
  
  const data = await db.harproles.findMany();
 
  return (
     <section className="py-2">
             <div className="container bg-transparent">
                 <h1 className="text-3xl font-semibold">Les Rôles</h1>
                 <DataTable columns= {columns} data = {data} />
              </div>
         </section>
  )    
}

export default HarpRolesListPage