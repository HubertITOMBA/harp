"use client";

import { EditUserDialog } from './EditUserDialog';
import { Button } from '@/components/ui/button';
import { Eye, UserCheck, UserX } from 'lucide-react';
import { toggleUserStatus } from '@/actions/toggle-user-status';
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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

  return (
    <div className="flex items-center gap-1 sm:gap-2">
      <Button
        asChild
        variant="outline"
        size="sm"
        className="h-7 w-7 sm:h-8 sm:w-8 p-0 border-orange-300 hover:bg-orange-50"
        title="Voir"
      >
        <Link href={`/list/users/${user.netid}`}>
          <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
        </Link>
      </Button>
      <EditUserDialog user={user} />
      <Button
        variant="outline"
        size="sm"
        className={`h-7 w-7 sm:h-8 sm:w-8 p-0 ${isDisabled ? 'border-green-300 hover:bg-green-50' : 'border-red-300 hover:bg-red-50'}`}
        title={isDisabled ? "Réactiver" : "Désactiver"}
        onClick={handleToggleStatus}
      >
        {isDisabled ? (
          <UserCheck className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
        ) : (
          <UserX className="h-3 w-3 sm:h-4 sm:w-4 text-red-600" />
        )}
      </Button>
    </div>
  );
}

