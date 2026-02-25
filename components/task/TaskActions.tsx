"use client";

import { useState } from 'react';
import Link from 'next/link';
import { EditTaskDialog } from './EditTaskDialog';
import { ActionsDropdown, ActionItem } from '@/components/ui/actions-dropdown';
import { Button } from '@/components/ui/button';
import { Eye, Pencil, Trash2 } from "lucide-react";
import { deleteTask } from '@/actions/task-actions';
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation';

interface TaskActionsProps {
  task: {
    id: number;
    title: string;
    descr: string | null;
    status: "EN_ATTENTE" | "EN_COURS" | "BLOQUE" | "TERMINE" | "SUCCES" | "ECHEC";
    date?: Date | string | null;
    estimatedDuration?: number | null;
    effectiveDuration?: number | null;
  };
}

export function TaskActions({ task }: TaskActionsProps) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer la chrono-tâche "${task.title}" ?`)) {
      return;
    }

    const result = await deleteTask(task.id);
    if (result.success) {
      toast.success("Chrono-tâche supprimée avec succès");
      router.refresh();
    } else {
      toast.error(result.error || "Erreur lors de la suppression");
    }
  };

  const actions: ActionItem[] = [
    {
      label: "Modifier",
      icon: <Pencil className="h-4 w-4" />,
      onClick: () => setEditOpen(true),
    },
    {
      label: "Supprimer",
      icon: <Trash2 className="h-4 w-4" />,
      onClick: handleDelete,
      variant: "destructive",
    },
  ];

  return (
    <>
      <div className="flex items-center justify-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="h-7 w-7 p-0 text-orange-600 hover:bg-orange-100"
          title="Voir les détails de la chrono-tâche"
        >
          <Link href={`/list/tasks/${task.id}`}>
            <Eye className="h-3.5 w-3.5" />
          </Link>
        </Button>
        <ActionsDropdown actions={actions} />
      </div>
      
      <EditTaskDialog 
        task={task}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
    </>
  );
}
