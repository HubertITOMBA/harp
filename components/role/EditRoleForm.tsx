"use client"

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Shield, 
  FileText,
  Loader2,
  Save
} from "lucide-react";
import { updateRole } from '@/actions/update-role';
import { toast } from 'react-toastify';

interface EditRoleFormProps {
  role: {
    id: number;
    role: string;
    descr: string;
    slug: string | null;
  };
}

export function EditRoleForm({ role }: EditRoleFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});
    
    const formData = new FormData(e.currentTarget);
    
    startTransition(async () => {
      const result = await updateRole(role.id, formData);
      
      if (result.success) {
        toast.success(result.message);
        router.push(`/list/roles`);
        router.refresh();
      } else {
        toast.error(result.error || "Erreur lors de la mise à jour du rôle");
        if (result.error) {
          setErrors({ general: result.error });
        }
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Nom du rôle (lecture seule) */}
        <div className="space-y-2">
          <Label htmlFor="role" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Shield className="h-4 w-4 text-orange-600" />
            Nom du rôle
          </Label>
          <Input
            id="role"
            value={role.role}
            disabled
            className="bg-gray-100 cursor-not-allowed"
          />
        </div>

        {/* Slug */}
        <div className="space-y-2">
          <Label htmlFor="slug" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Shield className="h-4 w-4 text-orange-600" />
            Slug
          </Label>
          <Input
            id="slug"
            name="slug"
            defaultValue={role.slug || ''}
            className="bg-white"
            placeholder="Ex: psadmin"
            maxLength={32}
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
            defaultValue={role.descr}
            className="bg-white"
            placeholder="Ex: Administrateur PeopleSoft"
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

