 

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import prisma from "@/lib/prisma";
import HarpEnvPage from '@/components/harp/ListEnvs';
import FormModal from '@/components/harp/FormModal';
import { notFound } from 'next/navigation';
import { Prisma, psadm_env } from '@prisma/client';
import EnvServRoles from '@/components/harp/EnvServRoles';
import { EnvInfos } from '@/components/harp/EnvInfos';
import { Label } from "@/components/ui/label";
import { Button } from '@/components/ui/button';
import { ServerConnectionButtons } from '@/components/ui/server-connection-buttons';

  
const ServSinglePage = async ({ params }: { params: { srv: string } }) => {
    
 
  const { srv } = await params;

  const Servs  = await prisma.psadm_srv.findUnique({
      where: { srv: srv },
       });  

     if (!Servs) {
      return notFound();
    } 

    
    const query : Prisma.psadm_rolesrvWhereInput ={};
    
    const ServRoles = await prisma.psadm_rolesrv.findMany({
      where: {
        srv: srv,
       },
       include : {
        psadm_typsrv: true,
      }
     }); 
     
   const CountServRoles = await prisma.psadm_rolesrv.count({ 
      where: {
        srv: srv,
      }

    });
  
    // select count(srv), typsrv  from psadm_rolesrv where srv="fhxdbpr01" group by typsrv ; 
    const Apps = await prisma.psadm_rolesrv.groupBy({ 
       by: ['typsrv'],
       where: {
        srv: srv,
      },
      _count: {
        srv: true 
      },
      
         
      });     

      const concatenatedApps = Apps.map(typsrv => `"${typsrv.typsrv}"`).join(', ');

      const AppDescr = await prisma.psadm_typsrv.findMany({
        where: {
          typsrv: {
            in: Apps.map(item => item.typsrv)
          }
        },
        select: {
          typsrv: true,
          descr: true
        }
      });


      // const result = await prisma.psadm_rolesrv.groupBy({
      //   by: ['typsrv'],
      //   where: {
      //     srv: srv,
      //    },
      //   _count: {
      //     srv: true
      //   },
      //   include: {
      //     psadm_typsrv: {
      //       select: {
      //         descr: true
      //       }
      //     }
      //   }
      // }); 


      // const result2 = await prisma.psadm_rolesrv.groupBy({
      //   by: ['typsrv'],
      //   where: {
      //     srv: 'fhxdbpr01',
      //   },
      //   _count: {
      //     srv: true
      //   },
      //   select: {
      //     typsrv: true,
      //     _count: true,
      //     psadm_typsrv: {
      //       select: {
      //         descr: true
      //       }
      //     }
      //   }
      // });


  return (
      <div className="container p-2 gap-4 xl:flex-row w-full">
    
        
            <div className="flex bg-card rounded-xl shadow-xl p-2 mt-0 gap-4 relative w-full mb-5">
                  <Image src={`/ressources/ouvert.png`} alt="" width={40} height={40} />
                    <Link href={Servs.srv}>
                        <h1 className="text-3xl font-semibold uppercase">{Servs.srv}</h1>
                    </Link>
                {/*                   
                  { Envs.anonym ==="N" ? "" : <Image src="/ressources/anonym.png" alt="" width={40} height={40} className="" />}
                  { Envs.edi ==="N" ? "" : <Image src="/ressources/edi.png" alt="" width={200} height={40} className="items-end bg-transparent" />}
                  <h2 className="text-xl font-semibold mt-2">{Envs.descr} </h2>  */}
            </div>
       
        <div className="flex-2  w-ful">
            <div className="flex flex-col gap-4">
              {/** TOP */}
                <div className="flex bg-card rounded-xl shadow-xl mb-5 mt-2 py-2 px-2 gap-4">
                              
                       {/* <div className="w-1/2 bg-yellow-400 p-2 gap-2"> */}
                              <div className="w-full flex items-center gap-2">
                                  <Label>Adresse IP  :</Label> <Label className="font-semibold text-sm">
                                    <h1 className="text-sm font-semibold">{Servs.ip}</h1>
                                  </Label>
                              </div> 
                              <div className="w-full flex items-center gap-2">
                                  <Label>Système  :</Label> <Label className="font-semibold text-sm">
                                    <h1 className="text-sm font-semibold">{Servs.os}</h1>
                                  </Label>
                              </div> 
                              <div className="w-full flex items-center gap-2">
                                  <Label>User Psoft  :</Label> <Label className="font-semibold text-sm">
                                  <h1 className="text-sm font-semibold">{Servs.psuser}</h1>
                              </Label>
                              </div>
                            
                              <div className="w-full flex items-center gap-2">
                              <Label>Domaine  :</Label> <Label className="font-semibold text-sm">{Servs.domain}</Label>
                              </div>
                              
                            
                       {/* </div> */}
                </div>
                {/* Boutons de connexion */}
                <div className="flex bg-card rounded-xl shadow-xl mb-5 mt-2 py-4 px-4 gap-4">
                  <div className="w-full">
                    <Label className="text-lg font-semibold mb-3 block">Connexion rapide</Label>
                    <ServerConnectionButtons 
                      ip={Servs.ip}
                      srv={Servs.srv}
                      psuser={Servs.psuser}
                    />
                  </div>
                </div>

            </div>
        {/** BOTTOM */}

       
           <h1 className="text-xl font-semibold mb-4">{CountServRoles} Applications sur {srv}   {concatenatedApps}</h1>
            <div className="w-full flex gap-5">
                 
                       <div className="w-2/3 bg-card rounded-xl shadow-xl overflow-hidden">
                              
                              <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-muted/50">
                                  <tr className="bg-harpOrange text-white">
                                    <th className="px-2 py-2 text-left text-xl font-semibold text-white">Environnement</th>
                                    <th className="px-2 py-2 text-left text-xl font-semibold text-white">Type</th>
                                    <th className="px-2 py-2 text-left text-xl font-semibold text-white">Description</th>
                                    <th className="px-2 py-2 text-left text-xl font-semibold text-white">Status</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-border bg-card">
                                  {ServRoles.map((item, index) => (
                                    <tr key={index} className="hover:bg-harpSkyLight transition-colors duration-200">
                                      <td className="px-2 py-2 whitespace-nowrap text-xl text-foreground">{item.env}</td>
                                      <td className="px-2 py-2 whitespace-nowrap text-xl text-foreground">{item.typsrv}</td>
                                      <td className="px-2 py-2 whitespace-nowrap text-xl text-foreground">{item.psadm_typsrv.descr}</td>
                                      <td className="px-2 py-2 whitespace-nowrap text-xl text-foreground">
                                        {/* {item.status} */}
                                         { item.status === 1 ? 
                                         <Image src="/ressources/OK.png" alt="" width={20} height={20} className="items-end bg-transparent" /> : 
                                         <Image src="/ressources/KO.png" alt="" width={20} height={20} className="items-end bg-transparent" />}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                                
                              </table>
                       </div>

                       <div className="w-1/3 bg-card rounded-xl shadow-xl overflow-hidden">
                              
                              <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-muted/50">
                                  <tr className="bg-harpOrange text-white">
                                    <th className="px-2 py-2 text-left text-xl font-semibold text-white">Application</th>
                                    <th className="px-2 py-2 text-left text-xl font-semibold text-white">Type</th>
                                    <th className="px-2 py-2 text-left text-xl font-semibold text-white">Type</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-border bg-card">
                                  {Apps.map((item, index) => (
                                    <tr key={Apps.typsrv} className="hover:bg-harpSkyLight transition-colors duration-200">
                                      <td className="px-2 py-2 whitespace-nowrap text-xl text-foreground">{item.typsrv}</td>
                                      <td className="px-2 py-2 whitespace-nowrap text-xl text-foreground">{item.typsrv}</td>
                                      <td className="px-2 py-2 whitespace-nowrap text-xl text-foreground">{item._count.srv}</td>
                                    </tr>
                                  ))}
                                </tbody>
                                
                              </table>
                       </div>

                       {/* <div className="bg-white rounded-xl shadow-md overflow-hidden">
                              
                              <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-muted/50">
                                  <tr className="bg-harpOrange text-white">
                                    <th className="px-2 py-2 text-left text-xl font-semibold text-white">Application</th>
                                    <th className="px-2 py-2 text-left text-xl font-semibold text-white">Type</th>
                                    <th className="px-2 py-2 text-left text-xl font-semibold text-white">Type</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-border bg-card">
                                  {AppDescr.map((item, index) => (
                                    <tr key={AppDescr.typsrv} className="hover:bg-harpSkyLight transition-colors duration-200">
                                      <td className="px-2 py-2 whitespace-nowrap text-xl text-foreground">{item.descr}</td>
                                      <td className="px-2 py-2 whitespace-nowrap text-xl text-foreground">{item.typsrv}</td>
                                      <td className="px-2 py-2 whitespace-nowrap text-xl text-foreground">{item.descr}</td>
                                    </tr>
                                  ))}
                                </tbody>
                                
                              </table>
                       </div> */}
                
               </div>

           
      </div>


      

    </div>
  )
}


export default ServSinglePage;



