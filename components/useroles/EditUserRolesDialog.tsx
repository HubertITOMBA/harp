"use client";

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { FormDialog } from '@/components/ui/form-dialog';
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Users, Shield, Pencil, Loader2 } from "lucide-react";
import { updateUserRoles } from '@/actions/update-useroles';
import { toast } from 'react-toastify';

interface EditUserRolesDialogProps {
  userRole: {
    netid: string;
    role: string;
    rolep: string;
    datmaj: Date;
  };
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function EditUserRolesDialog({ userRole, open: controlledOpen, onOpenChange }: EditUserRolesDialogProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [internalOpen, setInternalOpen] = useState(false);
  
  const isControlled = controlledOpen !== undefined || onOpenChange !== undefined;
  const open = isControlled ? (controlledOpen ?? false) : internalOpen;
  const setOpen = isControlled ? (onOpenChange || (() => {})) : setInternalOpen;

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>,
    closeDialog?: () => void
  ) => {
    e.preventDefault();
    setErrors({});
    
    const formData = new FormData();
    // Le champ rolep n'existe plus dans harpuseroles, on envoie une valeur vide
    formData.append('rolep', '');
    
    startTransition(async () => {
      const result = await updateUserRoles(userRole.netid, userRole.role, formData);
      
      if (result.success) {
        toast.success(result.message);
        if (closeDialog) {
          closeDialog();
        } else {
          setOpen(false);
        }
        router.refresh();
      } else {
        toast.error(result.error || "Erreur lors de la mise à jour de l'attribution de rôle");
        if (result.error) {
          setErrors({ general: result.error });
        }
      }
    });
  };

  const formContent = (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Utilisateur (lecture seule) */}
        <div className="space-y-2">
          <Label htmlFor="netid" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Users className="h-4 w-4 text-orange-600" />
            Utilisateur
          </Label>
          <div className="p-2 bg-gray-100 rounded-md text-sm font-mono">
            {userRole.netid}
          </div>
        </div>

        {/* Rôle (lecture seule) */}
        <div className="space-y-2">
          <Label htmlFor="role" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Shield className="h-4 w-4 text-orange-600" />
            Rôle
          </Label>
          <div className="p-2 bg-gray-100 rounded-md text-sm font-mono">
            {userRole.role}
          </div>
        </div>

        {/* Information sur la désactivation */}
        <div className="space-y-2 md:col-span-2">
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Note :</strong> La fonctionnalité de modification du "rôle principal" n'est plus disponible avec les nouvelles tables HARP. 
              La table <code className="text-xs bg-yellow-100 px-1 rounded">harpuseroles</code> ne contient pas ce champ.
            </p>
          </div>
        </div>
      </div>

      {errors.general && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {errors.general}
        </div>
      )}
    </>
  );

  // Si open/onOpenChange sont fournis, utiliser Dialog directement sans trigger
  if (isControlled) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader className="space-y-0">
            <DialogTitle className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-2 rounded-t-md -mx-6 -mt-6">
              Modifier l'attribution de rôle
            </DialogTitle>
            <DialogDescription className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-1.5 rounded-b-md -mx-6 mb-4">
              {userRole.netid} - {userRole.role}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => handleSubmit(e)}>
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
                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
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

  // Sinon, utiliser FormDialog avec trigger (mode non-contrôlé)
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
      title={`Modifier l'attribution de rôle`}
      description={`${userRole.netid} - ${userRole.role}`}
      onSubmit={(e, closeDialog) => handleSubmit(e, closeDialog)}
      submitLabel="Enregistrer les modifications"
      submitIcon={<Pencil className="h-4 w-4" />}
      isPending={isPending}
      maxWidth="2xl"
    >
      {formContent}
    </FormDialog>
  );
}

