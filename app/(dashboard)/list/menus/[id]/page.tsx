 // "use client"

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
import { MenuRolesTable } from '@/components/menus/menu-roles-table';
import { ArrowLeft } from 'lucide-react';
 
// import { readdir } from 'fs/promises';

import fs from 'fs';
import path from 'path';

const getImageFiles = () => {
  const publicDir = path.join(process.cwd(), 'public/ressources');
  const files = fs.readdirSync(publicDir);
  return files.filter(file => file.endsWith('.png'));
};

 const MenuSinglePage = async ({ params }: { params: { id: string } }) => {
 
  const { id } = await params;

  const Menus  = await prisma.harpmenus.findUnique({
      where: { id: parseInt(id) },
    });  

     if (!Menus) {
      return notFound();
    } 

    const MenuRoles = await prisma.harpmenurole.findMany({
      where: {
        menuId: parseInt(id),
       },
       orderBy: {
        datmaj: 'desc'
      },
      include:{
        harproles: true,
     },            
   });

    // Récupérer tous les rôles disponibles
    const allRoles = await prisma.harproles.findMany({
      orderBy: {
        role: 'asc',
      },
    });

    // IDs des rôles actuellement associés au menu
    const currentMenuRoleIds = MenuRoles.map(mr => mr.roleId);

    const concatenatedRoles = MenuRoles.map(role => `"${role.harproles.role}"`).join(', ');

    const imageFiles =  getImageFiles();


  return (
      <div className="container p-2 gap-4 xl:flex-row w-full">
        {/* Bouton retour */}
        <div className="mb-4">
          <Button asChild variant="outline" className="bg-white hover:bg-gray-50">
            <Link href="/list/menus">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour à la liste
            </Link>
          </Button>
        </div>
      
        
            <div className="flex bg-card rounded-xl shadow-xl p-2 mt-0 gap-4  justify-left relative w-full mb-5">
                  <Image src={`/ressources/list.png`} alt="" width={40} height={40} className="rounded-full"/>
                    {/* <Link href={Menus.id}>
                        <h1 className="mt-2 text-3xl font-semibold uppercase">{Menus.id}</h1>
                    </Link> */}
                  
                 <h2 className="text-2xl font-semibold mt-3">{Menus.menu} </h2> 
                 <h2 className="text-2xl font-semibold mt-3">{Menus.role} </h2> 
            </div>





       
        <div className="flex-2  w-ful">
            <div className="flex flex-col gap-4">
              {/** TOP */}
                <div className="flex bg-card rounded-xl shadow-xl mb-5 mt-2 py-2 px-2 gap-4">
                              
                       <div className="w-1/2 p-4 gap-2">

                            <div className="w-full flex items-center gap-2">
                                  <Label className="py-2 whitespace-nowrap text-xl text-muted-foreground">Menu  :</Label> 
                                  <Label className="py-2 whitespace-nowrap text-2xl text-foreground">{Menus.menu}</Label>
                            </div> 
                            <div className="w-full flex items-center gap-2">
                                <Label className="py-2 whitespace-nowrap text-xl text-muted-foreground">Description :</Label><Label className="whitespace-nowrap text-2xl text-foreground">{Menus.descr}  </Label>  
                            </div>

                            <div className="w-full flex items-center gap-2">
                                  <Label className="py-2 whitespace-nowrap text-xl text-muted-foreground">Url  :</Label> 
                                  <Label className="py-2 whitespace-nowrap text-2xl text-foreground">{Menus.href}</Label>
                            </div> 
                            <div className="w-full flex items-center gap-2">
                              <Label className="py-2 whitespace-nowrap text-xl text-muted-foreground">Icône   :</Label> 
                              <Label className="whitespace-nowrap text-2xl text-foreground">{Menus.icone} 
                              </Label>


                               {/*
                                 REACTIVER POUR MIS A JOUR */}
                                <select 
                                  className="border rounded-md p-2 text-lg"
                                  defaultValue={Menus.icone || ""}
                                >
                                  <option value="N">Aucune icône</option>
                                  {imageFiles.map((file) => (
                                    <option key={file} value={file}>
                                      {file}
                                    </option>
                                  ))}
                                </select>  


                              {/* REACTIVER POUR MIS A JOUR */}
                                {/* <select 
                                  className="border rounded-md p-2 text-lg"
                                  defaultValue={Menus.icone}
                                  onChange={(e) => {
                                    const preview = document.getElementById('iconPreview') as HTMLImageElement;
                                    if (e.target.value === 'N') {
                                      preview.style.display = 'none';
                                    } else {
                                      preview.src = `/ressources/${e.target.value}`;
                                      preview.style.display = 'block';
                                    }
                                  }}
                                >
                                  <option value="N">Aucune icône</option>
                                  {imageFiles.map((file) => (
                                    <option key={file} value={file}>
                                      {file}
                                    </option>
                                  ))}
                                </select>  */}

                              { Menus.icone !="N" ? <Image src={`/ressources/${Menus.icone}`}alt="" width={30} height={30} className="" /> : ""}
                              
                            
                              {/* <button type="submit" className="px-2 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                                Modifier
                              </button> */}



                            </div>

                            {/* <div className="flex gap-4 items-center">
                              <Label className="py-2 whitespace-nowrap text-xl text-gray-500">Autorisation primaire :</Label><Label className="whitespace-nowrap text-2xl text-gray-900">{Menus.role}</Label>  
                            </div> */}
                            <div className="flex gap-4 items-center">
                              <Label className="py-2 whitespace-nowrap text-xl text-muted-foreground">Dispaly / Ordre  :</Label><Label className="whitespace-nowrap text-2xl text-foreground">{Menus.display}</Label>  
                            </div>

                            <div className="flex gap-4 items-center">
                              <Label className="py-2 whitespace-nowrap text-xl text-muted-foreground">Emplacement :</Label><Label className="whitespace-nowrap text-2xl text-foreground">{Menus.level}</Label>  
                            </div>

                            {/* <div className="flex gap-4 items-center">
                              <Label className="py-2 whitespace-nowrap text-xl text-gray-500">Identifiant :</Label><Label className="whitespace-nowrap text-2xl text-gray-900">{Menus.id}</Label>  
                            </div> */}

                            <div className="flex gap-4 items-center">
                              <Label className="py-2 whitespace-nowrap text-xl text-muted-foreground">Autorisé à :</Label><Label className="whitespace-nowrap text-2xl text-foreground">{concatenatedRoles}</Label>  
                            </div>

                           
                            
                       </div>
                                  
                     
                            
                            
                      
                </div>

            </div>
             {/** BOTTOM */}

            {/* DataTable TanStack pour les rôles */}
            <MenuRolesTable
              menuId={parseInt(id)}
              menuRoles={MenuRoles}
              availableRoles={allRoles}
              currentRoleIds={currentMenuRoleIds}
              menuName={Menus.menu}
            />
            
            {/* Bouton retour en bas */}
            <div className="mt-6 flex justify-start">
              <Button asChild variant="outline" className="bg-white hover:bg-gray-50">
                <Link href="/list/menus">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Retour à la liste
                </Link>
              </Button>
            </div>
      </div>


      

    </div>
  )
}


export default MenuSinglePage;



