import React from 'react'
import { FormModal } from '@/components/ui/form-modal';
import { CreateUserForm } from '@/components/user/CreateUserForm';
import { UserPlus } from "lucide-react";

export default async function CreateUserModal() {
  return (
    <FormModal
      title="Créer un nouvel utilisateur"
      description="Remplissez les informations pour créer un nouveau compte utilisateur"
      icon={<UserPlus className="h-6 w-6" />}
      maxWidth="2xl"
    >
      <CreateUserForm />
    </FormModal>
  );
}

