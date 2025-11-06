"use client";

import { useState, useTransition } from "react";
import { updateMenuRoles } from "@/actions/update-menu-roles";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "react-toastify";
import { Loader2, Save } from "lucide-react";

interface Role {
  id: number;
  role: string;
  descr: string;
}

interface MenuRolesManagerProps {
  menuId: number;
  availableRoles: Role[];
  currentMenuRoles: number[]; // IDs des rôles actuellement associés au menu
}

/**
 * Composant pour gérer les rôles d'un menu
 * Permet de sélectionner/désélectionner les rôles via des checkboxes
 */
export function MenuRolesManager({
  menuId,
  availableRoles,
  currentMenuRoles,
}: MenuRolesManagerProps) {
  const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>(currentMenuRoles);
  const [isPending, startTransition] = useTransition();

  const handleRoleToggle = (roleId: number) => {
    setSelectedRoleIds((prev) => {
      if (prev.includes(roleId)) {
        return prev.filter((id) => id !== roleId);
      } else {
        return [...prev, roleId];
      }
    });
  };

  const handleSave = () => {
    startTransition(async () => {
      const result = await updateMenuRoles(menuId, selectedRoleIds);
      
      if (result.success) {
        toast.success(result.message || "Rôles mis à jour avec succès");
      } else {
        toast.error(result.error || "Erreur lors de la mise à jour");
      }
    });
  };

  const hasChanges = 
    selectedRoleIds.length !== currentMenuRoles.length ||
    !selectedRoleIds.every((id) => currentMenuRoles.includes(id)) ||
    !currentMenuRoles.every((id) => selectedRoleIds.includes(id));

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Gestion des rôles</CardTitle>
            <CardDescription>
              Sélectionnez les rôles autorisés à accéder à ce menu
            </CardDescription>
          </div>
          <Button
            onClick={handleSave}
            disabled={!hasChanges || isPending}
            size="sm"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Enregistrer
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {availableRoles.length === 0 ? (
          <p className="text-muted-foreground">Aucun rôle disponible</p>
        ) : (
          <div className="space-y-3">
            {availableRoles.map((role) => {
              const isSelected = selectedRoleIds.includes(role.id);
              return (
                <div
                  key={role.id}
                  className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <Checkbox
                    id={`role-${role.id}`}
                    checked={isSelected}
                    onCheckedChange={() => handleRoleToggle(role.id)}
                  />
                  <label
                    htmlFor={`role-${role.id}`}
                    className="flex-1 cursor-pointer"
                  >
                    <div className="font-medium">{role.role}</div>
                    {role.descr && (
                      <div className="text-sm text-muted-foreground">
                        {role.descr}
                      </div>
                    )}
                  </label>
                  {isSelected && (
                    <span className="text-xs text-muted-foreground">
                      Sélectionné
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
        
        <div className="mt-4 pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            {selectedRoleIds.length} rôle(s) sélectionné(s) sur {availableRoles.length} disponible(s)
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

