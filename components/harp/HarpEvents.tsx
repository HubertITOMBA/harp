
//import EnvCard from '@/components/harp/EnvCard'
import { Prisma, harpevent, psadm_env, psadm_envinfo, psadm_logo, psadm_oracle, psadm_rolesrv, psadm_roleuser, psadm_srv, psadm_statenv, psadm_typenv } from "@prisma/client";
import prisma from "@/lib/prisma";
import { db } from "@/lib/db";
import Pagination from '@/components/harp/Pagination';
import TableSearch from '@/components/harp/TableSearch';
import { ITEM_PER_PAGE } from "@/lib/settings";
import { Card, CardContent, CardHeader, CardFooter  } from "@/components/ui/card"
import Image from "next/image"
import Link from "next/link";


const HarpEventPage =  async () => {

  
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
        
      <div className="container w-full">
       
      
      
          { DescEnvts.map((harpevent) => (
                <Card className="w-full mb-3 bg-white shadow-xl justify-between hover:bg-orange-100" key={harpevent.id}>
                    <CardHeader className="mt-2 flex ml-3 items-center  gap-8 relative ">
                        
                        {/* <Link href= {psadm_env.url} className="text-5xl font-bold">{psadm_env.env} </Link>
                        
                            { psadm_env.anonym ==="N" ? "" : <Image src="/ressources/anonym.png" alt="" width={40} height={40} className="" />}
                              */}
                          <h1 className="ml-0 text-5xl font-bold text-left">{harpevent.name} </h1> 
                            
                              <h1 className="text-right text-5xl font-bold items-center justify-end w-auto">{new Intl.DateTimeFormat("fr-FR", {dateStyle: 'short', timeStyle: 'short',}).format(harpevent.deliveryat)}</h1>
                            
                              {harpevent.status === "AVENIR" ?  
                                  <p className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-red-900 animate-pulse">{harpevent.status}</p>  :
                                  <p className="text-2xl font-extrabold text-black bg-clip-text ">{harpevent.status}</p> 
                                }
                    
                            
                    </CardHeader> 

                      <CardContent className="ml-3 ">
                          <div className="items-center">
                              {/* <div className="mt-2 flex flex-col items-center justify-between gap-8 text-2xl font-bold font-blue-900">
                                {psadm_env.descr} 
                              </div> */}
                              
                                  <div className="basis-1/4">
                                      <p>{harpevent.target}</p><br />
                                      <p>{harpevent.descr}</p><br />
                                      <h2 className="text-red-600 font-semi">CHANGE TECHNIQUE DU MOIS </h2>
                                      <h2 className="text-red-600 font-semi">Livraison en dérogation </h2> 
                                      <h2 className="text-red-600 font-semi">Refresh en cours ou en attente </h2>  
                                      <h2 className=" text-2xl text-blue-600 font-semibold">Et bien d'autres message à mettre en avant </h2>                                 
                                  </div> 
                                
                              

                          </div>             
                      </CardContent>
                </Card>
            ))
           }  


        
            
        
  </div>
    )
  
  }
 export default HarpEventPage 