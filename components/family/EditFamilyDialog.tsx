"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { updateFamily } from "@/actions/family-admin";
import { FormDialog } from "@/components/ui/form-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type EditFamilyDialogProps = {
  id: number;
  typenv: string;
  typenvid: number | null;
  descr: string | null;
};

/**
 * Modifie le nom et la description d'une famille.
 * typenvid est affiché et n'est pas envoyé.
 *
 * @param props - Valeurs actuelles de la ligne
 */
export function EditFamilyDialog({ id, typenv, typenvid, descr }: EditFamilyDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState(typenv);
  const [description, setDescription] = useState(descr ?? "");

  function openDialog(): void {
    setName(typenv);
    setDescription(descr ?? "");
    setOpen(true);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>, closeDialog: () => void): void {
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await updateFamily(formData);
      if (!result.success) {
        toast.error(result.error || "Modification impossible");
        return;
      }
      toast.success(result.message || "Famille modifiée");
      closeDialog();
      router.refresh();
    });
  }

  return (
    <FormDialog
      open={open}
      onOpenChange={setOpen}
      trigger={
        <Button type="button" variant="outline" size="sm" onClick={openDialog}>
          Modifier
        </Button>
      }
      title="Modifier la famille"
      description="L'identifiant reste inchangé. Les environnements, menus et droits ne sont pas modifiés."
      onSubmit={handleSubmit}
      submitLabel="Enregistrer"
      isPending={pending}
      maxWidth="lg"
    >
      <input type="hidden" name="id" value={id} />
      <div className="space-y-2">
        <Label className="text-xs sm:text-sm font-semibold text-slate-700 uppercase tracking-wide flex items-center gap-2 bg-slate-100 px-2 py-1 rounded-t-md">
          Identifiant
        </Label>
        <p className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-sm text-slate-900">
          {typenvid ?? "—"}
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor={`typenv-${id}`} className="text-xs sm:text-sm font-semibold text-slate-700 uppercase tracking-wide flex items-center gap-2 bg-slate-100 px-2 py-1 rounded-t-md">
          Nom
        </Label>
        <Input
          id={`typenv-${id}`}
          name="typenv"
          required
          maxLength={32}
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="w-full border-slate-300 text-slate-900 font-medium focus:border-orange-500 focus:ring-orange-500"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`descr-${id}`} className="text-xs sm:text-sm font-semibold text-slate-700 uppercase tracking-wide flex items-center gap-2 bg-slate-100 px-2 py-1 rounded-t-md">
          Description
        </Label>
        <Input
          id={`descr-${id}`}
          name="descr"
          maxLength={50}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          className="w-full border-slate-300 text-slate-900 font-medium focus:border-orange-500 focus:ring-orange-500"
        />
      </div>
    </FormDialog>
  );
}
