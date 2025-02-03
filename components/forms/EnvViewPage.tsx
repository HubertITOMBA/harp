 

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


interface EnvInfoProps {
  env : string;
};

 // const EnvSinglePage = async ({ params }: { params: { env: string } }) => {
 
  const EnvSinglePage = async ({ params }: { params: { env: string } }) => {
  
 //const EnvSinglePage = async ({ params: { env },}: { params: { env: string }; }) => {
  
  // const EnvSinglePage = async ({ env }: EnvInfoProps) => {
   
  // const Envs :
  // | ( psadm_env & {
  //    _count: { psadm_rolesrv : number; psadm_release: number};
  //   })
  // | null = await prisma.psadm_env.findUnique({
  //     where: { env },
  //       include: {
  //         _count: {
  //           select: {
  //             //psadm_envinfo: true,
  //             psadm_rolesrv : true,    
  //            // psadm_oracle : true,
  //             psadm_dispo: true,
  //             //psadm_typenv: true,
  //            // psadm_release: true,  
  //           //  psadm_ptools: true,   
  //           //  psadm_appli: true,
  //           },
  //         },
  //       },
  //    }); 
  
  const envParam = await params.env;

  const Envs  = await prisma.psadm_env.findUnique({
      where: { env: envParam },
        include: {
          _count: {
            select: {
              //psadm_envinfo: true,
              psadm_rolesrv : true,    
             // psadm_oracle : true,
              psadm_dispo: true,
              //psadm_typenv: true,
             // psadm_release: true,  
            //  psadm_ptools: true,   
            //  psadm_appli: true,
            },
          },
        },
     });  

     if (!Envs) {
      return notFound();
    } 

     
     const enfInfos = await prisma.psadm_envinfo.findUnique({ where: { env: envParam } });  
      
        
      const OraInfos = await prisma.psadm_env.findUnique({
        where: {
          env: envParam
        },
        select: {
          env: true,
          site: true,
          oracle_sid: true,
          psadm_oracle: {
            select: {
              aliasql: true,
              orarelease: true
            }
          }
        }
      }); 


      // const dbServers = await prisma.psadm_rolesrv.findUnique({
      //   where: {
      //     typsrv: "DB",
      //     env: env,
      //     psadm_srv: {
      //       srv: {
      //         equals: prisma.psadm_rolesrv.srv
      //       }
      //     }
      //   },
      //   include: {
      //     psadm_srv: true
      //   }
      // });

      
        const dbServers = await prisma.psadm_rolesrv.findFirst({
          where: {
              typsrv: "DB",
              env: envParam,
              srv: {
                  equals: prisma.psadm_srv.srv // Note: ceci ne fonctionnera pas comme prévu
              }
          },
          select: {
              srv: true,
              env: true,
              typsrv: true,
              psadm_srv: {
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
          env: envParam
        },
        include: {
            psadm_srv: true,
            psadm_typsrv: true
        }
    }); 



  return (
    <div className="container p-2 gap-4 xl:flex-row w-full">
       {/* <h1 className="text-xl font-semibold">Créer un nouvel environnement</h1>
       <p>{EnvHarp?.env} </p>
       {EnvHarp?.harprelease}    */}
       {/* <HarpEnvPage typenvid={params.id}/> */}

        
            <div className="flex bg-white rounded-xl shadow-xl p-2 mt-0 gap-4  items-center relative w-full mb-5">
                  <Image src={`/ressources/ouvert.png`} alt="" width={40} height={40} />
                    <Link href={Envs.url}>
                        <h1 className="text-3xl font-semibold">{Envs.env}</h1>
                    </Link>
                  
                  { Envs.anonym ==="N" ? "" : <Image src="/ressources/anonym.png" alt="" width={40} height={40} className="" />}
                  { Envs.edi ==="N" ? "" : <Image src="/ressources/edi.png" alt="" width={200} height={40} className="items-end bg-transparent" />}
                  <h2 className="text-xl font-semibold">{Envs.descr} </h2> 
            </div>





       
        <div className="flex-2 w-ful">
            <div className=" flex gap-4">
              {/** TOP */}
                <div className="w-1/2 bg-white rounded-xl shadow-xl mb-5 mt-2 py-2 px-2  flex-1 flex gap-4">
                              
                    <div className="w-1/2 flex flex-col gap-4">

                        {/* <div className="flex bg-white rounded-xl shadow-xl p-2 mt-0 gap-4 w-full justify-center">
                            <Image src={`/ressources/ouvert.png`} alt="" width={40} height={40} />
                              <Link href={Envs.url}>
                                  <h1 className="text-3xl font-semibold">{Envs.env}</h1>
                             </Link>
                            
                            { Envs.anonym ==="N" ? "" : <Image src="/ressources/anonym.png" alt="" width={40} height={40} className="" />}
                            { Envs.edi ==="N" ? "" : <Image src="/ressources/edi.png" alt="" width={200} height={40} className="items-end bg-transparent" />}
                            <h1 className="text-3xl font-semibold">{Envs.typenv}</h1>
                        </div> */}
                       
                        <div className="w-1/2 flex flex-col gap-4 bg-white p-2 h-[auto]">
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
                             <Label>Version Oracle  :</Label> <Label className="font-semibold text-sm">{OraInfos?.psadm_oracle.orarelease}</Label>
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
                            {/* <div className="w-full flex items-center gap-2">
                             <Label>Site  :</Label> <Label className="font-semibold text-sm">{Envs.site}</Label>
                            </div> */}
                            {/* <div className="w-full flex items-center gap-2">
                             <Label>Version Cobol  :</Label> <Label className="font-semibold text-sm">{Envs.volum}</Label>
                            </div>
                            <div className="w-full flex items-center gap-2">
                             <Label>Url  :</Label> <Label className="font-semibold text-sm">{Envs.url}</Label>
                            </div> */}
                        </div>
                    </div>
                               
                  <div className="w-1/2 flex flex-col gap-4 bg-white p-2 h-[auto]">
                    {/* <h2 className="text-3xl font-semibold bg-white rounded-xl shadow-xl w-full p-2 mb-5">{Envs.descr} </h2>  */}

                    {/*
                        <div className="w-full flex items-center gap-2">
                          <Label>Version Cobol  :</Label> <Label className="font-semibold text-sm">{Envs.typenv}</Label>
                        </div>
                        <div className="w-full flex items-center gap-2">
                        <Label>Version Cobol  :</Label> <Label className="font-semibold text-sm">{Envs.volum}</Label>
                        </div>
                        <div className="w-full flex items-center gap-2">
                        <Label>Version Cobol  :</Label> <Label className="font-semibold text-sm">{Envs.volum}</Label>
                        </div>

                         <EnvInfos env={Envs.env} srv=""/>  
                     */}

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
           </Label>
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
        {/* <div className="w-full flex items-center gap-2">
          <Label>Url  :</Label> <Link href={Envs.url}><Label className="font-semibold text-sm">{Envs.url}</Label>  </Link>
        </div> */}


              </div>


             </div>

            </div>
        {/** BOTTOM */}
            <div className="w-full">
              <h1 className="text-xl font-semibold mb-4">Roles de serveurs de l'environnement  {envParam}</h1>
              <EnvServRoles env={Envs.env}/>
          </div>
      </div>


      <div className="p-4">
           {/* <h1 className="text-xl font-semibold mb-4">Détails de l'environnement {params.env}</h1> */}
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
        </div>



    </div>
  )
}


export default EnvSinglePage;



