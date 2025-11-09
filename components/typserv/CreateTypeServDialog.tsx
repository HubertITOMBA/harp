"use client";

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { FormDialog } from '@/components/ui/form-dialog';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Server, FileText, Plus } from "lucide-react";
import { createTypeServ } from '@/actions/create-typserv';
import { toast } from 'react-toastify';

export function CreateTypeServDialog() {
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
      const result = await createTypeServ(formData);
      
      if (result.success) {
        toast.success(result.message);
        closeDialog();
        router.refresh();
      } else {
        toast.error(result.error || "Erreur lors de la création du type de service");
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
          Créer un type de service
        </Button>
      }
      title="Créer un nouveau type de service"
      description="Remplissez les informations pour créer un nouveau type de service"
      onSubmit={handleSubmit}
      submitLabel="Créer le type de service"
      submitIcon={<Server className="h-4 w-4" />}
      isPending={isPending}
      maxWidth="2xl"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Type de service */}
        <div className="space-y-2">
          <Label htmlFor="typsrv" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Server className="h-4 w-4 text-orange-600" />
            Type de service <span className="text-red-500">*</span>
          </Label>
          <Input
            id="typsrv"
            name="typsrv"
            required
            className="bg-white"
            placeholder="Ex: APP"
            maxLength={8}
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
            placeholder="Ex: Application"
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

