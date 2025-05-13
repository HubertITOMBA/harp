

import { Metadata } from 'next';
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Modal } from '@/components/Modal';
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
        <Modal>
          <h1>HUBERT</h1>
          {Envs.env}
        
        </Modal>
    );

};