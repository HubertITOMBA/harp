"use client";

import { useState } from 'react';
import { EditEnvDialog } from './EditEnvDialog';
import { ActionsDropdown, ActionItem } from '@/components/ui/actions-dropdown';
import { Eye, Pencil, Server, ServerOff } from 'lucide-react';
import { toggleEnvStatus } from '@/actions/toggle-env-status';
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation';

interface EnvActionsProps {
  env: {
    id: number;
    env: string;
    statenvId: number | null;
    aliasql: string | null;
    oraschema: string | null;
    orarelease: string | null;
    url: string | null;
    appli: string | null;
    psversion: string | null;
    ptversion: string | null;
    harprelease: string | null;
    pshome: string | null;
    volum: string | null;
    descr: string | null;
    anonym: string | null;
    edi: string | null;
    typenvid: number | null;
  };
}

export function EnvActions({ env }: EnvActionsProps) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const isDisabled = env.statenvId === 99 || false;

  const handleToggleStatus = async () => {
    if (isDisabled) {
      if (!confirm(`Êtes-vous sûr de vouloir réactiver l'environnement ${env.env} ?`)) {
        return;
      }
    } else {
      if (!confirm(`Êtes-vous sûr de vouloir désactiver l'environnement ${env.env} ?`)) {
        return;
      }
    }

    const result = await toggleEnvStatus(env.id, !isDisabled);
    
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
      onClick: () => router.push(`/list/envs/${env.env}`),
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
      
      <EditEnvDialog 
        env={env as any}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
    </>
  );
}

