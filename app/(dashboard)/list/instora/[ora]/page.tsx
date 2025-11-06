 

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import prisma from "@/lib/prisma";
import HarpEnvPage from '@/components/harp/ListEnvs';
import FormModal from '@/components/harp/FormModal';
import { notFound } from 'next/navigation';
import { psadm_env } from '@prisma/client';
import EnvServRoles from '@/components/harp/EnvServRoles';
import { EnvInfos } from '@/components/harp/EnvInfos';
import { Label } from "@/components/ui/label";
import { Button } from '@/components/ui/button';


const OraSinglePage = async ({ params }: { params: { ora: string } }) => {

  const { ora } = await params;

  // const OraIns  = await prisma.psadm_oracle.findFirst({
  const OraIns  = await prisma.harpinstance.findFirst({
      where: { 
         id: parseInt(ora) 
        },
        // select: {
        //      typenvid : true,
        //     psadm_typenv: {
        //       select: { 
        //       typenv : true,
        //       descr  : true,
        //     },
        //   },
        // },
     });  

     if (!OraIns) {
      return notFound();
    } 

     
    // const enfInfos = await prisma.psadm_envinfo.findUnique({ where: { env: env } });  
      
    const InfoServ = await prisma.harpserve.findFirst({
      where: {
        id: OraIns?.serverId
      },
      }); 
        
      const OraInfos = await prisma.envsharp.findMany({
        where: {
          instanceId: parseInt(ora) 
        },
        // select: {
        //   env: true,
        //   site: true,
        //   oraschema: true,
        //   psversion: true,
        //   ptversion: true,
        //   orarelease: true,
        // }
      }); 

      
    //     const dbServers = await prisma.psadm_rolesrv.findFirst({
    //       where: {
    //           typsrv: "DB",
    //           env: env,
    //           srv: {
    //               equals: prisma.psadm_srv.srv // Note: ceci ne fonctionnera pas comme prévu
    //           }
    //       },
    //       select: {
    //           srv: true,
    //           env: true,
    //           typsrv: true,
    //           psadm_srv: {
    //               select: {
    //                   srv: true,
    //                   ip: true,
    //                   pshome: true,
    //                   psuser: true,
    //                   domain: true
    //               }
    //           }
    //       }
    //   });


    //   const serverRoles = await prisma.psadm_rolesrv.findMany({
    //     where: {
    //       env: env
    //     },
    //     include: {
    //         psadm_srv: true,
    //         psadm_typsrv: true
    //     }
    // }); 


    // const envMonitor = await prisma.psadm_monitor.findFirst({
    //   where: {
    //     env: env,
    //     monitordt: {
    //       equals: prisma.psadm_monitor.findFirst({
    //         where: { env: env },
    //         orderBy: { monitordt: 'desc' },
    //         select: { monitordt: true }
    //       }).monitordt
    //     }
    //   },
    //   select: {
    //     env: true,
    //     monitordt: true,
    //     dbstatus: true,
    //     nbdom: true,
    //     asstatus1: true,
    //     asstatus2: true,
    //     asstatus3: true,
    //     asstatus4: true,
    //     asstatus5: true,
    //     lastasdt: true,
    //     prcsunxstatus: true,
    //     lastprcsunxdt: true,
    //     prcsntstatus: true,
    //     lastprcsntdt: true,
    //     lastlogin: true,
    //     lastlogindt: true
    //   }
    // });





  return (
      <div className="container px-2 p-2 gap-4 xl:flex-row w-full">
      {/* <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">  */}

      {/* <div className="bg-white rounded-xl w-full shadow-2xl"> */}

       {/* <h1 className="text-xl font-semibold">Créer un nouvel environnement</h1>
       <p>{EnvHarp?.env} </p>
       {EnvHarp?.harprelease}    */}
       {/* <HarpEnvPage typenvid={params.id}/> */}

        
            <div className="flex bg-white rounded-xl shadow-xl p-2 mt-0 gap-4 relative w-full mb-5">
                  <Image src={`/ressources/ouvert.png`} alt="" width={40} height={40} />
                    <Link href={OraIns.oracle_sid}>
                        <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold mb-2 sm:mb-4">{OraIns.oracle_sid}</h1>
                    </Link>
                  
                  {/* { Envs.anonym ==="N" ? "" : <Image src="/ressources/anonym.png" alt="" width={40} height={40} className="" />}
                  { Envs.edi ==="N" ? "" : <Image src="/ressources/edi.png" alt="" width={200} height={40} className="items-end bg-transparent" />}
                  <h2 className="text-xl font-semibold mt-2">{Envs.descr} </h2>  */}
            </div>





       
        <div className="flex-2  w-ful">
            <div className="flex flex-col md:flex-row gap-5">
              {/** TOP */}
              
                         <div className="bg-white w-1/3 rounded-xl shadow-xl p-2 gap-5 text-gray-500">
                              <div className="w-full flex items-center gap-2 ">
                                  <Label className="text-xl font-medium">Serveur  :</Label><Label className="text-xl font-medium uppercase">{InfoServ?.srv}</Label>
                              </div> 
                              <div className="w-full flex items-center gap-2">
                                  <Label className="text-2xl font-medium">Ip  :</Label> <Label className="text-xl font-medium">{InfoServ?.ip}</Label>
                              </div> 
                              <div className="w-full flex items-center gap-2">
                              <Label className="text-2xl font-medium">Version Harp  :</Label><Label>{InfoServ?.os}</Label>
                              </div>
                            
                              <div className="w-full flex items-center gap-2">
                              <Label className="text-2xl font-medium">Domaine  :</Label> <Label>{InfoServ?.domain}</Label>
                              </div>
                              <div className="w-full flex items-center gap-2">
                              <Label className="text-2xl font-medium">PS Home  :</Label><Label className="">{InfoServ?.pshome}</Label>
                              </div>
                              <div className="w-full flex items-center gap-2">
                              <Label className="text-2xl font-medium">Os User  :</Label> <Label>{InfoServ?.psuser}</Label>
                              </div>
                              <div className="w-full flex items-center gap-2">
                              <Label className="text-2xl font-medium">Statut  :</Label> <Label>{InfoServ?.statenvId}</Label>
                              </div>
                              
                       </div>

                    {/* <div className="bg-white  w-full rounded-xl shadow-md overflow-hidden">
                       <h1 className="text-xl font-semibold">Les Instances de {OraIns.oracle_sid}</h1>
                          <table className="min-w-full divide-y divide-gray-200 rounded-xl shadow-md ">
                            <thead className="bg-gray-50 ">
                              <tr className="bg-harpOrange text-white">
                                <th className="px-2 py-2 text-left text-xl font-semibold text-white">Base</th>
                                <th className="px-2 py-2 text-left text-xl font-semibold text-white">Alias</th>
                                <th className="px-6 py-4 text-left text-xl font-semibold text-white">Schema</th>  
                                <th className="px-2 py-2 text-left text-xl font-semibold text-white">Appli</th>
                                <th className="px-2 py-2 text-left text-xl font-semibold text-white">Release</th> 
                                <th className="px-2 py-2 text-left text-xl font-semibold text-white">PSoft</th>
                                <th className="px-2 py-2 text-left text-xl font-semibold text-white">Ptools</th>
                                <th className="px-2 py-2 text-left text-xl font-semibold text-white">Ano</th>
                                <th className="px-2 py-2 text-left text-xl font-semibold text-white">Edi</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white">
                              {OraInfos.map((item, instanceId) => (
                                <tr key={instanceId} className="hover:bg-harpSkyLight transition-colors duration-200">
                                  <td className="px-2 py-2 whitespace-nowrap text-xl text-gray-900">{item.env}</td>
                                  <td className="px-2 py-2 whitespace-nowrap text-xl text-gray-900">{item.aliasql}</td>
                                  <td className="px-2 py-2 whitespace-nowrap text-xl text-gray-900">{item.oraschema}</td>
                                  <td className="px-2 py-2 whitespace-nowrap text-xl text-gray-900">{item.appli}</td> 
                                  <td className="px-2 py-2 whitespace-nowrap text-xl text-gray-900">{item.harprelease}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-xl text-gray-900">{item.psversion}</td>  
                                  <td className="px-2 py-2 whitespace-nowrap text-xl text-gray-900">{item.ptversion}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-xl text-gray-900">{item.anonym}</td>  
                                  <td className="px-2 py-2 whitespace-nowrap text-xl text-gray-900">{item.edi}</td>
                                  
                                </tr>
                              ))}
                            </tbody>
                          </table>

                          <div className="w-full flex items-center gap-2">
                              <h1 className="text-xl font-semibold">Les Instances de {OraIns.oracle_sid}</h1>
                              <Button className="rounded-lg ml-auto p-2.5 mb-5">
                                <Link href='/list/instora/create'>Créer un instance oracle</Link>
                              </Button>
                          </div>
                     </div> */}
                           
            </div>
        {/** BOTTOM */}
           <div className="w-full flex items-center gap-5 mt-5">
              <h1 className="text-xl font-semibold">Les Instances de {OraIns.oracle_sid}</h1>
              <Button className="rounded-lg ml-auto p-2.5 mb-5">
                <Link href='/list/instora/create'>Créer un instance oracle</Link>
              </Button>
           </div>
           
            <div className="bg-white rounded-xl shadow-xl overflow-hidden">
                    
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50 ">
                        <tr className="bg-harpOrange text-white">
                          <th className="px-2 py-2 text-left text-xl font-semibold text-white">Base</th>
                          <th className="px-2 py-2 text-left text-xl font-semibold text-white">Alias</th>
                          <th className="px-6 py-4 text-left text-xl font-semibold text-white">Schema</th>  
                          <th className="px-2 py-2 text-left text-xl font-semibold text-white">Appli</th>
                          <th className="px-2 py-2 text-left text-xl font-semibold text-white">Release</th> 
                          <th className="px-2 py-2 text-left text-xl font-semibold text-white">PSoft</th>
                          <th className="px-2 py-2 text-left text-xl font-semibold text-white">Ptools</th>
                          <th className="px-2 py-2 text-left text-xl font-semibold text-white">Ano</th>
                          <th className="px-2 py-2 text-left text-xl font-semibold text-white">Edi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        {OraInfos.map((item, instanceId) => (
                          <tr key={instanceId} className="hover:bg-harpSkyLight transition-colors duration-200">
                            <td className="px-2 py-2 whitespace-nowrap text-xl text-gray-900">{item.env}</td>
                            <td className="px-2 py-2 whitespace-nowrap text-xl text-gray-900">{item.aliasql}</td>
                            <td className="px-2 py-2 whitespace-nowrap text-xl text-gray-900">{item.oraschema}</td>
                            <td className="px-2 py-2 whitespace-nowrap text-xl text-gray-900">{item.appli}</td> 
                            <td className="px-2 py-2 whitespace-nowrap text-xl text-gray-900">{item.harprelease}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-xl text-gray-900">{item.psversion}</td>  
                            <td className="px-2 py-2 whitespace-nowrap text-xl text-gray-900">{item.ptversion}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-xl text-gray-900">{item.anonym}</td>  
                            <td className="px-2 py-2 whitespace-nowrap text-xl text-gray-900">{item.edi}</td>
                            
                          </tr>
                        ))}
                      </tbody>
                      
                    </table>
              </div>


      </div>


    
    </div>
  )
}


export default OraSinglePage;



