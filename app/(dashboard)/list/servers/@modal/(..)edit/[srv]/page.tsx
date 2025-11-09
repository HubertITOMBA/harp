import React from 'react'
import prisma from "@/lib/prisma";
import { notFound } from 'next/navigation';
import { FormModal } from '@/components/ui/form-modal';
import { EditServerForm } from '@/components/server/EditServerForm';
import { Pencil } from "lucide-react";

const EditServerModal = async ({ params }: { params: { srv: string } }) => {
  const { srv } = await params;

  const serverData = await prisma.harpserve.findFirst({
    where: { srv: srv },
    include: {
      statutenv: true,
    },
  });  

  if (!serverData) {
    return notFound();
  }

  return (
    <FormModal
      title={`Modifier le serveur ${srv.toUpperCase()}`}
      description="Modifiez les informations du serveur"
      icon={<Pencil className="h-6 w-6" />}
      maxWidth="2xl"
    >
      <EditServerForm server={serverData} />
    </FormModal>
  );
}

export default EditServerModal;

