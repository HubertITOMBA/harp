

import { Prisma, psadm_dispo, psadm_env, psadm_envinfo, psadm_logo, psadm_oracle, psadm_rolesrv, psadm_roleuser, psadm_srv, psadm_statenv, psadm_typenv } from "@prisma/client";
import prisma from "@/lib/prisma";
import TableSearch from '@/components/harp/TableSearch';
import { Card, CardContent, CardHeader, CardFooter  } from "@/components/ui/card"
import Image from "next/image"
import Link from "next/link";


type HarpEnvList =  psadm_env & 
                        { psadm_roleusers : psadm_roleuser[] } &  
                        { psadm_envinfos : psadm_envinfo[] } & 
                        { psadm_logos  : psadm_logo[] } & 
                        { psadm_rolesrvs : psadm_rolesrv[] } & 
                        { psadm_srvs  : psadm_srv[] } & 
                        { psadm_statenvs : psadm_statenv[] } & 
                        { psadm_dispos :  psadm_dispo[] } & 
                        { psadm_typenvs : psadm_typenv[] } & 
                        { psadm_oracles : psadm_oracle[] } ;

 const renderRow = (item: HarpEnvList) => (
  <div>
    Les ENVS
  </div>
 )


const EnvCard =  async ({type}: {type:string}) => {

 
 

  return (
    <div className="rounded-2xl odd:bg-orange-100 even:bg-orange-200 p-4 flex-1">
    <div className="flex justify-between items-center">
        <span className="text-[10px] bg-white px-2 py-1 text-green-600 rounded-full font-bold">2024 / 25</span>
        <Image src="/ressources/more.png" alt="" width={20} height={20} />
    </div>   
    <h1 className="text-2xl font-semibold my-4">3,600</h1> 
     <h2 className="capitalize">{type}</h2>
</div>
  )

}

export default EnvCard; 

 