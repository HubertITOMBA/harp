"use client"

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Shield, Loader2, Plus } from "lucide-react";
import { addUserRoles } from '@/actions/user-roles';
import { useRouter } from 'next/navigation';
import { toast } from "react-toastify";

interface AddRolesModalProps {
  netid: string;
  availableRoles: Array<{
    role: string;
    descr: string;
  }>;
  assignedRoles: string[];
}

export function AddRolesModal({ netid, availableRoles, assignedRoles }: AddRolesModalProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();

  const handleRoleToggle = (role: string) => {
    setSelectedRoles(prev => 
      prev.includes(role) 
        ? prev.filter(r => r !== role)
        : [...prev, role]
    );
  };

  const handleSelectAll = () => {
    if (selectedRoles.length === availableRoles.length) {
      setSelectedRoles([]);
    } else {
      setSelectedRoles(availableRoles.map(r => r.role));
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!isPending) {
      setOpen(newOpen);
      if (!newOpen) {
        // Réinitialiser le formulaire quand on ferme
        setSelectedRoles([]);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedRoles.length === 0) {
      toast.error("Veuillez sélectionner au moins un rôle");
      return;
    }

    startTransition(async () => {
      const result = await addUserRoles(netid, selectedRoles);
      
      if (result.success) {
        toast.success(result.message);
        setOpen(false);
        setSelectedRoles([]);
        router.refresh();
      } else {
        toast.error(result.error || "Erreur lors de l'ajout des rôles");
      }
    });
  };

  if (availableRoles.length === 0) {
    return (
      <Button 
        variant="default" 
        size="sm"
        className="bg-orange-500 hover:bg-orange-600 text-white shadow-md"
        disabled
      >
        <Plus className="h-4 w-4 mr-2" />
        Ajouter un rôle
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button 
          variant="default" 
          size="sm"
          className="bg-orange-500 hover:bg-orange-600 text-white shadow-md"
        >
          <Plus className="h-4 w-4 mr-2" />
          Ajouter un rôle
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-orange-600" />
            Ajouter des rôles
          </DialogTitle>
          <DialogDescription>
            Sélectionnez un ou plusieurs rôles à attribuer à <span className="font-semibold uppercase">{netid}</span>
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          {/* Sélection rapide */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b mb-3">
            <Label className="text-xs sm:text-sm font-semibold text-gray-700">
              {selectedRoles.length} rôle(s) sélectionné(s) sur {availableRoles.length}
            </Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
              className="text-xs sm:text-sm w-full sm:w-auto"
            >
              {selectedRoles.length === availableRoles.length ? "Tout désélectionner" : "Tout sélectionner"}
            </Button>
          </div>

          {/* Liste des rôles avec scroll */}
          <div className="space-y-2 flex-1 overflow-y-auto min-h-0 pr-2">
            {availableRoles.map((role) => (
              <div
                key={role.role}
                className="flex items-start space-x-2 sm:space-x-3 p-2 sm:p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <Checkbox
                  id={role.role}
                  checked={selectedRoles.includes(role.role)}
                  onCheckedChange={() => handleRoleToggle(role.role)}
                  className="mt-0.5 sm:mt-1"
                />
                <div className="flex-1 min-w-0">
                  <Label
                    htmlFor={role.role}
                    className="flex items-center gap-1.5 sm:gap-2 cursor-pointer font-semibold text-gray-900 text-sm sm:text-base"
                  >
                    <Shield className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-orange-600 flex-shrink-0" />
                    <span className="truncate">{role.role}</span>
                  </Label>
                  <p className="text-xs sm:text-sm text-gray-600 mt-0.5 sm:mt-1 ml-5 sm:ml-6 line-clamp-2">
                    {role.descr}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Boutons d'action */}
          <DialogFooter className="gap-2 sm:gap-0 mt-4 pt-4 border-t">
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
              disabled={isPending || selectedRoles.length === 0}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Ajout en cours...
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4 mr-2" />
                  Ajouter {selectedRoles.length > 0 ? `${selectedRoles.length} ` : ''}rôle(s)
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

