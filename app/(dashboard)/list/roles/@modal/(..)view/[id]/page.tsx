import React from 'react'
import prisma from "@/lib/prisma";
import { notFound } from 'next/navigation';
import { FormModal } from '@/components/ui/form-modal';
import { ViewRoleContent } from '@/components/role/ViewRoleContent';
import { Eye } from "lucide-react";

const ViewRoleModal = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;

  if (!id || isNaN(parseInt(id))) {
    return notFound();
  }

  const roleData = await prisma.harproles.findUnique({
    where: { id: parseInt(id) },
    include: {
      harpuseroles: {
        include: {
          user: {
            select: {
              id: true,
              netid: true,
              nom: true,
              prenom: true,
              email: true,
            }
          }
        }
      }
    }
  });  

  if (!roleData) {
    return notFound();
  }

  return (
    <FormModal
      title={`Rôle ${roleData.role.toUpperCase()}`}
      description={roleData.descr}
      icon={<Eye className="h-6 w-6" />}
      maxWidth="full"
    >
      <ViewRoleContent role={roleData} />
    </FormModal>
  );
}

export default ViewRoleModal;

