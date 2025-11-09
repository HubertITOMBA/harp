import React from 'react'
import prisma from "@/lib/prisma";
import { notFound } from 'next/navigation';
import { FormModal } from '@/components/ui/form-modal';
import { EditEnvForm } from '@/components/env/EditEnvForm';
import { Pencil } from "lucide-react";

const EditEnvModal = async ({ params }: { params: { env: string } }) => {
  const { env } = await params;

  const envData = await prisma.envsharp.findUnique({
    where: { env: env },
    include: {
      statutenv: true,
    },
  });  

  if (!envData) {
    return notFound();
  }

  return (
    <FormModal
      title={`Modifier l'environnement ${env.toUpperCase()}`}
      description="Modifiez les informations de l'environnement"
      icon={<Pencil className="h-6 w-6" />}
      maxWidth="2xl"
    >
      <EditEnvForm env={envData} />
    </FormModal>
  );
}

export default EditEnvModal;

