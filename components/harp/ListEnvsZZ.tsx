
//import EnvCard from '@/components/harp/EnvCard'
import { Prisma, psadm_dispo, psadm_env, psadm_envinfo, psadm_logo, psadm_oracle, psadm_rolesrv, psadm_roleuser, psadm_srv, psadm_statenv, psadm_typenv } from "@prisma/client";
import prisma from "@/lib/prisma";
import { db } from "@/lib/db";
import Pagination from '@/components/harp/Pagination';
import TableSearch from '@/components/harp/TableSearch';
import { ITEM_PER_PAGE } from "@/lib/settings";
import { Card, CardContent, CardHeader, CardFooter  } from "@/components/ui/card"
import Image from "next/image"
import Link from "next/link";
import ServerEnvPage from "@/components/harp/ServerEnv";
import { Label } from "@/components/ui/label"
import { getServeName } from "@/data/user";
import { EnvInfos } from "./EnvInfos";
// import { FormLabel } from "@/components/ui/form";
 

//export const runtime = "edge"; const HarpEnvPage =  async ({params} : { params: { id: Number };}  ) =>

const HarpEnvPage =  async ( {id} : {id: string;} ) => {

 // console.log("PARAMETRES RECUPERES : ", props);


      const pagineur = async ({
        searchParams,
      }: {
        searchParams: { [key: string]: string | undefined };
      }) => {

            const { page, ...queryParams } = searchParams;
            const p = page ? parseInt(page): 1;
          
           // URL PARAMS CONDITION
            const query : Prisma.psadm_envWhereInput ={};
          
           if (queryParams) {
              for (const [key, value] of Object.entries(queryParams)) {
                  if (value !== undefined) {
                    switch (key) {
                        case "rechercher":
                          query.env = {contains:value, lte:"insensitive"};
                        break;
                    default:
                      break; 
                    }
                  }
              }
           }   


      }

      const [data, count] = await prisma.$transaction([
        prisma.psadm_env.findMany({
          // where: query,
          // include: {
          //   subjects: true,
          //   classes: true,
          // },
          take: ITEM_PER_PAGE,
         // skip: ITEM_PER_PAGE * (pagineur.p - 1),
        }),
        prisma.psadm_env.count(),
      ]);  

 
      const DescEnvs = await prisma.psadm_env.findMany(
        {
          //relationLoadStrategy: 'join', // or 'query'
          where: {
              typenvid: parseInt(id),
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
            //  psadm_rolesrv: {
            //   //  select : { 
            //   //     env : true,
            //   //     srv: true,
            //   //     typsrv : true,
            //   //     status : true,
            //   //   },
            //     include: {
            //       psadm_srv:  true,
            //          },   
            // },
             psadm_oracle : true,
             psadm_dispo: { 
                orderBy: {
                  fromdate: 'asc',
              },
              take: 1
            }, 
            psadm_typenv: true,
            psadm_release: true,  
            psadm_ptools: true,   
            psadm_appli: true,
                      
          },
          orderBy: [
            // harprelease: "desc",
            // typenvid: "desc",
            {
            display: "asc",
            },
            { env: "asc",}
          ]
           
      });

      // User netid
     // psadm_user {
        // netid          String           @id @default("") @db.VarChar(32)
        // unxid          String?          @db.VarChar(32)
        // oprid          String?          @db.VarChar(32)
        // nom            String?          @db.VarChar(32)
        // prenom         String?          @db.VarChar(32)
        // mdp            String           @db.VarChar(50)
        // defpage        String?          @db.VarChar(32)
        // pkeyfile       String?          @db.VarChar(50)
        // expunx         DateTime?        @db.DateTime(0)
        // expora         DateTime?        @db.DateTime(0)
        // lastlogin      DateTime?        @db.DateTime(0)
        // email          String?          @db.VarChar(100)
        // psadm_roleuser psadm_roleuser[]
     const userCourent = await prisma.psadm_user.findUnique(
        {
          where : {
            netid : "hitomba",
          }
        }
     ) 


     const serverInfo = await getServeName("fhxdbdx54")
     


    return (
        
      <div className="container w-full">
                <div className="flex flex-row p-2 justify-between items-center bg-yellow-100 hover:bg-orange-100">
                      <div><h1 className="ml-0 text-5xl font-bold text-left">/ {count}</h1></div>
                      {/* <div><TableSearch /></div> */}
                </div>
          <div className="w-full h-auto rounded-3xl"  >

                  {/* <div className="w-full mb-3 bg-white shadow-xl justify-between hover:bg-blue-100" key={props.id}>
                    {props.id}
                    </div> */}
               <p>{userCourent?.netid} {userCourent?.email}</p>
               <p>{new Intl.DateTimeFormat("fr-FR", {dateStyle: 'short', timeStyle: 'short',}).format(userCourent?.lastlogin)}</p>
               <p>{userCourent?.pkeyfile}</p>
          
              { DescEnvs.map((psadm_env) => (
                <div className="w-full mb-3 bg-white shadow-xl justify-between hover:bg-orange-100" key={psadm_env.env}>
                    <div className="mt-2 flex ml-3 items-center  gap-8 relative ">  

                  
                          <Image src={`/ressources/${psadm_env.statutenv.icone}`} alt="" width={40} height={40} className=""/>
                          {/* <h1>/ressources/{psadm_env.statutenv.icone}</h1> */}

                         


                    {/* href={`/harp/envs/${i.display}`}  rc="/ressources//${psadm_env.statutenv.icone}"  {psadm_env.url}    */}
                    
                  
                        <Link href={psadm_env.url}   className="text-5xl font-bold">{psadm_env.env} </Link>
                            {psadm_env.statutenv.icone} 
                            { psadm_env.anonym ==="N" ? "" : <Image src="/ressources/anonym.png" alt="" width={40} height={40} className="" />}
                              
                          <h1 className="text-2xl font-bold items-center justify-center">{psadm_env.descr} </h1> 
                            
                              <h1 className="text-right text-5xl font-bold items-center justify-end w-auto"></h1>
                              { psadm_env.edi ==="N" ? "" : <Image src="/ressources/edi.png" alt="" width={150} height={50} className="items-end bg-transparent" />}
                    </div> 
                      <div className="ml-3 ">
                          <div className="items-center">
                              {/* <div className="mt-2 flex flex-col items-center justify-between gap-8 text-2xl font-bold font-blue-900">
                                {psadm_env.descr} 
                              </div> */}
                              <div className="flex flex-row">
                                
                                  <div className="basis-1/4">
                                  
                                  <Label>Version Harp</Label> {psadm_env.harprelease}  
                                 
                                      <p>{psadm_env.typenv}</p><br />
                                      <p>{psadm_env.oracle_sid}</p><br />
                                      <p>{psadm_env.aliasql}</p><br />
                                      <p>{psadm_env.oraschema}</p><br />
                                      <p>{userCourent?.pkeyfile}</p>
                                      <p>{serverInfo?.srv} {serverInfo?.ip} {serverInfo?.psuser} {serverInfo?.os} {serverInfo?.pshome} {serverInfo?.domain}</p>
                                      <h2 className="text-red-600 font-semi">ORACLE </h2>
                                      <p>{psadm_env.appli}</p> <br />

                                      <Label>Instance Oracle </Label><p> {psadm_env.psadm_oracle.oracle_sid} - {psadm_env.psadm_oracle.orarelease}</p>
                                      <Label>Alias SQL *Net / Schéma </Label><p>{psadm_env.psadm_oracle.aliasql}</p>
                                        <p> {psadm_env.psadm_oracle.oraschema}</p>                                 
                                  </div> 
                                  <div className="basis-3/4">
                                
                                  <Label>Version PSoft</Label><p className="font-semibold text-sm">{psadm_env.psversion} / {psadm_env.ptversion} </p><br />
                                    {/* <p className="font-bold">{psadm_env.harprelease} </p><br /> */}
                                    <Label>Version Cobol</Label>  <p className="font-semibold text-sm"> {psadm_env.volum} </p><br />
                                  <p className="font-bold"> {psadm_env.edi}</p>
                                    
                                
                                    DETAILS
                                  
                                        {psadm_env.psadm_dispo.map((psadm_dispo) =>(
                                        <div key={psadm_dispo.env} >
                                          <p className="font-semibold text-sm">{psadm_dispo.env}</p>
                                          <p className="font-semibold text-sm"> {psadm_dispo.statenv} </p>
                                          <p className="font-semibold text-sm">{new Intl.DateTimeFormat("fr-FR", {dateStyle: 'short', timeStyle: 'short',}).format(psadm_dispo.fromdate)}    </p>
                                          <p className="font-semibold text-sm">{psadm_dispo.msg}</p> 
                                        </div>
                                        ))}

                                        <EnvInfos env={psadm_env.env} srv=""/>      
                                                                          
                                  </div>
                                  {/* <div  className="basis-2/4"><ServerEnvPage qlenv={psadm_env.env} /></div> */}
                              
                              </div>
                          </div>             
                      </div>
                      </div>
                ))
              }  
              
      
          </div>
      </div>
    )
  
  }
 export default HarpEnvPage 