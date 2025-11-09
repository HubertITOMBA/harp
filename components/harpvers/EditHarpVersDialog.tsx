"use client";

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { FormDialog } from '@/components/ui/form-dialog';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Package, FileText, Pencil } from "lucide-react";
import { updateHarpVers } from '@/actions/update-harpvers';
import { toast } from 'react-toastify';

interface EditHarpVersDialogProps {
  harpVers: {
    harprelease: string;
    descr: string;
  };
}

export function EditHarpVersDialog({ harpVers }: EditHarpVersDialogProps) {
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
      const result = await updateHarpVers(harpVers.harprelease, formData);
      
      if (result.success) {
        toast.success(result.message);
        closeDialog();
        router.refresh();
      } else {
        toast.error(result.error || "Erreur lors de la mise à jour de la release");
        if (result.error) {
          setErrors({ general: result.error });
        }
      }
    });
  };

  return (
    <FormDialog
      trigger={
        <Button
          variant="outline"
          size="sm"
          className="h-7 w-7 sm:h-8 sm:w-8 p-0 border-blue-300 hover:bg-blue-50"
          title="Éditer"
        >
          <Pencil className="h-3 w-3 sm:h-4 sm:w-4" />
        </Button>
      }
      title={`Modifier la release ${harpVers.harprelease.toUpperCase()}`}
      description="Modifiez les informations de la release"
      onSubmit={handleSubmit}
      submitLabel="Enregistrer les modifications"
      submitIcon={<Pencil className="h-4 w-4" />}
      isPending={isPending}
      maxWidth="2xl"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Release (lecture seule) */}
        <div className="space-y-2">
          <Label htmlFor="harprelease" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Package className="h-4 w-4 text-orange-600" />
            Release
          </Label>
          <Input
            id="harprelease"
            value={harpVers.harprelease}
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
            defaultValue={harpVers.descr}
            className="bg-white"
            placeholder="Ex: Release 9.2"
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

