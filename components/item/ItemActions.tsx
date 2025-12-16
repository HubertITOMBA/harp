"use client";

import { useState } from 'react';
import { EditItemDialog } from './EditItemDialog';
import { ViewItemDialog } from './ViewItemDialog';
import { ActionsDropdown, ActionItem } from '@/components/ui/actions-dropdown';
import { Eye, Pencil, Trash2 } from "lucide-react";
import { deleteItem } from '@/lib/actions/item-actions';
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation';

interface ItemActionsProps {
  item: {
    id: number;
    descr: string;
    _count?: {
      taskItems: number;
    };
  };
}

export function ItemActions({ item }: ItemActionsProps) {
  const router = useRouter();
  const [viewOpen, setViewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer l'item "${item.descr}" ?`)) {
      return;
    }

    const result = await deleteItem(item.id);
    if (result.success) {
      toast.success(result.message);
      router.refresh();
    } else {
      toast.error(result.error || "Erreur lors de la suppression");
    }
  };

  const actions: ActionItem[] = [
    {
      label: "Voir",
      icon: <Eye className="h-4 w-4" />,
      onClick: () => setViewOpen(true),
    },
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
      <ActionsDropdown actions={actions} />
      
      <ViewItemDialog 
        itemId={item.id}
        open={viewOpen}
        onOpenChange={setViewOpen}
      />
      
      <EditItemDialog 
        item={item}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
    </>
  );
}

