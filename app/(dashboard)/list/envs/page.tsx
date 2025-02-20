import React from 'react'
import { columns } from './columns'
import { db } from "@/lib/db";
import { DataTable } from './data-table';




// async function getUsers(): Promise<User[]> {
//   const res = await fetch(
//     'https://64a6f5fc096b3f0fcc80e3fa.mockapi.io/api/users'
//   )
//   const data = await res.json()
//   return data
// }


export default async function EnvListPage () {

  //const data = await getUsers()

  const data = await db.psadm_env.findMany({
    include: {
      statutenv: true,
    },
   }
    
  );

  return (
    <section className="py-2  bg-gray-250">
        <div className="container">
            <h1 className="text-3xl font-semibold">Tous les environnements</h1>
            <DataTable columns= {columns} data = {data} />
          {/* <DataTable columns= {columns} data = {DescEnvts} /> */}
        </div>
    </section>
  )
}
