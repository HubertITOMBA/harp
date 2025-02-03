 

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
        id: parseInt(id),
       },
       select: {
        role: true
      }
     }); 

     const concatenatedRoles = MenuRoles.map(role => role.role).join(', ');

     const imageFiles = getImageFiles();


  return (
      <div className="container p-2 gap-4 xl:flex-row w-full">
      
        
            <div className="flex bg-white rounded-xl shadow-xl p-2 mt-0 gap-4  justify-left relative w-full mb-5">
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
                <div className="flex bg-white rounded-xl shadow-xl mb-5 mt-2 py-2 px-2 gap-4">
                              
                       <div className="w-1/2 p-4 gap-2">

                            

                            <div className="w-full flex items-center gap-2">
                                  <Label className="py-2 whitespace-nowrap text-xl text-gray-500">Url  :</Label> 
                                  <Label className="py-2 whitespace-nowrap text-2xl text-gray-900">{Menus.href}</Label>
                            </div> 
                            <div className="w-full flex items-center gap-2">
                              <Label className="py-2 whitespace-nowrap text-xl text-gray-500">Icône   :</Label> <Label className="whitespace-nowrap text-2xl text-gray-900">
                                 {Menus.icone} 
                              </Label>

                              {/*
                                 REACTIVER POUR MIS A JOUR
                                <select 
                                  className="border rounded-md p-2 text-lg"
                                  defaultValue={Menus.icone}
                                >
                                  <option value="N">Aucune icône</option>
                                  {imageFiles.map((file) => (
                                    <option key={file} value={file}>
                                      {file}
                                    </option>
                                  ))}
                                </select> */}

                              { Menus.icone !="N" ? <Image src={`/ressources/${Menus.icone}`}alt="" width={30} height={30} className="" /> : ""}
                              
                            
                              {/* <button type="submit" className="px-2 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                                Modifier
                              </button> */}



                            </div>

                            <div className="flex gap-4 items-center">
                              <Label className="py-2 whitespace-nowrap text-xl text-gray-500">Autorisation primaire :</Label><Label className="whitespace-nowrap text-2xl text-gray-900">{Menus.role}</Label>  
                            </div>
                            <div className="flex gap-4 items-center">
                              <Label className="py-2 whitespace-nowrap text-xl text-gray-500">Dispaly :</Label><Label className="whitespace-nowrap text-2xl text-gray-900">{Menus.display}</Label>  
                            </div>

                            <div className="flex gap-4 items-center">
                              <Label className="py-2 whitespace-nowrap text-xl text-gray-500">Level :</Label><Label className="whitespace-nowrap text-2xl text-gray-900">{Menus.level}</Label>  
                            </div>

                            <div className="flex gap-4 items-center">
                              <Label className="py-2 whitespace-nowrap text-xl text-gray-500">Identifiant :</Label><Label className="whitespace-nowrap text-2xl text-gray-900">{Menus.id}</Label>  
                            </div>

                            <div className="flex gap-4 items-center">
                              <Label className="py-2 whitespace-nowrap text-xl text-gray-500">Autorisé à :</Label><Label className="whitespace-nowrap text-2xl text-gray-900">{concatenatedRoles}</Label>  
                            </div>

                            <div className="w-full flex items-center gap-2">
                                <Label className="py-2 whitespace-nowrap text-xl text-gray-500">Description :</Label><Label className="whitespace-nowrap text-2xl text-gray-900">{Menus.descr}  </Label>  
                            </div>
                            
                       </div>
                                  
                     
                            
                            
                      
                </div>

            </div>
        {/** BOTTOM */}

           <h1 className="text-xl font-semibold mb-4">Autorisations pour <span className='uppercase'>{Menus.menu}</span> </h1>
            <div className="w-full flex gap-5">
                 <div >
                    
                    
                     <div className="w-auto bg-white rounded-xl shadow-xl overflow-hidden">
                                                  
                                                  <table className="min-w-full divide-y divide-gray-200">
                                                    <thead className="bg-gray-50 ">
                                                      <tr className="bg-harpOrange text-white">
                                                        <th className="px-2 py-2 text-left text-xl font-semibold text-white">Rôle</th>
                                                        <th className="px-2 py-2 text-left text-xl font-semibold text-white">Mis à jour</th>
                                                        <th className="px-2 py-2 text-left text-xl font-semibold text-white"></th>
                                                      </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-200 bg-white">
                                                      {MenuRoles.map((item, index) => (
                                                        <tr key={index} className="hover:bg-harpSkyLight transition-colors duration-200">
                                                          <td className="px-2 py-2 whitespace-nowrap text-xl text-gray-900">{item.role}</td>
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
                   
               </div>

          </div>
      </div>


      

    </div>
  )
}


export default MenuSinglePage;



