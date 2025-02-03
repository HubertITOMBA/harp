 

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


  
 const UserSinglePage = async ({ params }: { params: { netid: string } }) => {
 
  const { netid } = await params;

  const Users  = await prisma.psadm_user.findUnique({
      where: { netid: netid },
       
     });  

     if (!Users) {
      return notFound();
    } 
    const UserRoles = await prisma.psadm_roleuser.findMany({
      where: {
        netid: netid,
       },
     }); 

     const concatenatedRoles = UserRoles.map(role => `"${role.role}"`).join(', ');

     
   //  const enfInfos = await prisma.psadm_envinfo.findUnique({ where: { env: env } });  
      
        
      // const OraInfos = await prisma.psadm_env.findUnique({
      //   where: {
      //     env: env
      //   },
      //   select: {
      //     env: true,
      //     site: true,
      //     oracle_sid: true,
      //     psadm_oracle: {
      //       select: {
      //         aliasql: true,
      //         orarelease: true
      //       }
      //     }
      //   }
      // }); 

      
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

        
            <div className="flex bg-white rounded-xl shadow-xl p-2 mt-0 gap-4  justify-left relative w-full mb-5">
                  <Image src={`/ressources/avatar.png`} alt="" width={40} height={40} className="rounded-full"/>
                    <Link href={Users.netid}>
                        <h1 className="mt-2 text-3xl font-semibold uppercase">{Users.netid}</h1>
                    </Link>
                  
                 <h2 className="text-2xl font-semibold mt-3">{Users.prenom} </h2> 
                 <h2 className="text-2xl font-semibold mt-3">{Users.nom} </h2> 
            </div>





       
        <div className="flex-2  w-ful">
            <div className="flex flex-col gap-4">
              {/** TOP */}
                <div className="flex bg-white rounded-xl shadow-xl mb-5 mt-2 py-2 px-2 gap-4">
                              
                       <div className="w-1/2 p-4 gap-2">

                            <div className="w-full flex items-center gap-2">
                                <Label className="py-2 whitespace-nowrap text-xl text-gray-500">Email :</Label><Label className="whitespace-nowrap text-2xl text-gray-900">{Users.email}  </Label>  
                            </div>

                            <div className="w-full flex items-center gap-2">
                                  <Label className="py-2 whitespace-nowrap text-xl text-gray-500">Clé SSH  :</Label> 
                                  <Label className="py-2 whitespace-nowrap text-2xl text-gray-900">{Users.pkeyfile}</Label>
                            </div> 
                            <div className="w-full flex items-center gap-2">
                              <Label className="py-2 whitespace-nowrap text-xl text-gray-500">Mot de passe   :</Label> <Label className="whitespace-nowrap text-2xl text-gray-900">
                                 {Users.mdp} 
                              </Label>
                             
                              <button type="submit" className="px-2 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                                Modifier
                              </button>

                            </div>

                            <div className="flex gap-4 items-center">
                              <Label className="py-2 whitespace-nowrap text-xl text-gray-500">Dernière connexion :</Label><Label className="whitespace-nowrap text-2xl text-gray-900">{new Intl.DateTimeFormat("fr-FR", {dateStyle: 'short', timeStyle: 'short',}).format(Users.lastlogin)}</Label>  
                            </div>

                            <div className="flex gap-4 items-center">
                                 <Label className="py-2 whitespace-nowrap text-xl text-gray-500">OprId :</Label><Label className="whitespace-nowrap text-2xl text-gray-900">{Users.oprid}</Label>  
                            </div>

                            <div className="flex gap-4 items-center">
                                <Label className="py-2 whitespace-nowrap text-xl text-gray-500">Compte unix :</Label><Label className="whitespace-nowrap text-2xl text-gray-900">{Users.unxid}</Label>
                            </div>
                            <div className="flex gap-4 items-center">
                              <Label className="py-2 whitespace-nowrap text-xl text-gray-500">Compte unix Expiration :</Label><Label className="whitespace-nowrap text-2xl text-gray-900">{new Intl.DateTimeFormat("fr-FR", {dateStyle: 'short', timeStyle: 'short',}).format(Users.expunx)}</Label>  
                            </div>  

                            <div className="flex gap-4 items-center">
                              <Label className="py-2 whitespace-nowrap text-xl text-gray-500">Autorisé à :</Label><Label className="whitespace-nowrap text-2xl text-gray-900">{concatenatedRoles}</Label>  
                            </div>
                            
                       </div>
                                  
                     
                            
                            
                      
                </div>

            </div>
        {/** BOTTOM */}

           <h1 className="text-xl font-semibold mb-4">Roles de <span className='uppercase'>{netid}</span> </h1>
            <div className="w-full flex gap-5">
                 <div >
                    {/* <h1 className="text-xl font-semibold mb-4">Roles de serveurs de l'environnement  {env}</h1> */}
                    
                     <div className="w-auto bg-white rounded-xl shadow-xl overflow-hidden">
                                                  
                                                  <table className="min-w-full divide-y divide-gray-200">
                                                    <thead className="bg-gray-50 ">
                                                      <tr className="bg-harpOrange text-white">
                                                        <th className="px-2 py-2 text-left text-xl font-semibold text-white">Rôle</th>
                                                        <th className="px-2 py-2 text-left text-xl font-semibold text-white">Role</th>
                                                        <th className="px-2 py-2 text-left text-xl font-semibold text-white">Mis à jour</th>
                                                        <th className="px-2 py-2 text-left text-xl font-semibold text-white"></th>
                                                      </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-200 bg-white">
                                                      {UserRoles.map((item, index) => (
                                                        <tr key={index} className="hover:bg-harpSkyLight transition-colors duration-200">
                                                          <td className="px-2 py-2 whitespace-nowrap text-xl text-gray-900">{item.role}</td>
                                                          <td className="px-2 py-2 whitespace-nowrap text-xl text-gray-900">{item.rolep}</td>
                                                          <td className="px-2 py-2 whitespace-nowrap text-xl text-gray-900">
                                                                 {new Intl.DateTimeFormat("fr-FR", {dateStyle: 'short', timeStyle: 'short',}).format(item.datmaj)} 
                                                          </td>
                                                          <td> 
                                                            <div className="gap-4">
                                                              <button type="submit" className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600">
                                                                Modifier
                                                              </button>
                                                              <button type="submit" className="px-2 py-1 bg-green-500 text-white rounded hover:bg-blue-600">
                                                                Ajouter
                                                              </button>
                                                              <button type="submit" className="px-2 py-1 bg-red-500 text-white rounded hover:bg-blue-600">
                                                                Supprimer
                                                              </button>
                                                              </div>
                                                          </td>
                                                        </tr>
                                                      ))}
                                                    </tbody>
                                                    
                                                  </table>
                                           </div>



                 </div>
                 <div >
                    {/* <div className="flex gap-4"><p>Dernière requete SQL domaine AS: </p><h2 className='text-sm font-semibold'>{new Intl.DateTimeFormat("fr-FR", {dateStyle: 'short', timeStyle: 'short',}).format(envMonitor?.lastasdt )}</h2></div>
                    <div className="flex gap-4"><p>Dernier Heartbeat PRCS UNIX: </p><h2 className='text-sm font-semibold'>{new Intl.DateTimeFormat("fr-FR", {dateStyle: 'short', timeStyle: 'short',}).format(envMonitor?.lastprcsunxdt)}</h2> </div>
                    <div className="flex gap-4">
                       <p>Dernière Connexion : </p> <h2 className='text-sm font-semibold'>{envMonitor?.lastlogin}</h2><p>à</p>    
                       <h2 className='text-sm font-semibold'> {new Intl.DateTimeFormat("fr-FR", {dateStyle: 'short', timeStyle: 'short',}).format(envMonitor?.lastlogindt )} </h2>
                      
                    </div> */}
               </div>

          </div>
      </div>


      

    </div>
  )
}


export default UserSinglePage;



