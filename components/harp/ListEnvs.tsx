
//import EnvCard from '@/components/harp/EnvCard'
import { Prisma, psadm_dispo, psadm_env, psadm_envinfo, psadm_logo, psadm_oracle, psadm_rolesrv, psadm_roleuser, psadm_srv, psadm_statenv, psadm_typenv } from "@prisma/client";
import prisma from "@/lib/prisma";
import { db } from "@/lib/db";
import Pagination from '@/components/harp/Pagination';
import TableSearch from '@/components/harp/TableSearch';
import { ITEM_PER_PAGE } from "@/lib/settings";
// import { Card, CardContent, CardHeader, CardFooter  } from "@/components/ui/card"
import Image from "next/image"
import Link from "next/link";
import ServerEnvPage from "@/components/harp/ServerEnv";
import { Label } from "@/components/ui/label"
import { getServeName } from "@/data/user";
import { EnvInfos } from "./EnvInfos";
import LancerApplis from "./LanceAppli";
//import { useState } from "react";
// import { FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input"
 

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { Button } from "@/components/ui/button";
import EnvServRoles from "./EnvServRoles";


interface EnvInfoProps {
  typenvid : number ;
};

//export const runtime = "edge"; const HarpEnvPage =  async ({params} : { params: { id: Number };}  ) =>    <Link href={`/list/envs/${base.env}`}>
const HarpEnvPage = async ({ typenvid }: EnvInfoProps) => {
// const HarpEnvPage =  async ({params} : { params: { id: string };}  ) => {
// const HarpEnvPage =  async ( {id} : {id: string;} ) => {
 
      const DescEnvs = await prisma.psadm_env.findMany(
        {
          where: {
              typenvid: typenvid,
            },
            include: {
              statutenv:{
                select : { 
                   id : true,
                   statenv : true,
                   icone : true,
                 }
             }, 
             psadm_rolesrv : true,    
             psadm_oracle : true,
             psadm_dispo: { 
                orderBy: {
                  fromdate: 'desc',
              },
              take: 1
            }, 
            psadm_typenv: true,
            psadm_release: true,  
            psadm_ptools: true,   
            psadm_appli: true,
                      
          },
          orderBy: [
            {
            display: "asc",
            },
            { env: "asc",}
          ]
         
      });  


    const count = await prisma.psadm_env.count(); 

    const envCount = await prisma.psadm_env.count({
      where: {
        typenvid: typenvid
      }
    });
    


         const userCourent = await prisma.psadm_user.findUnique(
        {
          where : {
            netid : "hitomba",
          }
        }
     ) 


     const serverInfo = await getServeName("fhxdbdx54")
     
   
    
    // const handleClick = () => {
    //   window.location.href = "ssh://hubert@192.168.1.49";
    // };





    return (
      <div className="container w-full bg-transarent">
                <div className="flex flex-row p-2 justify-between items-center bg-yellow-100 hover:bg-orange-100">
                      <div><h1 className="ml-0 text-5xl font-bold text-left">{ envCount } - {count}   </h1></div>
                </div>
          <div className="w-full h-auto rounded-3xl"  >

                  {/* <div className="w-full mb-3 bg-white shadow-xl justify-between hover:bg-blue-100" key={props.id}>
                    {props.id}
                    </div> */}
               <p>{userCourent?.netid} {userCourent?.email}</p>
               <p>{new Intl.DateTimeFormat("fr-FR", {dateStyle: 'short', timeStyle: 'medium',}).format(userCourent?.lastlogin )}</p>
               <p>{userCourent?.pkeyfile}</p>
          
              


            { DescEnvs.map((psadm_env) => (
                  <div className="h-auto w-full mb-3 bg-white rounded-xl shadow-xl justify-between hover:bg-orange-100 p-2 gapx-10" key={psadm_env.env}>
                      <div className="mt-1 flex ml-3 items-center  gap-8 relative ">  
                            <Image src={`/ressources/${psadm_env.statutenv.icone}`} alt="" width={40} height={40} className=""/>
                            <Link href={psadm_env.url}   className="text-3xl font-semibold">{psadm_env.env} </Link>
                              {psadm_env.statutenv.icone} 
                              { psadm_env.anonym ==="N" ? "" : <Image src="/ressources/anonym.png" alt="" width={40} height={40} className="" />}
                              <h1 className="text-xl font-semibold items-center justify-center">{psadm_env.descr} </h1> 
                              <h1 className="text-right text-5xl font-bold. items-center justify-end w-auto"></h1>
                              { psadm_env.edi ==="N" ? "" : <Image src="/ressources/edi.png" alt="" width={150} height={50} className="items-end bg-transparent" />}
                      </div> 
                    
                      <Tabs defaultValue="environment" className="w-full ">
                        <TabsList className="grid w-full grid-cols-3 hover:bg-orange-100">
                          <TabsTrigger 
                              value="environment" 
                              className="rounded-md py-2 transition-colors hover:bg-harpOrange hover:text-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                             >Environnement
                          </TabsTrigger>
                          <TabsTrigger 
                                value="bases"
                                className="rounded-md py-2 transition-colors hover:bg-harpOrange hover:text-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                                >Oracle
                          </TabsTrigger>
                          <TabsTrigger 
                                value="serveurs"
                                className="rounded-md py-2 transition-colors hover:bg-harpOrange hover:text-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                                >Serveurs
                          </TabsTrigger>
                        </TabsList>
                        <TabsContent value="environment">
                          {/* <Card>
                               <CardHeader>
                                <CardTitle>Environnement</CardTitle>
                                <CardDescription>
                                  Make changes to your account here. Click save when you're done.
                                </CardDescription>
                              </CardHeader>  
                              <CardContent className="space-y-2">  */}
                                  <div className="ml-2 ">
                                      <div className="flex flex-row">
                                          <div className="basis-1/2"> 
                                          
                                              <div className="flex gap-4 items-center">
                                                  <Label>Version Harp :</Label><Label className="font-semibold text-sm mt-1">{psadm_env.appli}</Label>  
                                              </div> 
                                              <div className="flex gap-4 items-center">
                                                  <Label>Type :</Label><Label className="font-semibold text-sm mt-1">{psadm_env.typenv}</Label>  
                                              </div>   
                                              <div className="flex gap-4 items-center">
                                                <Label>Version Harp :</Label><Label className="font-semibold text-sm mt-1"><Link href=""> {psadm_env.harprelease}</Link></Label>  
                                              </div> 
                                              <div className="flex gap-4 items-center">
                                                <Label>Instance Oracle :</Label><Label className="font-semibold text-sm mt-1">{psadm_env.oracle_sid}</Label>  
                                              </div> 
                                              <div className="flex gap-4 items-center">
                                                <Label>Alias SQL*Net :</Label><Label className="font-semibold text-sm mt-1"><Link href=""> {psadm_env.aliasql}</Link></Label>  
                                              </div> 
                                              <div className="flex gap-4 items-center">
                                                  <Label>Schéma Oracle : </Label><Label  className="font-semibold text-sm mt-1"><Link href="">  {psadm_env.psadm_oracle.oraschema}</Link></Label>  
                                              </div>                               
                                              <div className="flex gap-4 items-center">
                                                      <Label>Version PSoft :</Label><Label className="font-semibold text-sm"><Link href=""> {psadm_env.psversion}</Link>  </Label>
                                              </div>
                                              <div className="flex gap-4 items-center">
                                                      <Label>Version PTools :</Label><Label className="font-semibold text-sm"><Link href=""> {psadm_env.ptversion}</Link> </Label>
                                              </div>
                                              <div className="flex gap-2 items-center">  
                                                  <Label>Version Cobol :</Label>  <p className="font-semibold text-sm"> {psadm_env.volum} </p><br />
                                              </div>
                                          </div>       
                                          <LancerApplis />
                                      </div>             
                                  </div>
                              {/* </CardContent>
                              <CardFooter>
                                <Button>Save changes</Button>
                              </CardFooter>
                        </Card> */}
                        </TabsContent>
                        <TabsContent value="bases">
                          <Card>
                            <CardHeader>
                              <CardTitle>Password</CardTitle>
                              {/* <CardDescription>
                                Change your password here. After saving, you'll be logged out.
                              </CardDescription>*/}
                            </CardHeader> 
                            <CardContent className="space-y-2">
                              <div className="basis-1/2">                         
                                <EnvInfos env={psadm_env.env} srv=""/>        
                              </div> 
                            </CardContent>
                            <CardFooter>
                              <Button>Save password</Button>
                            </CardFooter>
                          </Card>
                        </TabsContent>
                        <TabsContent value="serveurs">
                         {/* <Card>
                            <CardHeader>
                               <CardTitle>Password</CardTitle> */}
                              {/* <CardDescription>
                                Change your password here. After saving, you'll be logged out.
                              </CardDescription>
                            </CardHeader>
                            <CardContent className="space-x-1"> */}
                                  <EnvServRoles env={psadm_env.env}/>
                            {/*</CardContent>
                             <CardFooter>
                              <Button>Save password</Button>
                            </CardFooter> 
                          </Card>*/}
                        </TabsContent>
                      </Tabs>
                  </div> 
                                            
                           
                          
            ))}  
           </div>
      </div>
    )

  
  }
 export default HarpEnvPage 