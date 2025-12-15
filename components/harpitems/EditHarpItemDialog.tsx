"use client";

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { FormDialog } from '@/components/ui/form-dialog';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Pencil } from "lucide-react";
import { updateHarpItem } from '@/actions/harpitems-actions';
import { toast } from 'react-toastify';

interface EditHarpItemDialogProps {
  item: {
    id: number;
    descr: string;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditHarpItemDialog({ item, open, onOpenChange }: EditHarpItemDialogProps) {
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
      const result = await updateHarpItem({
        id: item.id,
        descr: formData.get("descr") as string,
      });
      
      if (result.success) {
        toast.success("Item mis à jour avec succès");
        closeDialog();
        router.refresh();
      } else {
        toast.error(result.error || "Erreur lors de la mise à jour");
        if (result.error) {
          setErrors({ general: result.error });
        }
      }
    });
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      trigger={null}
      title="Modifier l'item réutilisable"
      description="Modifiez la description de l'item"
      onSubmit={handleSubmit}
      submitLabel="Enregistrer"
      submitIcon={<Pencil className="h-4 w-4" />}
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
            defaultValue={item.descr}
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
