"use client";

import { useState } from 'react';
import { EditUserDialog } from './EditUserDialog';
import { ActionsDropdown, ActionItem } from '@/components/ui/actions-dropdown';
import { Eye, Pencil, UserCheck, UserX } from 'lucide-react';
import { toggleUserStatus } from '@/actions/toggle-user-status';
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation';

interface UserActionsProps {
  user: {
    netid: string;
    mdp?: string;
    nom: string | null;
    prenom: string | null;
    email: string | null;
    unxid: string | null;
    oprid: string | null;
    pkeyfile: string | null;
    defpage: string | null;
    expunx: Date | null;
    expora: Date | null;
  };
}

export function UserActions({ user }: UserActionsProps) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const isDisabled = user.mdp?.startsWith('DISABLED_') || false;

  const handleToggleStatus = async () => {
    if (isDisabled) {
      if (!confirm(`Êtes-vous sûr de vouloir réactiver l'utilisateur ${user.netid} ?`)) {
        return;
      }
    } else {
      if (!confirm(`Êtes-vous sûr de vouloir désactiver l'utilisateur ${user.netid} ? Cette action empêchera l'utilisateur de se connecter.`)) {
        return;
      }
    }

    const result = await toggleUserStatus(user.netid, !isDisabled);
    
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
      onClick: () => router.push(`/list/users/${user.netid}`),
    },
    {
      label: "Modifier",
      icon: <Pencil className="h-4 w-4" />,
      onClick: () => setEditOpen(true),
    },
    {
      label: isDisabled ? "Réactiver" : "Désactiver",
      icon: isDisabled ? (
        <UserCheck className="h-4 w-4" />
      ) : (
        <UserX className="h-4 w-4" />
      ),
      onClick: handleToggleStatus,
      variant: isDisabled ? "default" : "destructive",
    },
  ];

  return (
    <>
      <ActionsDropdown actions={actions} />
      
      <EditUserDialog 
        user={user}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
    </>
  );
}

