"use client";

import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ActionsDropdown, ActionItem } from "@/components/ui/actions-dropdown";
import { removeRoleFromMenu } from "@/actions/update-menu-roles";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

export type MenuRole = {
  menuId: number;
  roleId: number;
  datmaj: Date;
  harproles: {
    id: number;
    role: string;
    descr: string;
  };
};

interface MenuRoleActionsProps {
  menuId: number;
  roleId: number;
  roleName: string;
  onDelete: () => void;
}

function MenuRoleActions({ menuId, roleId, roleName, onDelete }: MenuRoleActionsProps) {
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleDelete = async () => {
    const result = await removeRoleFromMenu(menuId, roleId);
    
    if (result.success) {
      toast.success(result.message || "Rôle supprimé avec succès");
      router.refresh();
      onDelete();
      setDeleteDialogOpen(false);
    } else {
      toast.error(result.error || "Erreur lors de la suppression");
    }
  };

  const actions: ActionItem[] = [
    {
      label: "Modifier",
      icon: <Pencil className="h-4 w-4" />,
      onClick: () => {
        // TODO: Implémenter la modification
        toast.info("Fonctionnalité de modification à venir");
      },
    },
    {
      label: "Supprimer",
      icon: <Trash2 className="h-4 w-4" />,
      onClick: () => setDeleteDialogOpen(true),
      variant: "destructive",
    },
  ];

  return (
    <>
      <ActionsDropdown actions={actions} />
      
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader className="space-y-0">
            <AlertDialogTitle className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-2 rounded-t-md -mx-6 -mt-6">
              Confirmer la suppression
            </AlertDialogTitle>
            <AlertDialogDescription className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-1.5 rounded-b-md -mx-6 mb-4">
              Êtes-vous sûr de vouloir supprimer le rôle <strong>{roleName}</strong> de ce menu ?
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export function createMenuRolesColumns(menuId: number): ColumnDef<MenuRole>[] {
  return [
    {
      accessorFn: (row) => row.harproles.role,
      id: "role",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="text-white hover:text-white hover:bg-transparent"
          >
            Rôle
          </Button>
        );
      },
      cell: ({ row }) => {
        return (
          <div className="font-medium">{row.original.harproles.role}</div>
        );
      },
    },
    {
      accessorFn: (row) => row.harproles.descr,
      id: "description",
      header: "Description",
      cell: ({ row }) => {
        return (
          <div className="text-muted-foreground">{row.original.harproles.descr}</div>
        );
      },
    },
    {
      id: "actions",
      header: () => <div className="text-center">Actions</div>,
      cell: ({ row }) => {
        const role = row.original;
        return (
          <div className="flex justify-center">
            <MenuRoleActions
              menuId={menuId}
              roleId={role.roleId}
              roleName={role.harproles.role}
              onDelete={() => {}}
            />
          </div>
        );
      },
    },
  ];
}

