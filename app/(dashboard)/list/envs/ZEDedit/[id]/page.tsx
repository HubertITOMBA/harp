

import { Metadata } from 'next';
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import { EnvModalInfos } from '@/components/harp/EnvModal';



export const metadata: Metadata = {
  title: 'Editer Environnement',
};


interface EnvInfoProps {
    id : number;
  };
    


export default async function EditEnvs({ params }: { params: { id: number } }) {
    const { id } = await params;

    const Envs  = await prisma.envsharp.findUnique({
        where: { id: parseInt(id) },
       
       });  
  
       if (!Envs) {
        return notFound();
      } 
  

    return (
        // <>

      
        // {Envs.env} 
        // <EnvModalInfos id = {id} />
        // </>

            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl p-8 w-full max-w-md shadow-2xl">
              
            <h1>Edition d'environnement</h1>
                          ON EST LA

                          {Envs.env} 
            </div>



</div>


    );

};