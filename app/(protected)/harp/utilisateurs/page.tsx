  
import React from 'react'
import { Prisma, psadm_dispo, psadm_env, psadm_envinfo, psadm_logo, psadm_oracle, psadm_rolesrv, psadm_roleuser, psadm_srv, psadm_statenv, psadm_typenv } from "@prisma/client";
import prisma from "@/lib/prisma";
import TableSearch from '@/components/harp/TableSearch';
import { Card, CardContent, CardHeader, CardFooter  } from "@/components/ui/card"
import Image from "next/image"
import Link from "next/link";
import Table from '@/components/harp/Table';

type EnvironmentList =  psadm_env &  
                        { psadm_env: psadm_typenv[]} &
                        { psadm_envinfos: psadm_envinfo[] } &
                        { psadm_oracles: psadm_oracle[] }
 

// const renderRow = (item: EnvironmentList ) => (
//   <div key={item.env}
//       className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-fmkSkyLight"
//   >
      
//               <h3 className="font-semibold">{item.env}</h3>
//               {item.descr}
//               {item.psadm_envinfos.map(psadm_envinfo=>psadm_envinfo.env).join(",")} 
               
     
//   </div>
// )

const ListeUtilisteurs = async ( {
            searchParams,
        }: {
            searchParams: { [key: string]: string | undefined };
        }) => {


          const { page, ...queryParams } = searchParams;
          const p = page ? parseInt(page): 1;
          const query : Prisma.psadm_envWhereInput ={};

          if (queryParams) {
             for (const [key, value] of Object.entries(queryParams)) {
              console.log("CLES  DISPONIBLES A  CHERECHER", key);
                 if (value !== undefined) {
                   switch (key) {
                     case "classId":  
                        query.psadm_typenv = {
                           some:{
                            psadm_env: value,
                           },
                     };
                     break;
                     case "rechercher":
                       query.env = {contains:value, lte:"insensitive"};
                       break;
                   default:
                     break; 
                   }
                 }
             }
          }
            
          
          

          const [ data, count ] = await prisma.$transaction([
            prisma.psadm_env.findMany({
              where: query,
              include: {
                 psadm_typenv: true,
                //  psadm_envinfo: true,
              },
              // take: ITEM_PER_PAGE,
              // skip: ITEM_PER_PAGE * ( p-1),
            }),  
            prisma.psadm_env.count({ where: query }),
            ])


  return (
    <div>LES UTILISATEURS
       { data.map((psadm_env) => (
            <div className="w-full mb-3 bg-white shadow-xl justify-between hover:bg-orange-100" key={psadm_env.env}>
                <div className="flex ml-3 mt-2  gap-8 relative ">
                    {/* <Header  label={headerLabel}/> */}
                    <Link href={`/list/envs/${psadm_env.env}`} className="text-5xl font-bold">{psadm_env.env} </Link>
                        
                        { psadm_env.anonym ==="N" ? "" : <Image src="/ressources/anonym.png" alt="" width={40} height={40} className="mt-1" />}
                        {/* <div data-tooltip="tooltip"
                          className="absolute z-50 whitespace-normal break-words rounded-lg bg-black py-1.5 px-3 font-sans text-sm font-normal text-white focus:outline-none">
                          Material Tailwind
                        </div> */}
                          <h1 className="text-right text-5xl font-bold items-center justify-end w-auto">{psadm_env.typenv}</h1>
                </div> 
                  <div className="ml-3 ">
                      <div className="items-center">
                          <div className="mt-2 flex flex-col items-center justify-between gap-8 text-2xl font-bold font-blue-900">
                              {/* {psadm_env.anonym}  */}
                              {psadm_env.descr} 
                          </div>
                          <div className="flex flex-row">
                              <div className="basis-1/2">
                                  <p>{psadm_env.typenv}</p><br />
                                  <p>{psadm_env.oracle_sid}</p><br />
                                  <p>{psadm_env.aliasql}</p><br />
                                  <p>{psadm_env.oraschema}</p><br />
                                  {/* <p>{psadm_oracle.orarelease}</p><br /> */}
                                  <p>{psadm_env.appli}</p> <br />
                              </div> 
                            <div className="basis-1/2">
                               <p>{psadm_env.psversion} </p><br />
                               <p> {psadm_env.ptversion} </p><br />
                                <p>{psadm_env.harprelease} </p><br />
                                <p> {psadm_env.volum} </p><br />
                               {/* <p> {psadm_typenv.typenv}</p> */}
                             </div>
                        </div>
                      
                      </div>             
                    </div>
                    </div>
                    ))
                  }
    </div>
  )
}

export default ListeUtilisteurs
