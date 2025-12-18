"use client";

import { useState } from 'react';
import { EditMessageDialog } from './EditMessageDialog';
import { ViewMessageDialog } from './ViewMessageDialog';
import { ActionsDropdown, ActionItem } from '@/components/ui/actions-dropdown';
import { Eye, Pencil, Trash2 } from "lucide-react";
import { deleteMessage } from '@/lib/actions/message-actions';
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation';

interface MessageActionsProps {
  message: {
    num: number;
    msg: string;
    fromdate: Date;
    todate: Date;
    statut: string;
  };
}

/**
 * Composant d'actions pour un message (voir, éditer, supprimer)
 * 
 * @param message - Le message pour lequel afficher les actions
 */
export function MessageActions({ message }: MessageActionsProps) {
  const router = useRouter();
  const [viewOpen, setViewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer ce message ?`)) {
      return;
    }

    const result = await deleteMessage(message.num);
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
      
      <ViewMessageDialog 
        messageId={message.num}
        open={viewOpen}
        onOpenChange={setViewOpen}
      />
      
      <EditMessageDialog 
        message={message}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
    </>
  );
}

