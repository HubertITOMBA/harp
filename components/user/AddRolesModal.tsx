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

export function AddRolesModal({ netid, availableRoles }: AddRolesModalProps) {
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
      <DialogContent className="sm:max-w-[500px] max-h-[75vh] overflow-hidden flex flex-col p-2 sm:p-3 !top-[20%] sm:!top-[15%] !translate-y-0">
        <DialogHeader className="pb-1 space-y-0">
          <DialogTitle className="flex items-center gap-1 text-xs sm:text-sm bg-orange-500 text-white px-2 py-1.5 rounded-t-md -mx-2 sm:-mx-3 -mt-2 sm:-mt-3">
            <Shield className="h-3 w-3" />
            Ajouter des rôles
          </DialogTitle>
          <DialogDescription className="text-[10px] sm:text-[11px] bg-orange-500 text-white px-2 py-1 rounded-b-md -mx-2 sm:-mx-3 mb-1">
            Sélectionnez un ou plusieurs rôles à attribuer à <span className="font-semibold uppercase">{netid}</span>
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          {/* Sélection rapide */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 pb-1 border-b mb-1">
            <Label className="text-[10px] sm:text-[11px] font-semibold text-gray-700">
              {selectedRoles.length} rôle(s) sélectionné(s) sur {availableRoles.length}
            </Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
              className="text-[10px] sm:text-[11px] w-full sm:w-auto h-5 sm:h-6 px-1.5 sm:px-2"
            >
              {selectedRoles.length === availableRoles.length ? "Tout désélectionner" : "Tout sélectionner"}
            </Button>
          </div>

          {/* Liste des rôles avec scroll */}
          <div className="space-y-0.5 flex-1 overflow-y-auto min-h-0 pr-1">
            {availableRoles.map((role) => (
              <div
                key={role.role}
                className="flex items-start space-x-1 p-1 rounded border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <Checkbox
                  id={role.role}
                  checked={selectedRoles.includes(role.role)}
                  onCheckedChange={() => handleRoleToggle(role.role)}
                  className="mt-0.5 h-3 w-3"
                />
                <div className="flex-1 min-w-0">
                  <Label
                    htmlFor={role.role}
                    className="flex items-center gap-0.5 cursor-pointer font-semibold text-gray-900 text-[10px] sm:text-xs"
                  >
                    <Shield className="h-2.5 w-2.5 text-orange-600 flex-shrink-0" />
                    <span className="truncate">{role.role}</span>
                  </Label>
                  <p className="text-[9px] sm:text-[10px] text-gray-600 mt-0.5 ml-3 line-clamp-1">
                    {role.descr}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Boutons d'action */}
          <DialogFooter className="gap-1 mt-1.5 pt-1.5 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
              size="sm"
              className="h-6 sm:h-7 text-[10px] sm:text-xs px-2 sm:px-3"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isPending || selectedRoles.length === 0}
              className="bg-orange-500 hover:bg-orange-600 text-white h-6 sm:h-7 text-[10px] sm:text-xs px-2 sm:px-3"
              size="sm"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-2.5 w-2.5 mr-1 animate-spin" />
                  Ajout...
                </>
              ) : (
                <>
                  <Shield className="h-2.5 w-2.5 mr-1" />
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

