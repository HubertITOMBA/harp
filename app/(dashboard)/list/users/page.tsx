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
    <section className="py-2">
        <div className="container">
            <h1 className="text-3xl font-semibold">Les utilisateurs</h1>
            <DataTable columns= {columns} data = {data} />
        </div>
    </section>
  );
  
}
