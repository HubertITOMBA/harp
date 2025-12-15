"use client";

import { useState } from 'react';
import { EditHarpItemDialog } from './EditHarpItemDialog';
import { ActionsDropdown, ActionItem } from '@/components/ui/actions-dropdown';
import { Pencil, Trash2 } from "lucide-react";
import { deleteHarpItem } from '@/actions/harpitems-actions';
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation';

interface HarpItemsActionsProps {
  item: {
    id: number;
    descr: string;
    _count: {
      taskItems: number;
    };
  };
}

export function HarpItemsActions({ item }: HarpItemsActionsProps) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);

  const handleDelete = async () => {
    if (item._count.taskItems > 0) {
      toast.error(`Impossible de supprimer cet item car il est utilisé dans ${item._count.taskItems} tâche(s)`);
      return;
    }

    if (!confirm(`Êtes-vous sûr de vouloir supprimer l'item "${item.descr}" ?`)) {
      return;
    }

    const result = await deleteHarpItem(item.id);
    if (result.success) {
      toast.success("Item supprimé avec succès");
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
      disabled: item._count.taskItems > 0,
    },
  ];

  return (
    <>
      <div className="flex justify-center">
        <ActionsDropdown actions={actions} />
      </div>
      
      <EditHarpItemDialog 
        item={item}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
    </>
  );
}
