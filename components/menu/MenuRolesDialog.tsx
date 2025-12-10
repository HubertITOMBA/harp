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
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

/**
 * Composant dialog pour gérer les rôles HARP associés à un menu
 * 
 * @param menuId - L'ID du menu
 * @param menuName - Le nom du menu pour l'affichage
 */
export function MenuRolesDialog({ menuId, menuName, open: controlledOpen, onOpenChange }: MenuRolesDialogProps) {
  const router = useRouter();
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;
  const [isPending, startTransition] = useTransition();
  const [harpRoles, setHarpRoles] = useState<HarpRole[]>([]);
  const [loadingHarpRoles, setLoadingHarpRoles] = useState(true);
  const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>([]);
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);

  // Charger les rôles HARP et les rôles actuels du menu
  useEffect(() => {
    if (!open) {
      // Réinitialiser les sélections quand le dialog se ferme
      setSelectedRoleIds([]);
      return;
    }

    async function fetchHarpRolesAndMenuRoles() {
      try {
        setLoadingHarpRoles(true);
        const [harpRolesData, menuData] = await Promise.all([
          getAllHarpRoles(),
          getMenuById(menuId)
        ]);
        
        setHarpRoles(harpRolesData);
        
        // Extraire les IDs des rôles actuellement assignés au menu
        if (menuData?.harpmenurole && menuData.harpmenurole.length > 0) {
          const currentRoleIds = menuData.harpmenurole.map(mr => mr.harproles.id);
          setSelectedRoleIds(currentRoleIds);
        } else {
          setSelectedRoleIds([]);
        }
      } catch (error) {
        console.error("Erreur lors de la récupération des rôles HARP:", error);
        toast.error("Erreur lors du chargement des rôles HARP");
        setSelectedRoleIds([]);
      } finally {
        setLoadingHarpRoles(false);
      }
    }
    
    fetchHarpRolesAndMenuRoles();
  }, [menuId, open]);

  const handleRoleToggle = (roleId: number, index: number, event?: MouseEvent | React.MouseEvent) => {
    const isShiftClick = event?.shiftKey && lastSelectedIndex !== null;
    
    if (isShiftClick && lastSelectedIndex !== null) {
      // Sélection par plage avec Shift
      const start = Math.min(lastSelectedIndex, index);
      const end = Math.max(lastSelectedIndex, index);
      const rangeIds = harpRoles.slice(start, end + 1).map(role => role.id);
      const isSelecting = !selectedRoleIds.includes(roleId);
      
      setSelectedRoleIds(prev => {
        if (isSelecting) {
          // Ajouter tous les IDs de la plage qui ne sont pas déjà sélectionnés
          const newIds = rangeIds.filter(id => !prev.includes(id));
          return [...prev, ...newIds];
        } else {
          // Retirer tous les IDs de la plage
          return prev.filter(id => !rangeIds.includes(id));
        }
      });
    } else {
      // Sélection simple
      setSelectedRoleIds(prev => 
        prev.includes(roleId) 
          ? prev.filter(id => id !== roleId)
          : [...prev, roleId]
      );
      setLastSelectedIndex(index);
    }
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

  // Si open/onOpenChange sont fournis, ne pas afficher de trigger (contrôlé depuis l'extérieur)
  const isControlled = controlledOpen !== undefined || onOpenChange;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isControlled && (
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
      )}
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-0">
          <DialogTitle className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-2 rounded-t-md -mx-6 -mt-6 text-base sm:text-lg flex items-center gap-2">
            <Shield className="h-4 w-4 sm:h-5 sm:w-5" />
            Rôles HARP - {menuName.toUpperCase()}
          </DialogTitle>
          <DialogDescription className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-1.5 rounded-b-md -mx-6 mb-4 text-xs sm:text-sm">
            Sélectionnez ou désélectionnez les rôles HARP associés à ce menu
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-1">
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-200">
            <Label className="text-xs font-semibold text-slate-700 uppercase tracking-wide flex items-center gap-1.5 bg-slate-100 px-2 py-0.5 rounded-t-md">
              <Shield className="h-3 w-3 text-orange-600" />
              Rôles disponibles
            </Label>
            <span className="text-xs text-slate-600 font-medium">
              {selectedRoleIds.length}/{harpRoles.length}
            </span>
          </div>

          {loadingHarpRoles ? (
            <div className="text-center py-6">
              <Loader2 className="h-6 w-6 mx-auto mb-2 text-gray-400 animate-spin" />
              <p className="text-xs text-gray-500">Chargement...</p>
            </div>
          ) : harpRoles.length === 0 ? (
            <div className="text-center py-6 bg-gray-50 rounded-lg border border-gray-200">
              <Shield className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p className="text-xs text-gray-500">Aucun rôle HARP disponible</p>
            </div>
          ) : (
            <div className="space-y-1 max-h-96 overflow-y-auto border border-slate-200 rounded-lg p-2 bg-slate-50">
              {harpRoles.map((harpRole, index) => {
                const isSelected = selectedRoleIds.includes(harpRole.id);
                return (
                  <div
                    key={harpRole.id}
                    onClick={(e) => {
                      // Ne pas déclencher si on clique directement sur la checkbox
                      if ((e.target as HTMLElement).tagName !== 'INPUT') {
                        handleRoleToggle(harpRole.id, index, e);
                      }
                    }}
                    className={`flex items-center gap-2 p-1.5 rounded transition-colors border border-slate-200 cursor-pointer ${
                      isSelected 
                        ? 'bg-orange-50 border-orange-300 hover:bg-orange-100' 
                        : 'bg-white hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      id={`role-${harpRole.id}`}
                      checked={isSelected}
                      onChange={(e) => {
                        e.stopPropagation();
                        handleRoleToggle(harpRole.id, index, e.nativeEvent);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-slate-300 rounded cursor-pointer flex-shrink-0"
                    />
                    <label
                      htmlFor={`role-${harpRole.id}`}
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center gap-1.5">
                        <Shield className="h-3 w-3 text-orange-600 flex-shrink-0" />
                        <span className="font-semibold text-slate-900 text-xs">
                          {harpRole.role}
                        </span>
                      </div>
                      {harpRole.descr && (
                        <p className="text-xs text-slate-600 ml-4.5 mt-0.5">
                          {harpRole.descr}
                        </p>
                      )}
                    </label>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
              size="sm"
              className="h-8 text-xs border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              Annuler
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isPending || loadingHarpRoles}
              size="sm"
              className="h-8 text-xs bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Shield className="mr-1.5 h-3 w-3" />
                  Enregistrer
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

