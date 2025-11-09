import React from 'react'
import { FormModal } from '@/components/ui/form-modal';
import { CreateRoleForm } from '@/components/role/CreateRoleForm';
import { Plus } from "lucide-react";

export default async function CreateRoleModal() {
  return (
    <FormModal
      title="Créer un nouveau rôle"
      description="Remplissez les informations pour créer un nouveau rôle"
      icon={<Plus className="h-6 w-6" />}
      maxWidth="2xl"
    >
      <CreateRoleForm />
    </FormModal>
  );
}

