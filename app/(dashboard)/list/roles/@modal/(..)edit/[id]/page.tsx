import React from 'react'
import prisma from "@/lib/prisma";
import { notFound } from 'next/navigation';
import { FormModal } from '@/components/ui/form-modal';
import { EditRoleForm } from '@/components/role/EditRoleForm';
import { Pencil } from "lucide-react";

const EditRoleModal = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;

  const roleData = await prisma.harproles.findUnique({
    where: { id: parseInt(id) },
  });  

  if (!roleData) {
    return notFound();
  }

  return (
    <FormModal
      title={`Modifier le rôle ${roleData.role.toUpperCase()}`}
      description="Modifiez les informations du rôle"
      icon={<Pencil className="h-6 w-6" />}
      maxWidth="2xl"
    >
      <EditRoleForm role={roleData} />
    </FormModal>
  );
}

export default EditRoleModal;

