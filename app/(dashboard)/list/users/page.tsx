import React from 'react'
import { columns } from './columns'
import { db } from "@/lib/db";
import { DataTable } from './data-table';


export default async function EnvListPage () {

  const data = await db.psadm_user.findMany({
    include: {
      psadm_roleuser: true,
    },
  });

  //console.log("USER  DATA", data);
  
  return (
    <section className="px-2 sm:px-4 py-2">
        <div className="container mx-auto max-w-full">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold mb-2 sm:mb-4">Les utilisateurs</h1>
            <DataTable columns= {columns} data = {data} />
        </div>
    </section>
  );
  
}
