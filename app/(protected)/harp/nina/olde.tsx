import React from 'react'
import { columns } from './columns'
import { db } from "@/lib/db";
import { DataTable } from './data-table';


export default async function EnvServRoleListPage () {

  //const data = await getUsers()

  const roleServices = await db.psadm_rolesrv.findMany({
    where: {
      env: "FHHPR1"
      
      },
      include: {
      psadm_srv: true, // Inclut les données de la table psadm_srv
    }
    // Vous pouvez ajouter des conditions de filtrage si nécessaire
     
  });


  const query = await db.psadm_rolesrv.findMany({
    where: {
      env: 'FHHPR1'
    },
    include: {
      psadm_srv: true
    }
  });

   
  const ServerRole = await db.psadm_srv.findMany({
    select: {
      srv: true,
      ip: true,
      pshome: true,
      os: true,
      psuser: true,
      domain: true,
        psadm_rolesrv: {
          select: {
            env: true,
            typsrv: true,
            status: true
          }
        },
     },
   where: {
      psadm_rolesrv: {
        some: {
          env: "FHHPR1"
        }
      }
    },
    // orderBy: {
    //   psadm_rolesrv: {
    //     typsrv: 'asc'
    //   }
    // }
  })




  return (
    <section className="py-2">
        <div className="container">
            <h1 className="text-3xl font-semibold">Tous les environnements</h1>
             <DataTable columns= {columns} data = {roleServices} />
            {/* <DataTable columns= {columns} data = {ServerRole} /> */}
          {/* <DataTable columns= {columns} data = {DescEnvts} /> */}
        </div>
    </section>
  )
}
