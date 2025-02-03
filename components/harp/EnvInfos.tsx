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
    env: string;
    srv: string;
    // headerLabel: string;
    // backButtonLabel: string;
    // backButtonHref: string;
};


export const EnvInfos = async ({ 
        env,
        srv,
        // headerLabel,
        // backButtonLabel,
        // backButtonHref,
     }: EnvInfoProps ) => {

     
        const userCourent = await db.psadm_user.findUnique(
            {
              where : {
                netid : "hitomba",
              }
            }
         )    

       
     const enfInfos = await db.psadm_envinfo.findUnique({ where: { env } });  
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
    //  const paragraph = "-ORACLE -CD PARAM1";

    //  const searchTerm = 'PARAM1';
    //  const indexOfFirst = paragraph.indexOf(searchTerm);
     
    //  console.log(`The index of the first "${searchTerm}" is ${indexOfFirst}`);
    //  // Expected output: "The index of the first "dog" is 15"
     
    //  console.log(
    //    `The index of the second "${searchTerm}" is ${paragraph.indexOf(
    //      searchTerm,
    //      indexOfFirst + 1,
    //    )}`,
    //  );

    // console.log(appDesign?.cmdarg.substring(0,14));
     
/*     console.log("APPLICATION DESIGNER == ", execAPPDesign);
    console.log("DATA MOVER == ", execDMover);
    console.log("SQLPLUS == ", execSQL?.cmd);
    console.log("SQL DEVELOPER == ", execSQLDev?.cmd);
    console.log("PUTTY == ", execPutty?.cmd);*/
   // const paraZilla = `"sftp://", userCourent?.netid,"@",serverInfo?.ip,":22/",serverInfo?.pshome,"/HARP_FILES"`
    // const paraZillas = (`sftp://`.concat('', userCourent?.netid, ); 
   // console.log("FILEZILLA", execFILEZILLA?.cmd,"sftp://", userCourent?.netid,"@",serverInfo?.ip,":22/",serverInfo?.pshome,"/HARP_FILES"); 

     



  return (
    <div>

         <div className="flex gap-4 items-center">
            <Label>Image production</Label><Label className="font-semibold text-sm">{new Intl.DateTimeFormat("fr-FR", {dateStyle: 'short', timeStyle: 'medium',}).format(enfInfos?.datadt)} </Label>
         </div>
         <div className="flex gap-4 items-center">
            <Label>Dernier refresh</Label><Label className="font-semibold text-sm">{new Intl.DateTimeFormat("fr-FR", {dateStyle: 'short', timeStyle: 'medium',}).format(enfInfos?.refreshdt)} </Label>
         </div>
         <div className="flex gap-4 items-center">
         <Label>Dernier mis à jour </Label><Label className="font-semibold text-sm">{new Intl.DateTimeFormat("fr-FR", {dateStyle: 'short', timeStyle: 'medium',}).format(enfInfos?.modedt)} </Label>
         </div>
         <div className="flex gap-4 items-center">
          <Label>Dernier mis à jour </Label><Label className="font-semibold text-sm">{new Intl.DateTimeFormat("fr-FR", {dateStyle: 'short', timeStyle: 'short',}).format(enfInfos?.datmaj)} </Label>  
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
            <Label>Sudo Sudoer :</Label> <Label className='bg-harpOrange text-white p-1 rounded-xl'>{enfInfos?.userunx}</Label>
         </div>
        {/* <div className="flex gap-4 items-center">
            <Label>Serveur :</Label> <Label className="font-semibold text-sm"> <Link href="">{serverInfo?.srv}</Link></Label>  
        </div>
        <div className="flex gap-4 items-center">
            <Label>Ip :  </Label> <Label className="font-semibold text-sm">      {serverInfo?.ip}</Label> 
        </div>
         <div className="flex gap-4 items-center">
            <Label>PS Home</Label> <Label className="font-semibold text-sm"><Link href="">{serverInfo?.pshome}/HARP_FILES</Link></Label>
        </div>
        <div className="flex gap-4 items-center">
            <Label>Psoft User</Label> <Label className="font-semibold text-sm">{serverInfo?.psuser}</Label>
        </div>  */}





        {/* <div className="flex gap-4 items-center">
            <Label>Os :</Label> <Label className="font-semibold text-sm">{serverInfo?.os}</Label>
        </div>  */}
        {/* <div className="flex gap-4 items-center"> 
            <Label>Domaine  :</Label> <Label className="font-semibold text-sm">{serverInfo?.domain}</Label>
        </div> */}
        
        {/* <div className="gap-4 items-center"> 
            <Label>Application Designer  :</Label> <Label className="font-semibold text-sm">{appDesign?.cmd}</Label>
                {execAPPDesign}
                {execDMover}
                {execSQL?.cmd}
                {execSQLDev?.cmd}
                {execPutty?.cmd}
                {execFILEZILLA?.cmd} sftp://{userCourent?.netid}@{serverInfo?.ip}:22{serverInfo?.pshome}/HARP_FILES
        </div> */}

    </div>
  )
}
