"use client";

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { FormDialog } from '@/components/ui/form-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Package, FileText, Pencil, Loader2 } from "lucide-react";
import { updateAppli } from '@/actions/update-appli';
import { toast } from 'react-toastify';

interface EditAppliDialogProps {
  appli: {
    appli: string;
    psversion: string;
    descr: string;
  };
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function EditAppliDialog({ appli, open: controlledOpen, onOpenChange }: EditAppliDialogProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>,
    closeDialog: () => void
  ) => {
    e.preventDefault();
    setErrors({});
    
    const formData = new FormData(e.currentTarget);
    
    startTransition(async () => {
      const result = await updateAppli(appli.appli, appli.psversion, formData);
      
      if (result.success) {
        toast.success(result.message);
        closeDialog();
        setOpen(false);
        router.refresh();
      } else {
        toast.error(result.error || "Erreur lors de la mise à jour de l'application");
        if (result.error) {
          setErrors({ general: result.error });
        }
      }
    });
  };

  const formContent = (
    <>
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
    </>
  );

  // Si open/onOpenChange sont fournis, utiliser Dialog directement
  if (controlledOpen !== undefined || onOpenChange) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader className="space-y-0">
            <DialogTitle className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-2 rounded-t-md -mx-6 -mt-6">
              Modifier l&apos;application {appli.appli} (v{appli.psversion})
            </DialogTitle>
            <DialogDescription className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-1.5 rounded-b-md -mx-6 mb-4">
              Modifiez les informations de l&apos;application
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => handleSubmit(e, () => setOpen(false))}>
            <div className="space-y-4 py-4">
              {formContent}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
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
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Pencil className="mr-2 h-4 w-4" />
                    Enregistrer les modifications
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    );
  }

  // Sinon, utiliser FormDialog avec trigger
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
      title={`Modifier l'application ${appli.appli} (v${appli.psversion})`}
      description="Modifiez les informations de l'application"
      onSubmit={handleSubmit}
      submitLabel="Enregistrer les modifications"
      submitIcon={<Pencil className="h-4 w-4" />}
      isPending={isPending}
      maxWidth="2xl"
    >
      {formContent}
    </FormDialog>
  );
}

