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
import { createAppli } from '@/actions/create-appli';
import { toast } from 'react-toastify';

export function CreateAppliForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});
    
    const formData = new FormData(e.currentTarget);
    
    startTransition(async () => {
      const result = await createAppli(formData);
      
      if (result.success) {
        toast.success(result.message);
        router.push(`/list/appli`);
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
    <form onSubmit={handleSubmit} className="space-y-6">
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
              Création...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Créer
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

