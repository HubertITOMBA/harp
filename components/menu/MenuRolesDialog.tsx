"use client";

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Shield, Loader2 } from "lucide-react";
import { updateMenuRoles } from '@/actions/update-menu-roles';
import { toast } from 'react-toastify';
import { getAllHarpRoles, getMenuById } from '@/lib/actions/menu-actions';

interface HarpRole {
  id: number;
  role: string;
  descr: string;
}

interface MenuRolesDialogProps {
  menuId: number;
  menuName: string;
}

/**
 * Composant dialog pour gérer les rôles HARP associés à un menu
 * 
 * @param menuId - L'ID du menu
 * @param menuName - Le nom du menu pour l'affichage
 */
export function MenuRolesDialog({ menuId, menuName }: MenuRolesDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [harpRoles, setHarpRoles] = useState<HarpRole[]>([]);
  const [loadingHarpRoles, setLoadingHarpRoles] = useState(true);
  const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>([]);

  // Charger les rôles HARP et les rôles actuels du menu
  useEffect(() => {
    if (!open) return;

    async function fetchHarpRolesAndMenuRoles() {
      try {
        setLoadingHarpRoles(true);
        const [harpRolesData, menuData] = await Promise.all([
          getAllHarpRoles(),
          getMenuById(menuId)
        ]);
        
        setHarpRoles(harpRolesData);
        
        // Extraire les IDs des rôles actuellement assignés au menu
        if (menuData?.harpmenurole) {
          const currentRoleIds = menuData.harpmenurole.map(mr => mr.harproles.id);
          setSelectedRoleIds(currentRoleIds);
        }
      } catch (error) {
        console.error("Erreur lors de la récupération des rôles HARP:", error);
        toast.error("Erreur lors du chargement des rôles HARP");
      } finally {
        setLoadingHarpRoles(false);
      }
    }
    
    fetchHarpRolesAndMenuRoles();
  }, [menuId, open]);

  const handleRoleToggle = (roleId: number) => {
    setSelectedRoleIds(prev => 
      prev.includes(roleId) 
        ? prev.filter(id => id !== roleId)
        : [...prev, roleId]
    );
  };

  const handleSubmit = async () => {
    startTransition(async () => {
      const result = await updateMenuRoles(menuId, selectedRoleIds);
      
      if (result.success) {
        toast.success(result.message);
        setOpen(false);
        router.refresh();
      } else {
        toast.error(result.error || "Erreur lors de la mise à jour des rôles");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-7 w-7 sm:h-8 sm:w-8 p-0 border-purple-300 hover:bg-purple-50"
          title="Gérer les rôles"
        >
          <Shield className="h-3 w-3 sm:h-4 sm:w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <Shield className="h-5 w-5 text-orange-600" />
            Rôles HARP - {menuName.toUpperCase()}
          </DialogTitle>
          <DialogDescription>
            Sélectionnez ou désélectionnez les rôles HARP associés à ce menu
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-semibold text-gray-700">
              Rôles disponibles
            </Label>
            <span className="text-xs text-gray-500">
              {selectedRoleIds.length} rôle(s) sélectionné(s) sur {harpRoles.length}
            </span>
          </div>

          {loadingHarpRoles ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 mx-auto mb-4 text-gray-400 animate-spin" />
              <p className="text-sm text-gray-500">Chargement des rôles...</p>
            </div>
          ) : harpRoles.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
              <Shield className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500 font-medium">Aucun rôle HARP disponible</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto border border-gray-200 rounded-lg p-4 bg-gray-50">
              {harpRoles.map((harpRole) => (
                <div
                  key={harpRole.id}
                  className="flex items-start space-x-3 p-3 rounded-lg border border-gray-200 hover:bg-white transition-colors bg-white"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="h-4 w-4 text-orange-600 flex-shrink-0" />
                      <span className="font-semibold text-gray-900 text-sm">
                        {harpRole.role}
                      </span>
                    </div>
                    {harpRole.descr && (
                      <p className="text-xs text-gray-600 mb-3 ml-6">
                        {harpRole.descr}
                      </p>
                    )}
                    <div className="flex items-center space-x-4 ml-6">
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id={`role-${harpRole.id}-selected`}
                          name={`role-${harpRole.id}`}
                          value="selected"
                          checked={selectedRoleIds.includes(harpRole.id)}
                          onChange={() => {
                            if (!selectedRoleIds.includes(harpRole.id)) {
                              handleRoleToggle(harpRole.id);
                            }
                          }}
                          className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300"
                        />
                        <Label
                          htmlFor={`role-${harpRole.id}-selected`}
                          className="text-sm font-medium text-gray-700 cursor-pointer"
                        >
                          Sélectionné
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id={`role-${harpRole.id}-not-selected`}
                          name={`role-${harpRole.id}`}
                          value="not-selected"
                          checked={!selectedRoleIds.includes(harpRole.id)}
                          onChange={() => {
                            if (selectedRoleIds.includes(harpRole.id)) {
                              handleRoleToggle(harpRole.id);
                            }
                          }}
                          className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300"
                        />
                        <Label
                          htmlFor={`role-${harpRole.id}-not-selected`}
                          className="text-sm font-medium text-gray-700 cursor-pointer"
                        >
                          Non sélectionné
                        </Label>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Annuler
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isPending || loadingHarpRoles}
              className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Shield className="mr-2 h-4 w-4" />
                  Enregistrer les rôles
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

