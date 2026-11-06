"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FolderPlus } from "lucide-react";
import { toast } from "react-toastify";
import { createFamily } from "@/actions/family-admin";
import { FormDialog } from "@/components/ui/form-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

/**
 * Dialogue de création d'une famille harptypenv.
 * N'envoie ni identifiant, ni menu, ni rôle, ni sous-rôle.
 */
export function CreateFamilyDialog() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>, closeDialog: () => void): void {
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await createFamily(formData);
      if (!result.success) {
        toast.error(result.error || "Création impossible");
        return;
      }
      toast.success(result.message || "Famille créée");
      closeDialog();
      router.refresh();
    });
  }

  return (
    <FormDialog
      open={open}
      onOpenChange={setOpen}
      trigger={
        <Button type="button" className="bg-white text-orange-700 hover:bg-orange-50">
          <FolderPlus className="mr-2 h-4 w-4" />
          Ajouter une famille
        </Button>
      }
      title="Ajouter une famille"
      description="Nom de 32 caractères maximum et description facultative de 50 caractères maximum. L'identifiant est attribué automatiquement. Aucun menu ni aucun droit n'est ajouté."
      onSubmit={handleSubmit}
      submitLabel="Créer la famille"
      isPending={pending}
      maxWidth="lg"
    >
      <div className="space-y-2">
        <Label htmlFor="typenv" className="text-xs sm:text-sm font-semibold text-slate-700 uppercase tracking-wide flex items-center gap-2 bg-slate-100 px-2 py-1 rounded-t-md">
          Nom
        </Label>
        <Input
          id="typenv"
          name="typenv"
          required
          maxLength={32}
          className="w-full border-slate-300 text-slate-900 font-medium focus:border-orange-500 focus:ring-orange-500"
        />
        <p className="text-xs text-slate-600">32 caractères maximum, unique.</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="descr" className="text-xs sm:text-sm font-semibold text-slate-700 uppercase tracking-wide flex items-center gap-2 bg-slate-100 px-2 py-1 rounded-t-md">
          Description
        </Label>
        <Input
          id="descr"
          name="descr"
          maxLength={50}
          className="w-full border-slate-300 text-slate-900 font-medium focus:border-orange-500 focus:ring-orange-500"
        />
        <p className="text-xs text-slate-600">Facultative, 50 caractères maximum.</p>
      </div>
    </FormDialog>
  );
}
