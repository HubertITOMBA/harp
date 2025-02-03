import React from 'react'
import { columns, User } from './columns'
import { db } from "@/lib/db";
import { DataTable } from '@/components/data-table';




async function getUsers(): Promise<User[]> {
  const res = await fetch(
    'https://64a6f5fc096b3f0fcc80e3fa.mockapi.io/api/users'
  )
  const data = await res.json()
  return data
}


export default async function MessagePage () {

  const data = await getUsers()

  const DescEnvts = await db.harpevent.findMany(
    {
       orderBy: [
        // harprelease: "desc",
        // typenvid: "desc",
        {
          deliveryat: "asc",
        },
        // { env: "asc",}
      ],
      take: 2   
  });

  return (
    <section className="py-2">
        <div className="container">
            <h1 className="text-3xl font-semibold">Tous les messages</h1>
            <DataTable columns= {columns} data = {data} />
          {/* <DataTable columns= {columns} data = {DescEnvts} /> */}
        </div>
    </section>
  )
}
