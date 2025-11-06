import React from 'react'
import { columns } from './columns'
import { db } from "@/lib/db";
import { DataTable } from './data-table';



const StatEnvListPage = async () => {
     

  const data = await db.statutenv.findMany();
 
  return (
     <section className="px-4 py-2">
             <div className="container ">
                 <h1 className="text-3xl font-semibold">Les status</h1>
                 <DataTable columns= {columns} data = {data} />
              </div>
         </section>
  )    
}

export default StatEnvListPage