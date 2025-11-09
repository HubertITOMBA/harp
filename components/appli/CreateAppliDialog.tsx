"use client";

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { FormDialog } from '@/components/ui/form-dialog';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Package, FileText, Plus } from "lucide-react";
import { createAppli } from '@/actions/create-appli';
import { toast } from 'react-toastify';

export function CreateAppliDialog() {
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
      const result = await createAppli(formData);
      
      if (result.success) {
        toast.success(result.message);
        closeDialog();
        router.refresh();
      } else {
        toast.error(result.error || "Erreur lors de la création de l'application");
        if (result.error) {
          setErrors({ general: result.error });
        }
      }
    });
  };

  return (
    <FormDialog
      trigger={
        <Button className="bg-orange-500 hover:bg-orange-600 text-white shadow-md">
          <Plus className="h-4 w-4 mr-2" />
          Créer une application
        </Button>
      }
      title="Créer une nouvelle application"
      description="Remplissez les informations pour créer une nouvelle application"
      onSubmit={handleSubmit}
      submitLabel="Créer l'application"
      submitIcon={<Package className="h-4 w-4" />}
      isPending={isPending}
      maxWidth="2xl"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Code Application */}
        <div className="space-y-2">
          <Label htmlFor="appli" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Package className="h-4 w-4 text-orange-600" />
            Code Application <span className="text-red-500">*</span>
          </Label>
          <Input
            id="appli"
            name="appli"
            required
            className="bg-white"
            placeholder="Ex: HR"
            maxLength={2}
          />
        </div>

        {/* Version Psoft */}
        <div className="space-y-2">
          <Label htmlFor="psversion" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Package className="h-4 w-4 text-orange-600" />
            Version Psoft <span className="text-red-500">*</span>
          </Label>
          <Input
            id="psversion"
            name="psversion"
            required
            className="bg-white"
            placeholder="Ex: 9.2"
            maxLength={50}
          />
        </div>

        {/* Description */}
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="descr" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <FileText className="h-4 w-4 text-orange-600" />
            Description <span className="text-red-500">*</span>
          </Label>
          <Input
            id="descr"
            name="descr"
            required
            className="bg-white"
            placeholder="Ex: Human Resources"
            maxLength={50}
          />
        </div>
      </div>

      {errors.general && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {errors.general}
        </div>
      )}
    </FormDialog>
  );
}

