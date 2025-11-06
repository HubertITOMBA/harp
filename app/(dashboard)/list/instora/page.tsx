import React from 'react'
import { columns } from './columns'
import { db } from "@/lib/db";
import { DataTable } from './data-table';

// envsharp
// select: {
//   env: true,
//   fromdate: true,
//   msg: true,
//   statenvId: true,
//   statutenv: {
//     select: {
//       id: true,
//       statenv: true,
//       descr: true,
//       icone: true
//     }
//   }
// },

const InstOraListPage = async () => {
  
  const data = await db.harpinstance.findMany({
      select : {
          id    : true, 
          oracle_sid: true,
          descr : true,   
          serverId  : true, 
          typebaseId   : true,
          envsharp: {
              select: {
                  id: true,
                  env: true,
                  anonym: true,
                  edi: true,
                  url: true,
              }
          },
          harpserve: {
                select: {
                      id: true,
                      srv: true,
                      ip: true,
                      pshome: true,
                      os: true,
                      psuser: true,
                      domain: true,
                      typsrv: true,
                      statenvId: true,
                }
           }
      }
  });


  // const data = await db.harpora.findMany({
  //     select : {
  //       id   : true,
  //       envId: true,       
  //       oracle_sid: true,
  //       aliasql : true,
  //       oraschema: true,
  //       descr : true,
  //       orarelease: true,
  //       statenvId: true,
  //       createddt: true,
  //       envsharp: {
  //           select: {
  //             id: true,
  //             env: true,
  //             anonym: true,
  //             edi: true,
  //             url: true,
  //           }
  //       },
  //       statutenv: {
  //              select: {
  //                id: true,
  //               statenv: true,
  //               descr: true,
  //                 icone: true
  //              }
  //             }
  //       }   
  //     });
 
  return (
     <section className="px-4  py-2">
             <div className="container mx-auto max-w-full">
                 <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold mb-2 sm:mb-4">Toutes les instances Oracle</h1>
                 <DataTable columns= {columns} data = {data} />
              </div>
         </section>
  )    
}

export default InstOraListPage