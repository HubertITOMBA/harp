"use client";

import { EditEnvDialog } from './EditEnvDialog';
import { Button } from '@/components/ui/button';
import { Eye, Server, ServerOff } from 'lucide-react';
import { toggleEnvStatus } from '@/actions/toggle-env-status';
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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

  return (
    <div className="flex items-center gap-1 sm:gap-2">
      <Button
        asChild
        variant="outline"
        size="sm"
        className="h-7 w-7 sm:h-8 sm:w-8 p-0 border-orange-300 hover:bg-orange-50"
        title="Voir"
      >
        <Link href={`/list/envs/${env.env}`}>
          <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
        </Link>
      </Button>
      <EditEnvDialog env={env as any} />
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

