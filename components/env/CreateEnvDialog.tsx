"use client";

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { FormDialog } from '@/components/ui/form-dialog';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Server, Database, Globe, Code, Plus } from "lucide-react";
import { createEnv } from '@/actions/create-env';
import { toast } from 'react-toastify';

export function CreateEnvDialog() {
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
      const result = await createEnv(formData);
      
      if (result.success) {
        toast.success(result.message);
        closeDialog();
        router.refresh();
      } else {
        toast.error(result.error || "Erreur lors de la création de l'environnement");
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
          Créer un environnement
        </Button>
      }
      title="Créer un nouvel environnement"
      description="Remplissez les informations pour créer un nouvel environnement"
      onSubmit={handleSubmit}
      submitLabel="Créer l'environnement"
      submitIcon={<Server className="h-4 w-4" />}
      isPending={isPending}
      maxWidth="2xl"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Nom de l'environnement */}
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="env" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Server className="h-4 w-4 text-orange-600" />
            Nom de l&apos;environnement <span className="text-red-500">*</span>
          </Label>
          <Input
            id="env"
            name="env"
            required
            className="bg-white"
            placeholder="Ex: DEV01"
          />
        </div>

        {/* Alias SQL */}
        <div className="space-y-2">
          <Label htmlFor="aliasql" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Database className="h-4 w-4 text-orange-600" />
            Alias SQL
          </Label>
          <Input
            id="aliasql"
            name="aliasql"
            className="bg-white"
            placeholder="Ex: DEV01"
          />
        </div>

        {/* Schema Oracle */}
        <div className="space-y-2">
          <Label htmlFor="oraschema" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Database className="h-4 w-4 text-orange-600" />
            Schema Oracle
          </Label>
          <Input
            id="oraschema"
            name="oraschema"
            className="bg-white"
            placeholder="Ex: PS"
            maxLength={8}
          />
        </div>

        {/* URL */}
        <div className="space-y-2">
          <Label htmlFor="url" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Globe className="h-4 w-4 text-orange-600" />
            URL
          </Label>
          <Input
            id="url"
            name="url"
            type="url"
            className="bg-white"
            placeholder="Ex: https://dev01.example.com"
          />
        </div>

        {/* Application */}
        <div className="space-y-2">
          <Label htmlFor="appli" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Code className="h-4 w-4 text-orange-600" />
            Application
          </Label>
          <Input
            id="appli"
            name="appli"
            className="bg-white"
            placeholder="Ex: HR"
            maxLength={2}
          />
        </div>

        {/* Version PeopleSoft */}
        <div className="space-y-2">
          <Label htmlFor="psversion" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Server className="h-4 w-4 text-orange-600" />
            Version PeopleSoft
          </Label>
          <Input
            id="psversion"
            name="psversion"
            className="bg-white"
            placeholder="Ex: 9.2"
          />
        </div>

        {/* Version PeopleTools */}
        <div className="space-y-2">
          <Label htmlFor="ptversion" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Server className="h-4 w-4 text-orange-600" />
            Version PeopleTools
          </Label>
          <Input
            id="ptversion"
            name="ptversion"
            className="bg-white"
            placeholder="Ex: 8.60"
          />
        </div>

        {/* Release HARP */}
        <div className="space-y-2">
          <Label htmlFor="harprelease" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Server className="h-4 w-4 text-orange-600" />
            Release HARP
          </Label>
          <Input
            id="harprelease"
            name="harprelease"
            className="bg-white"
            placeholder="Ex: 2024.1"
          />
        </div>

        {/* Description */}
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="descr" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Server className="h-4 w-4 text-orange-600" />
            Description
          </Label>
          <Input
            id="descr"
            name="descr"
            className="bg-white"
            placeholder="Description de l'environnement"
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

