"use client"

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Server, 
  Database,
  Globe,
  Code,
  Loader2,
  Save
} from "lucide-react";
import { updateEnv } from '@/actions/update-env';
import { toast } from 'react-toastify';

interface EditEnvFormProps {
  env: {
    env: string;
    aliasql: string | null;
    oraschema: string | null;
    orarelease: string | null;
    url: string | null;
    appli: string | null;
    psversion: string | null;
    ptversion: string | null;
    harprelease: string | null;
    pshome: string | null;
    volum: string | null;
    descr: string | null;
    anonym: string | null;
    edi: string | null;
    typenvid: number | null;
    statenvId: number | null;
  };
}

export function EditEnvForm({ env }: EditEnvFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});
    
    const formData = new FormData(e.currentTarget);
    
    startTransition(async () => {
      const result = await updateEnv(env.env, formData);
      
      if (result.success) {
        toast.success(result.message);
        router.push(`/list/envs`);
        router.refresh();
      } else {
        toast.error(result.error || "Erreur lors de la mise à jour de l'environnement");
        if (result.error) {
          setErrors({ general: result.error });
        }
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Nom de l'environnement (lecture seule) */}
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="env" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Server className="h-4 w-4 text-orange-600" />
            Nom de l&apos;environnement
          </Label>
          <Input
            id="env"
            value={env.env}
            disabled
            className="bg-gray-100 cursor-not-allowed"
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
            defaultValue={env.aliasql || ''}
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
            defaultValue={env.oraschema || ''}
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
            defaultValue={env.url || ''}
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
            defaultValue={env.appli || ''}
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
            defaultValue={env.psversion || ''}
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
            defaultValue={env.ptversion || ''}
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
            defaultValue={env.harprelease || ''}
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
            defaultValue={env.descr || ''}
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

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isPending}
        >
          Annuler
        </Button>
        <Button
          type="submit"
          disabled={isPending}
          className="bg-orange-500 hover:bg-orange-600 text-white"
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Enregistrement...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Enregistrer les modifications
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

