 

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
import { Badge } from '@/components/ui/badge';


interface EnvInfoProps {
  id : number;
};
  
    const EnvSinglePage = async ({ params }: { params: { id: number } }) => {
 // const EnvSinglePage = async ({ params: { env },}: { params: { env: string }; }) => {
 // const EnvSinglePage = async ({ env }: EnvInfoProps) => {
   
 //  const envParam = await params.env;
  const { id } = await params;

  
  const Envs  = await prisma.envsharp.findUnique({
      where: { id: id },
        include: {
          // _count: {
          //   select: {
              statutenv: true,
              //psadm_rolesrv : true,    
             // psadm_oracle : true,
             // psadm_dispo: true,
              //psadm_typenv: true,
             // psadm_release: true,  
            //  psadm_ptools: true,   
            //  psadm_appli: true,
          //   },
          // },
        },
     });  

     if (!Envs) {
      return notFound();
    } 

     
     const envInfos = await prisma.harpenvinfo.findUnique({ where: { envId: id } });  
    
   
      const OraInfos = await prisma.envsharp.findUnique({
        where: {
          id: id
        },
        select: {
          env: true,
         // site: true,
        //  oracle_sid: true,
          // psadm_oracle: {
          //   select: {
          //     aliasql: true,
          //     orarelease: true
          //   }
          // }
        }
      }); 

      
        const dbServers = await prisma.harpenvserv.findFirst({
          where: {
              typsrv: "DB",
              envId: id,
              // serverId: {
              //     equals: prisma.harpserve. // Note: ceci ne fonctionnera pas comme prévu
              // }
          },
          select: {
              serverId: true,
              // env: true,
              typsrv: true,
              harpserve: {
                  select: {
                      srv: true,
                      ip: true,
                      pshome: true,
                      psuser: true,
                      domain: true
                  }
              }
          }
      });


      const serverRoles = await prisma.psadm_rolesrv.findMany({
        where: {
          env: env
        },
        include: {
            psadm_srv: true,
            psadm_typsrv: true
        }
    }); 


    const envMonitor = await prisma.psadm_monitor.findFirst({
      where: {
        env: env,
        monitordt: {
          equals: prisma.psadm_monitor.findFirst({
            where: { env: env },
            orderBy: { monitordt: 'desc' },
            select: { monitordt: true }
          }).monitordt
        }
      },
      select: {
        env: true,
        monitordt: true,
        dbstatus: true,
        nbdom: true,
        asstatus1: true,
        asstatus2: true,
        asstatus3: true,
        asstatus4: true,
        asstatus5: true,
        lastasdt: true,
        prcsunxstatus: true,
        lastprcsunxdt: true,
        prcsntstatus: true,
        lastprcsntdt: true,
        lastlogin: true,
        lastlogindt: true
      }
    });





  return (
      <div className="container p-2 gap-4 xl:flex-row w-full">
      {/* <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">  */}

      {/* <div className="bg-white rounded-xl w-full shadow-2xl"> */}

       {/* <h1 className="text-xl font-semibold">Créer un nouvel environnement</h1>
       <p>{EnvHarp?.env} </p>
       {EnvHarp?.harprelease}    */}
       {/* <HarpEnvPage typenvid={params.id}/> */}

        
            <div className="flex bg-white rounded-xl shadow-xl p-2 mt-0 gap-4 relative w-full mb-5">
                  <Image src={`/ressources/${Envs.statutenv.icone}`} alt="" width={40} height={40} />
                    <Link href={Envs.url}>
                        <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold mb-2 sm:mb-4">{Envs.env}</h1>
                    </Link>
                  
                  { Envs.anonym ==="N" ? "" : <Image src="/ressources/anonym.png" alt="" width={40} height={40} className="" />}
                  { Envs.edi ==="N" ? "" : <Image src="/ressources/edi.png" alt="" width={200} height={40} className="items-end bg-transparent" />}
                  <h2 className="text-xl font-semibold mt-2">{Envs.descr} </h2> 
            </div>





       
        <div className="flex-2  w-ful">
            <div className="flex flex-col gap-4">
              {/** TOP */}
                <div className="flex bg-white rounded-xl shadow-xl mb-5 mt-2 py-2 px-2 gap-4">
                              
                        <div className="w-1/2 p-2 gap-2">
                              <div className="w-full flex items-center gap-2">
                                  <Label>Environnement  :</Label> <Label className="font-semibold text-sm">
                                    <h1 className="text-sm font-semibold">{Envs.typenv}</h1>
                                  </Label>
                              </div> 
                              <div className="w-full flex items-center gap-2">
                                  <Label>Application  :</Label> <Label className="font-semibold text-sm">
                                    <h1 className="text-sm font-semibold">{Envs.appli}</h1>
                                  </Label>
                              </div> 
                              <div className="w-full flex items-center gap-2">
                              <Label>Version Harp  :</Label> <Label className="font-semibold text-sm">
                              <h1 className="text-sm font-semibold">{Envs.harprelease}</h1>
                              </Label>
                              </div>
                            
                              <div className="w-full flex items-center gap-2">
                              <Label>Istance Oracle  :</Label> <Label className="font-semibold text-sm">{Envs.oracle_sid}</Label>
                              </div>
                              <div className="w-full flex items-center gap-2">
                              <Label>Alias SQL *Net  :</Label> <Label className="font-semibold text-sm">{Envs.aliasql}</Label>
                              </div>
                              <div className="w-full flex items-center gap-2">
                              <Label>Schema Owner  :</Label> <Label className="font-semibold text-sm">{Envs.oraschema}</Label>
                              </div>
                              <div className="w-full flex items-center gap-2">
                             pr {/* <Label>Version Oracle  :</Label> <Label className="font-semibold text-sm">{OraInfos?.psadm_oracle.orarelease}</Label> */}
                              </div> 
                              <div className="w-full flex items-center gap-2">
                                      <Label>PeopleSoft User  :</Label> <Label className="font-semibold text-sm">{dbServers?.psadm_srv.psuser} </Label>
                              </div>
                              <div className="w-full flex items-center gap-2">
                              <Label>PeopleSoft  :</Label> <Label className="font-semibold text-sm">{Envs.psversion}</Label>
                              </div>
                              <div className="w-full flex items-center gap-2">
                              <Label>PeopleTools  :</Label> <Label className="font-semibold text-sm">{Envs.ptversion}</Label>
                              </div>
                        </div>
                                  
                        <div className="w-1/2 gap-4 p-2 h-[auto]">
                           
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
                            <div className="flex gap-4 items-center">
                                  <Label>password FT_EXPLOIT</Label><Label className="text-red-600 font-semibold text-sm "> 
                                        { enfInfos?.pswd_ft_exploit === null ? "" : "Clique ici pour copier le mot de passe"}
                                  </Label>
                                  { enfInfos?.pswd_ft_exploit === null ? "" :  
                                    <Button 
                                        // onClick={() => navigator.clipboard.writeText(enfInfos.pswd_ft_exploit)} 
                                        >
                                        Copier le mot de passe
                                    </Button>
                                  }
                            </div>
                            <div className="flex gap-4 items-center">
                                 {/**  href={`ssh://hubert@${item.psadm_srv.ip}:22`}  dbServers  */}
                               <Label>Sudo Sudoer :</Label> <Label className='bg-harpOrange text-white rounded-lg'>
                                  <Link href={`ssh://hubert@192.168.1.49:22`}> 
                                  {enfInfos?.userunx}</Link>
                            </Label> <Badge variant="destructive">{enfInfos?.userunx}</Badge>
                            </div>
                            <div className="w-full flex items-center gap-2">
                                    <Label>DB serve  :</Label> <Label className="font-semibold text-sm">{dbServers?.psadm_srv.ip}</Label>
                            </div>
                            <div className="w-full flex items-center gap-2">
                                    <Label>DB serve  :</Label> <Label className="font-semibold text-sm justify-center">{dbServers?.psadm_srv.pshome}/HARP_FILES </Label>
                            </div>
                            {/* <div className="w-full flex items-center gap-2">
                                    <Label>Psoft User  :</Label> <Label className="font-semibold text-sm">{dbServers?.psadm_srv.psuser} </Label>
                            </div> */}

                              <div className="w-full flex items-center gap-2">
                                    <Label>Message  :</Label> <Label className="font-semibold text-sm">{Envs.msg}</Label>
                              </div>
                              <div className="w-full flex items-center gap-2">
                              <Label>Version Cobol  :</Label> <Label className="font-semibold text-sm">{Envs.volum}</Label>
                              </div>
                        </div>
                </div>

            </div>
        {/** BOTTOM */}

           <h1 className="text-xl font-semibold mb-4">Roles de serveurs de l'environnement  {env}</h1>
            <div className="w-full flex gap-5">
                 <div >
                    {/* <h1 className="text-xl font-semibold mb-4">Roles de serveurs de l'environnement  {env}</h1> */}
                    <EnvServRoles id={Envs.id}/>
                 </div>
                 <div >
                    <div className="flex gap-4"><p>Dernière requete SQL domaine AS: </p><h2 className='text-sm font-semibold'>{new Intl.DateTimeFormat("fr-FR", {dateStyle: 'short', timeStyle: 'short',}).format(envMonitor?.lastasdt )}</h2></div>
                    <div className="flex gap-4"><p>Dernier Heartbeat PRCS UNIX: </p><h2 className='text-sm font-semibold'>{new Intl.DateTimeFormat("fr-FR", {dateStyle: 'short', timeStyle: 'short',}).format(envMonitor?.lastprcsunxdt)}</h2> </div>
                    <div className="flex gap-4">
                       <p>Dernière Connexion : </p> <h2 className='text-sm font-semibold'>{envMonitor?.lastlogin}</h2><p>à</p>    
                       <h2 className='text-sm font-semibold'> {new Intl.DateTimeFormat("fr-FR", {dateStyle: 'short', timeStyle: 'short',}).format(envMonitor?.lastlogindt )} </h2>
                      
                    </div>
               </div>

          </div>
      </div>


      {/* <div className="p-4">
            <div className="space-y-4">
                {serverRoles.map((role) => (
                    <div key={`${role.srv}-${role.typsrv}`} className="border p-4 rounded-lg">
                        <h2 className="font-medium">Serveur: {role.srv}</h2>
                        <p>Type: {role.typsrv}</p>
                        <p>IP: {role.psadm_srv.ip}</p>
                        <p>PS Home: {role.psadm_srv.pshome}</p>
                        <p>OS: {role.psadm_srv.os}</p>
                        <p>Status: {role.status}</p>
                    </div>
                ))}
            </div>
      </div> */}

      {/* </div> */}

    </div>
  )
}


export default EnvSinglePage;



