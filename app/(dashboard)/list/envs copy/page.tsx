import React from 'react'
import { columns } from './columns'
import { db } from "@/lib/db";
import { DataTable } from './data-table';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Ghost } from 'lucide-react';




// async function getUsers(): Promise<User[]> {
//   const res = await fetch(
//     'https://64a6f5fc096b3f0fcc80e3fa.mockapi.io/api/users'
//   )
//   const data = await res.json()
//   return data
// }


export default async function EnvListPage () {

  //const data = await getUsers()
  //  const data = await db.psadm_env.findMany({
  const data = await db.envsharp.findMany({
    include: {
      statutenv: true,
    },
   }
    
  );

  return (
    <section className="px-4 py-2">
        <div className="container ">
            <h1 className="text-3xl font-semibold">Tous les environnements</h1>
            {/* <Button  type="button" className="rounded-xl ml-auto p-2.5">
               <Link href='/list/envs/create'>Créer un environnement</Link>
             </Button> */}
            <DataTable columns= {columns} data = {data} />
          {/* <DataTable columns= {columns} data = {DescEnvts} /> */}
        </div>
    </section>
  )
}
