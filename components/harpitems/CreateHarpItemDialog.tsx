"use client";

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { FormDialog } from '@/components/ui/form-dialog';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";
import { createHarpItem } from '@/actions/harpitems-actions';
import { toast } from 'react-toastify';

export function CreateHarpItemDialog() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>,
    closeDialog: () => void
  ) => {
    e.preventDefault();
    setErrors({});
    
    const formData = new FormData(e.currentTarget);
    
    startTransition(async () => {
      const result = await createHarpItem({
        descr: formData.get("descr") as string,
      });
      
      if (result.success) {
        toast.success("Item réutilisable créé avec succès");
        closeDialog();
        router.refresh();
      } else {
        toast.error(result.error || "Erreur lors de la création");
        if (result.error) {
          setErrors({ general: result.error });
        }
      }
    });
  };

  return (
    <FormDialog
      trigger={
        <button className="inline-flex items-center justify-center rounded-md bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2">
          <Plus className="mr-2 h-4 w-4" />
          Ajouter un item réutilisable
        </button>
      }
      title="Ajouter un item réutilisable"
      description="Créez un nouvel item qui pourra être réutilisé dans plusieurs tâches"
      onSubmit={handleSubmit}
      submitLabel="Créer l'item"
      submitIcon={<Plus className="h-4 w-4" />}
      isPending={isPending}
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="descr" className="text-sm font-semibold text-gray-700">
            Description <span className="text-red-500">*</span>
          </Label>
          <Input
            id="descr"
            name="descr"
            required
            className="bg-white"
            placeholder="Ex: Installation de binaire Oracle"
            maxLength={255}
          />
          <p className="text-xs text-gray-500">
            Cette description sera utilisée comme titre pour toutes les tâches utilisant cet item.
          </p>
        </div>
      </div>
    </FormDialog>
  );
}
