"use client";

import { useState, useTransition } from "react";
import { addRoleToMenu } from "@/actions/update-menu-roles";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

interface Role {
  id: number;
  role: string;
  descr: string;
}

interface AddMenuRoleFormProps {
  menuId: number;
  availableRoles: Role[];
  currentRoleIds: number[];
}

/**
 * Composant pour ajouter un rôle à un menu via une liste déroulante
 */
export function AddMenuRoleForm({
  menuId,
  availableRoles,
  currentRoleIds,
}: AddMenuRoleFormProps) {
  const [open, setOpen] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState<string>("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // Filtrer les rôles déjà associés au menu
  const availableRolesToAdd = availableRoles.filter(
    (role) => !currentRoleIds.includes(role.id)
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedRoleId) {
      toast.error("Veuillez sélectionner un rôle");
      return;
    }

    startTransition(async () => {
      const result = await addRoleToMenu(menuId, parseInt(selectedRoleId));
      
      if (result.success) {
        toast.success(result.message || "Rôle ajouté avec succès");
        setOpen(false);
        setSelectedRoleId("");
        router.refresh();
      } else {
        toast.error(result.error || "Erreur lors de l'ajout du rôle");
      }
    });
  };

  if (availableRolesToAdd.length === 0) {
    return (
      <Button disabled variant="outline" size="sm">
        <Plus className="h-4 w-4 mr-2" />
        Tous les rôles sont déjà associés
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Ajouter un rôle
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ajouter un rôle au menu</DialogTitle>
          <DialogDescription>
            Sélectionnez un rôle dans la liste pour l&apos;associer à ce menu.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Rôle</label>
              <Select
                value={selectedRoleId}
                onValueChange={setSelectedRoleId}
                disabled={isPending}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez un rôle" />
                </SelectTrigger>
                <SelectContent>
                  {availableRolesToAdd.map((role) => (
                    <SelectItem key={role.id} value={role.id.toString()}>
                      <div className="flex flex-col">
                        <span className="font-medium">{role.role}</span>
                        {role.descr && (
                          <span className="text-xs text-muted-foreground">
                            {role.descr}
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
            <Button type="submit" disabled={isPending || !selectedRoleId}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Ajout...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Ajouter
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

