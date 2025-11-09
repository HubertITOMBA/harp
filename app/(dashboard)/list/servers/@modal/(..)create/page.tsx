import React from 'react'
import { FormModal } from '@/components/ui/form-modal';
import { CreateServerForm } from '@/components/server/CreateServerForm';
import { Plus } from "lucide-react";

export default async function CreateServerModal() {
  return (
    <FormModal
      title="Créer un nouveau serveur"
      description="Remplissez les informations pour créer un nouveau serveur"
      icon={<Plus className="h-6 w-6" />}
      maxWidth="2xl"
    >
      <CreateServerForm />
    </FormModal>
  );
}

