import { db } from '@/lib/db';
import { Label } from "@/components/ui/label"
import React from 'react'
import Link from 'next/link';
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input';
import InputField from '@/components/harp/InputField';
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
//import EnvServRoles from './EnvServRoles';
import EnvServRoles from '@/components/harp/EnvServRoles';
  

interface EnvInfoProps {
    id: number;
 };


export const EnvModalInfos = async ({ id, }: EnvInfoProps ) => {

        const currentEnv = await db.envsharp.findUnique(
            {
              where : {
                id : parseInt(id) ,
              }
            }
         )    

       
   //  const enfInfos = await db.psadm_envinfo.findUnique({ where: { env } });  
    //  const roleServ = await db.psadm_rolesrv.findUnique({ where: {  
    //                                                          env : env,
    //                                                          typsrv: {
    //                                                             equals:  "DB"}}}); 
    //  const serverInfo = await db.psadm_srv.findUnique({ where: { srv :  roleServ?.srv }});  


     const appDesign = await db.psadm_tools.findUnique({ where: { tooltype : "CLI", tool: "APPDESIGNER" }});  
           const execAPPDesign =  (appDesign?.cmd.concat(' ', appDesign?.cmdarg.substring(0,14)));

    const dataMover = await db.psadm_tools.findUnique({ where: { tooltype : "CLI", tool: "DATAMOVER" }});  
    const execDMover =  (dataMover?.cmd.concat(' ', dataMover?.cmdarg.substring(0,14))); 
    
    const execSQL = await db.psadm_tools.findUnique({ where: { tooltype : "CLI", tool: "SQLPLUS" }}); 
    const execSQLDev = await db.psadm_tools.findUnique({ where: { tooltype : "CLI", tool: "SQLDEVELOPER" }}); 
    const execPutty = await db.psadm_tools.findUnique({ where: { tooltype : "CLI", tool: "PUTTY" }}); 
    const execFILEZILLA = await db.psadm_tools.findUnique({ where: { tooltype : "CLI", tool: "FILEZILLA" }}); 
    

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-8 w-full max-w-md shadow-2xl">
                      ON EST LA

                      {currentEnv.env}
          </div>
        
        

    </div>
  )
}
