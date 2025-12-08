"use client";

import { useState } from 'react';
import { EditServerDialog } from './EditServerDialog';
import { ActionsDropdown, ActionItem } from '@/components/ui/actions-dropdown';
import { Eye, Pencil, Server, ServerOff } from 'lucide-react';
import { toggleServerStatus } from '@/actions/toggle-server-status';
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation';

interface ServerActionsProps {
  server: {
    id: number;
    srv: string;
    statenvId: number | null;
    ip: string;
    pshome: string;
    os: string | null;
    psuser: string | null;
    domain: string | null;
  };
}

export function ServerActions({ server }: ServerActionsProps) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const isDisabled = server.statenvId === 99 || false;

  const handleToggleStatus = async () => {
    if (isDisabled) {
      if (!confirm(`Êtes-vous sûr de vouloir réactiver le serveur ${server.srv} ?`)) {
        return;
      }
    } else {
      if (!confirm(`Êtes-vous sûr de vouloir désactiver le serveur ${server.srv} ?`)) {
        return;
      }
    }

    const result = await toggleServerStatus(server.id, !isDisabled);
    
    if (result.success) {
      toast.success(result.message);
      router.refresh();
    } else {
      toast.error(result.error || "Erreur lors de la modification du statut");
    }
  };

  const actions: ActionItem[] = [
    {
      label: "Voir",
      icon: <Eye className="h-4 w-4" />,
      onClick: () => router.push(`/list/servers/${server.srv}`),
    },
    {
      label: "Modifier",
      icon: <Pencil className="h-4 w-4" />,
      onClick: () => setEditOpen(true),
    },
    {
      label: isDisabled ? "Réactiver" : "Désactiver",
      icon: isDisabled ? (
        <Server className="h-4 w-4" />
      ) : (
        <ServerOff className="h-4 w-4" />
      ),
      onClick: handleToggleStatus,
      variant: isDisabled ? "default" : "destructive",
    },
  ];

  return (
    <>
      <ActionsDropdown actions={actions} />
      
      <EditServerDialog 
        server={server}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
    </>
  );
}

