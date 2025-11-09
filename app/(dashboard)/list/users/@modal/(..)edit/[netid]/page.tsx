import React from 'react'
import prisma from "@/lib/prisma";
import { notFound } from 'next/navigation';
import { FormModal } from '@/components/ui/form-modal';
import { EditUserForm } from '@/components/user/EditUserForm';
import { Pencil } from "lucide-react";

const EditUserModal = async ({ params }: { params: { netid: string } }) => {
  const { netid } = await params;

  const user = await prisma.psadm_user.findUnique({
    where: { netid: netid },
  });  

  if (!user) {
    return notFound();
  }

  return (
    <FormModal
      title={`Modifier l'utilisateur ${netid.toUpperCase()}`}
      description="Modifiez les informations de l'utilisateur"
      icon={<Pencil className="h-6 w-6" />}
      maxWidth="2xl"
    >
      <EditUserForm user={user} />
    </FormModal>
  );
}

export default EditUserModal;

