"use client"

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Package, 
  FileText,
  Loader2,
  Save
} from "lucide-react";
import { updateAppli } from '@/actions/update-appli';
import { toast } from 'react-toastify';

interface EditAppliFormProps {
  appli: {
    appli: string;
    psversion: string;
    descr: string;
  };
}

export function EditAppliForm({ appli }: EditAppliFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});
    
    const formData = new FormData(e.currentTarget);
    
    startTransition(async () => {
      const result = await updateAppli(appli.appli, appli.psversion, formData);
      
      if (result.success) {
        toast.success(result.message);
        router.push(`/list/appli`);
        router.refresh();
      } else {
        toast.error(result.error || "Erreur lors de la mise à jour de l'application");
        if (result.error) {
          setErrors({ general: result.error });
        }
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Code Application (lecture seule) */}
        <div className="space-y-2">
          <Label htmlFor="appli" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Package className="h-4 w-4 text-orange-600" />
            Code Application
          </Label>
          <Input
            id="appli"
            value={appli.appli}
            disabled
            className="bg-gray-100 cursor-not-allowed"
          />
        </div>

        {/* Version Psoft (lecture seule) */}
        <div className="space-y-2">
          <Label htmlFor="psversion" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Package className="h-4 w-4 text-orange-600" />
            Version Psoft
          </Label>
          <Input
            id="psversion"
            value={appli.psversion}
            disabled
            className="bg-gray-100 cursor-not-allowed"
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
            defaultValue={appli.descr}
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
              Mise à jour...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Enregistrer
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

