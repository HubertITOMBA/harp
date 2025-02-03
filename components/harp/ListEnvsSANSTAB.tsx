
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
import LancerApplis from "./LanceAppli";
import EnvServRolesH from "./EnvServRolesH";
// import { useState } from "react";
import { Dialog } from "@/components/ui/dialog"; 
import EnvServRoles from "@/components/harp/EnvServRoles";


//import { useState } from "react";
// import { FormLabel } from "@/components/ui/form";
 

//export const runtime = "edge"; const HarpEnvPage =  async ({params} : { params: { id: Number };}  ) =>

const HarpEnvPage =  async ( {id} : {id: string;} ) => {

 // console.log("PARAMETRES RECUPERES : ", props);

      const pagineur = async ({ 
        searchParams,
      }: {
        searchParams: { [key: string]: string | undefined };
      }) => {

       // const [isDialogOpen, setIsDialogOpen] = useState(false);
       


        // const [loading, setLoading] = useState(false);
        // const [error, setError] = useState<string | null>(null);
        // const [success, setSuccess] = useState<string | null>(null);

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
            // harprelease: "desc",
            // typenvid: "desc",
            {
            display: "asc",
            },
            { env: "asc",}
          ]
           
      });

         const userCourent = await prisma.psadm_user.findUnique(
        {
          where : {
            netid : "hitomba",
          }
        }
     ) 


     const serverInfo = await getServeName("fhxdbdx54")
     
    //  const onSubmit = (values: z.infer<typeof RegisterSchema>) => {
    //         setError("");
    //         setSuccess("");
            
    //         startTransition(() => {
    //            register(values)
    //            .then ((data) => {
    //                 setError(data.error);
    //                 setSuccess(data.success);
    //              });   
    //         }); 

    //         try {
    //           const response = await fetch('/api/harp/partHote', {
    //             method: 'POST',
    //           });
        
    //           if (!response.ok) {
    //             throw new Error('Échec du lancement de Putty');
    //           }
        
    //           const data = await response.json();
    //           // setSuccess(data.message);
    //         } catch (err) {
    //           // setError((err as Error).message);
    //         } finally {
    //           // setLoading(false);
    //         }



    //     };

    
    // const handleClick = () => {
    //   window.location.href = "ssh://hubert@192.168.1.49";
    // };





    return (
        
      <div className="container w-full bg-transarent">
                <div className="flex flex-row p-2 justify-between items-center bg-yellow-100 hover:bg-orange-100">
                      <div><h1 className="ml-0 text-5xl font-bold text-left">/ {count}</h1></div>
                      {/* <div><TableSearch /></div> */}
                </div>
          <div className="w-full h-auto rounded-3xl"  >

                  {/* <div className="w-full mb-3 bg-white shadow-xl justify-between hover:bg-blue-100" key={props.id}>
                    {props.id}
                    </div> */}
               <p>{userCourent?.netid} {userCourent?.email}</p>
               <p>{new Intl.DateTimeFormat("fr-FR", {dateStyle: 'short', timeStyle: 'medium',}).format(userCourent?.lastlogin)}</p>
               <p>{userCourent?.pkeyfile}</p>
          
              { DescEnvs.map((psadm_env) => (
                <div className="w-full mb-3 bg-white rounded-xl shadow-xl justify-between hover:bg-orange-100 p-2 gapx-10" key={psadm_env.env}>
                    <div className="mt-1 flex ml-3 items-center  gap-8 relative ">  

                  
                          <Image src={`/ressources/${psadm_env.statutenv.icone}`} alt="" width={40} height={40} className=""/>
                          {/* <h1>/ressources/{psadm_env.statutenv.icone}</h1> */}

                           {/* <EnvServRolesH env={psadm_env.env}/> */}


                    {/* href={`/harp/envs/${i.display}`}  rc="/ressources//${psadm_env.statutenv.icone}"  {psadm_env.url}    */}
                    
                  
                        <Link href={psadm_env.url}   className="text-3xl font-semibold">{psadm_env.env} </Link>
                            {psadm_env.statutenv.icone} 
                            { psadm_env.anonym ==="N" ? "" : <Image src="/ressources/anonym.png" alt="" width={40} height={40} className="" />}
                              
                          <h1 className="text-xl font-semibold items-center justify-center">{psadm_env.descr} </h1> 
                            
                              <h1 className="text-right text-5xl font-bold items-center justify-end w-auto"></h1>
                              { psadm_env.edi ==="N" ? "" : <Image src="/ressources/edi.png" alt="" width={150} height={50} className="items-end bg-transparent" />}
                    </div> 
                      <div className="ml-2 ">
                          {/* <div className="items-center"> */}
                              {/* <div className="mt-2 flex flex-col items-center justify-between gap-8 text-2xl font-bold font-blue-900">
                                {psadm_env.descr} 
                              </div> */}
                              <div className="flex flex-row">
                                
                                  <div className="basis-1/4">
                                  
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
                                       {/* <p className="font-bold"> {psadm_env.edi}</p> */}

                                          

                                            {/* <button onClick={handleClick}>
                                                      Lancer PuTTY
                                            </button> */}

                                          <LancerApplis />



                        





                                  </div>
                                  <div className="basis-3/4 w-full">   
                                   <EnvServRoles env={psadm_env.env}/>                      
                                    <EnvInfos env={psadm_env.env} srv=""/>      
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