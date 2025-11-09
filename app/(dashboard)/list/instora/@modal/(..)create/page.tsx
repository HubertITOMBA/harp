import React from 'react'
import { FormModal } from '@/components/ui/form-modal';
import InstanceForm from '@/components/admin/instance-form';
import { Database } from "lucide-react";

export default async function CreateInstOraModal() {
  return (
    <FormModal
      title="Créer une instance Oracle"
      description="Remplissez les informations pour créer une nouvelle instance Oracle"
      icon={<Database className="h-6 w-6" />}
      maxWidth="2xl"
    >
      <InstanceForm type='Créer' />
    </FormModal>
  );
}

