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
import { Shield, FileText, Pencil, Loader2 } from "lucide-react";
import { updateRole } from '@/actions/update-role';
import { toast } from 'react-toastify';

interface EditRoleDialogProps {
  role: {
    id: number;
    role: string;
    descr: string;
    slug: string | null;
  };
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function EditRoleDialog({ role, open: controlledOpen, onOpenChange }: EditRoleDialogProps) {
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
      const result = await updateRole(role.id, formData);
      
      if (result.success) {
        toast.success(result.message);
        closeDialog();
        setOpen(false);
        router.refresh();
      } else {
        toast.error(result.error || "Erreur lors de la mise à jour du rôle");
        if (result.error) {
          setErrors({ general: result.error });
        }
      }
    });
  };

  const formContent = (
    <>
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
    </>
  );

  // Si open/onOpenChange sont fournis, utiliser Dialog directement
  if (controlledOpen !== undefined || onOpenChange) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader className="space-y-0">
            <DialogTitle className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-2 rounded-t-md -mx-6 -mt-6">
              Modifier le rôle {role.role.toUpperCase()}
            </DialogTitle>
            <DialogDescription className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-1.5 rounded-b-md -mx-6 mb-4">
              Modifiez les informations du rôle
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
      title={`Modifier le rôle ${role.role.toUpperCase()}`}
      description="Modifiez les informations du rôle"
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

