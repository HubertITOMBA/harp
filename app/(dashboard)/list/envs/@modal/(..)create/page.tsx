import React from 'react'
import { FormModal } from '@/components/ui/form-modal';
import { CreateEnvForm } from '@/components/env/CreateEnvForm';
import { Plus } from "lucide-react";

export default async function CreateEnvModal() {
  return (
    <FormModal
      title="Créer un nouvel environnement"
      description="Remplissez les informations pour créer un nouvel environnement"
      icon={<Plus className="h-6 w-6" />}
      maxWidth="2xl"
    >
      <CreateEnvForm />
    </FormModal>
  );
}

