"use client";

import { useState, useTransition } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, MoreHorizontal, Circle } from "lucide-react";
import { EditTaskItemDialog } from './EditTaskItemDialog';
import { deleteTaskItem } from '@/actions/task-actions';
import { updateTaskItemStatus } from '@/actions/update-task-status';
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation';

interface TaskItemActionsProps {
  item: {
    id: number;
    title?: string; // Optionnel pour compatibilité, mais on utilise harpitem.descr maintenant
    taskId: number;
  };
  fullItem?: {
    id: number;
    title?: string; // Optionnel pour compatibilité
    duration?: number | null;
    startDate?: Date | string | null;
    endDate?: Date | string | null;
    resourceNetid?: string | null;
    predecessorId?: number | null;
    status: "EN_ATTENTE" | "EN_COURS" | "BLOQUE" | "TERMINE" | "SUCCES" | "ECHEC";
    comment?: string | null;
    taskId: number;
    harpitemId?: number | null;
    harpitem?: {
      id: number;
      descr: string;
    } | null;
  };
  onItemUpdated?: () => void;
}

const statusLabels = {
  EN_ATTENTE: "En attente",
  EN_COURS: "En cours",
  BLOQUE: "Bloqué",
  TERMINE: "Terminé",
  SUCCES: "Succès",
  ECHEC: "Échec",
};

export function TaskItemActions({ item, fullItem, onItemUpdated }: TaskItemActionsProps) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const currentStatus = fullItem?.status || "EN_ATTENTE";

  const handleDelete = async () => {
    const itemTitle = fullItem?.harpitem?.descr || item.title || `ID ${item.id}`;
    if (!confirm(`Êtes-vous sûr de vouloir supprimer la tâche "${itemTitle}" ?`)) {
      return;
    }

    const result = await deleteTaskItem(item.id);
    if (result.success) {
      toast.success("Tâche supprimée avec succès");
      if (onItemUpdated) {
        onItemUpdated();
      } else {
        router.refresh();
      }
    } else {
      toast.error(result.error || "Erreur lors de la suppression");
    }
  };

  const handleStatusChange = async (newStatus: "EN_ATTENTE" | "EN_COURS" | "BLOQUE" | "TERMINE" | "SUCCES" | "ECHEC") => {
    // Utiliser startTransition pour éviter le rechargement visible
    startTransition(async () => {
      const result = await updateTaskItemStatus({ itemId: item.id, status: newStatus });
      if (result.success) {
        toast.success(`Statut changé en "${statusLabels[newStatus]}"`);
        // Toujours utiliser onItemUpdated si disponible pour éviter le rechargement complet
        if (onItemUpdated) {
          onItemUpdated();
        } else {
          // Seulement si onItemUpdated n'est pas fourni, utiliser router.refresh()
          router.refresh();
        }
      } else {
        toast.error(result.error || "Erreur lors du changement de statut");
      }
    });
  };

  // Utiliser fullItem si disponible, sinon construire un objet minimal
  const itemData = fullItem || {
    id: item.id,
    title: item.title || "",
    taskId: item.taskId,
    status: "EN_ATTENTE" as const,
    harpitemId: null,
    harpitem: null,
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="h-8 w-8 p-0 hover:bg-gray-100"
            title="Actions"
          >
            <span className="sr-only">Ouvrir le menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          align="end" 
          className="w-48 z-[102]"
          onClick={(e) => e.stopPropagation()}
        >
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {/* Sous-menu pour changer le statut */}
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Circle className="mr-2 h-4 w-4" />
              Changer le statut
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem
                onSelect={() => handleStatusChange("EN_ATTENTE")}
                className={currentStatus === "EN_ATTENTE" ? "bg-gray-100" : ""}
              >
                En attente
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => handleStatusChange("EN_COURS")}
                className={currentStatus === "EN_COURS" ? "bg-gray-100" : ""}
              >
                En cours
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => handleStatusChange("BLOQUE")}
                className={currentStatus === "BLOQUE" ? "bg-gray-100" : ""}
              >
                Bloqué
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => handleStatusChange("TERMINE")}
                className={currentStatus === "TERMINE" ? "bg-gray-100" : ""}
              >
                Terminé
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => handleStatusChange("SUCCES")}
                className={currentStatus === "SUCCES" ? "bg-gray-100" : ""}
              >
                Succès
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => handleStatusChange("ECHEC")}
                className={currentStatus === "ECHEC" ? "bg-gray-100" : ""}
              >
                Échec
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();
              setEditOpen(true);
            }}
          >
            <Pencil className="mr-2 h-4 w-4" />
            Modifier
          </DropdownMenuItem>
          
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();
              handleDelete();
            }}
            className="text-red-600 focus:text-red-600"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Supprimer
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      
      <EditTaskItemDialog 
        item={itemData}
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open);
          if (!open && onItemUpdated) {
            onItemUpdated();
          }
        }}
      />
    </>
  );
}
