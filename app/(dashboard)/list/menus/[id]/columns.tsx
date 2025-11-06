"use client";

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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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

  const handleDelete = async () => {
    const result = await removeRoleFromMenu(menuId, roleId);
    
    if (result.success) {
      toast.success(result.message || "Rôle supprimé avec succès");
      router.refresh();
      onDelete();
    } else {
      toast.error(result.error || "Erreur lors de la suppression");
    }
  };

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          // TODO: Implémenter la modification
          toast.info("Fonctionnalité de modification à venir");
        }}
      >
        <Pencil className="h-4 w-4 mr-1" />
        Modifier
      </Button>
      
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" size="sm">
            <Trash2 className="h-4 w-4 mr-1" />
            Supprimer
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
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
    </div>
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
      header: "Actions",
      cell: ({ row }) => {
        const role = row.original;
        return (
          <MenuRoleActions
            menuId={menuId}
            roleId={role.roleId}
            roleName={role.harproles.role}
            onDelete={() => {}}
          />
        );
      },
    },
  ];
}

