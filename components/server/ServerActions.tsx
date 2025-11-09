"use client";

import { EditServerDialog } from './EditServerDialog';
import { Button } from '@/components/ui/button';
import { Eye, Server, ServerOff } from 'lucide-react';
import { toggleServerStatus } from '@/actions/toggle-server-status';
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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

  return (
    <div className="flex items-center gap-1 sm:gap-2">
      <Button
        asChild
        variant="outline"
        size="sm"
        className="h-7 w-7 sm:h-8 sm:w-8 p-0 border-orange-300 hover:bg-orange-50"
        title="Voir"
      >
        <Link href={`/list/servers/${server.srv}`}>
          <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
        </Link>
      </Button>
      <EditServerDialog server={server} />
      <Button
        variant="outline"
        size="sm"
        className={`h-7 w-7 sm:h-8 sm:w-8 p-0 ${isDisabled ? 'border-green-300 hover:bg-green-50' : 'border-red-300 hover:bg-red-50'}`}
        title={isDisabled ? "Réactiver" : "Désactiver"}
        onClick={handleToggleStatus}
      >
        {isDisabled ? (
          <Server className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
        ) : (
          <ServerOff className="h-3 w-3 sm:h-4 sm:w-4 text-red-600" />
        )}
      </Button>
    </div>
  );
}

