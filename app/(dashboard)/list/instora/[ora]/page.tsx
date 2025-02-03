 

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
  const OraIns  = await prisma.harpora.findFirst({
      where: { 
         oracle_sid: ora 
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
      
        
      const OraInfos = await prisma.psadm_env.findMany({
        where: {
          oracle_sid: ora
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
      <div className="container p-2 gap-4 xl:flex-row w-full">
      {/* <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">  */}

      {/* <div className="bg-white rounded-xl w-full shadow-2xl"> */}

       {/* <h1 className="text-xl font-semibold">Créer un nouvel environnement</h1>
       <p>{EnvHarp?.env} </p>
       {EnvHarp?.harprelease}    */}
       {/* <HarpEnvPage typenvid={params.id}/> */}

        
            <div className="flex bg-white rounded-xl shadow-xl p-2 mt-0 gap-4 relative w-full mb-5">
                  <Image src={`/ressources/ouvert.png`} alt="" width={40} height={40} />
                    <Link href={OraIns.oracle_sid}>
                        <h1 className="text-3xl font-semibold">{OraIns.oracle_sid}</h1>
                    </Link>
                  
                  {/* { Envs.anonym ==="N" ? "" : <Image src="/ressources/anonym.png" alt="" width={40} height={40} className="" />}
                  { Envs.edi ==="N" ? "" : <Image src="/ressources/edi.png" alt="" width={200} height={40} className="items-end bg-transparent" />}
                  <h2 className="text-xl font-semibold mt-2">{Envs.descr} </h2>  */}
            </div>





       
        <div className="flex-2  w-ful">
            <div className="flex flex-col gap-4">
              {/** TOP */}
                <div className="flex bg-red-500 rounded-xl shadow-xl mb-5 mt-2 py-2 px-2 gap-4">
                              
                       <div className="w-1/2 bg-yellow-400 p-2 gap-2">
                              <div className="w-full flex items-center gap-2">
                                  <Label>Environnement  :</Label> <Label className="font-semibold text-sm">
                                    <h1 className="text-sm font-semibold">{OraIns.descr}</h1>
                                  </Label>
                              </div> 
                              <div className="w-full flex items-center gap-2">
                                  <Label>Application  :</Label> <Label className="font-semibold text-sm">
                                    <h1 className="text-sm font-semibold">{OraIns.aliasql}</h1>
                                  </Label>
                              </div> 
                              <div className="w-full flex items-center gap-2">
                              <Label>Version Harp  :</Label> <Label className="font-semibold text-sm">
                              <h1 className="text-sm font-semibold">{OraIns.orarelease}</h1>
                              </Label>
                              </div>
                            
                              <div className="w-full flex items-center gap-2">
                              <Label>Istance Oracle  :</Label> <Label className="font-semibold text-sm">{OraIns.oraschema}</Label>
                              </div>
                              <div className="w-full flex items-center gap-2">
                              <Label>Alias SQL *Net  :</Label> <Label className="font-semibold text-sm">{OraIns.typenvid}</Label>
                              </div>
                              
                       </div>
                                  
                       {/* <div className="w-1/2 gap-4 bg-yellow-400 p-2 h-[auto]">
                          

                            <div className="w-full flex items-center gap-2">
                                <Label>Dernière mis à jour :</Label><Label className="font-semibold text-sm">{new Intl.DateTimeFormat("fr-FR", {dateStyle: 'short', timeStyle: 'short',}).format(Envs.datmaj)} </Label>  
                            </div>
                            <div className="flex gap-4 items-center">
                                <Label>Image production :</Label><Label className="font-semibold text-sm">{new Intl.DateTimeFormat("fr-FR", {dateStyle: 'short', timeStyle: 'medium',}).format(enfInfos?.datadt)} </Label>
                            </div>
                            <div className="flex gap-4 items-center">
                                <Label>Dernier refresh :</Label><Label className="font-semibold text-sm">{new Intl.DateTimeFormat("fr-FR", {dateStyle: 'short', timeStyle: 'medium',}).format(enfInfos?.refreshdt)} </Label>
                            </div>
                            <div className="flex gap-4 items-center">
                            <Label>Dernier mis à jour :</Label><Label className="font-semibold text-sm">{new Intl.DateTimeFormat("fr-FR", {dateStyle: 'short', timeStyle: 'medium',}).format(enfInfos?.modedt)} </Label>
                            </div>
                            <div className="flex gap-4 items-center">
                              <Label>Dernier mis à jour :</Label><Label className="font-semibold text-sm">{new Intl.DateTimeFormat("fr-FR", {dateStyle: 'short', timeStyle: 'short',}).format(enfInfos?.datmaj)} </Label>  
                            </div>
                            
                           
                           
                             

                              
                      </div> */}
                </div>

            </div>
        {/** BOTTOM */}

           <h1 className="text-xl font-semibold mb-4">Roles de serveurs de l'environnement  {ora}</h1>
            {/* <div className="w-full flex gap-5">
                 <div >
                  <EnvServRoles env={Envs.env}/>
                 </div>
            </div> */}

            <div className="bg-white rounded-xl shadow-md overflow-hidden">
                    
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50 ">
                        <tr className="bg-harpOrange text-white">
                          <th className="px-2 py-2 text-left text-xl font-semibold text-white">Descr</th>
                          <th className="px-2 py-2 text-left text-xl font-semibold text-white">Env</th>
                          <th className="px-6 py-4 text-left text-xl font-semibold text-white">Schema</th>  
                          <th className="px-2 py-2 text-left text-xl font-semibold text-white">Appli</th>
                          <th className="px-2 py-2 text-left text-xl font-semibold text-white">Release</th> 
                          <th className="px-2 py-2 text-left text-xl font-semibold text-white">PSoft</th>
                          <th className="px-2 py-2 text-left text-xl font-semibold text-white">Ptools</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        {OraInfos.map((item, oracle_sid) => (
                          <tr key={oracle_sid} className="hover:bg-harpSkyLight transition-colors duration-200">
                            <td className="px-2 py-2 whitespace-nowrap text-xl text-gray-900">{item.descr}</td>
                            <td className="px-2 py-2 whitespace-nowrap text-xl text-gray-900">{item.env}</td>
                            <td className="px-2 py-2 whitespace-nowrap text-xl text-gray-900">{item.oraschema}</td>
                            <td className="px-2 py-2 whitespace-nowrap text-xl text-gray-900">{item.appli}</td> 
                            <td className="px-2 py-2 whitespace-nowrap text-xl text-gray-900">{item.harprelease}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-xl text-gray-900">{item.psversion}</td>  
                            <td className="px-2 py-2 whitespace-nowrap text-xl text-gray-900">{item.ptversion}</td>
                            
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



