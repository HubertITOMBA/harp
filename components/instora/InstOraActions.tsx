"use client";

import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Eye, Pencil, Database, Ban } from "lucide-react";
import { ViewInstOraDialog } from './ViewInstOraDialog';
import { EditInstOraDialog } from './EditInstOraDialog';
import { toggleInstOraStatus } from '@/actions/toggle-instora-status';
import { toast } from 'react-toastify';

interface InstOraActionsProps {
  instora: {
    id: number;
    oracle_sid: string;
    descr: string | null;
    serverId: number | null;
    typebaseId: number | null;
    harpserve: {
      id: number;
      statenvId: number | null;
    } | null;
  };
}

export function InstOraActions({ instora }: InstOraActionsProps) {
  const router = useRouter();
  const isDisabled = instora.harpserve?.statenvId === 99 || false;

  const handleToggleStatus = async () => {
    if (isDisabled) {
      if (!confirm(`Êtes-vous sûr de vouloir réactiver l'instance ${instora.oracle_sid} ?`)) {
        return;
      }
    } else {
      if (!confirm(`Êtes-vous sûr de vouloir désactiver l'instance ${instora.oracle_sid} ?`)) {
        return;
      }
    }

    const result = await toggleInstOraStatus(instora.id, !isDisabled);
    
    if (result.success) {
      toast.success(result.message);
      router.refresh();
    } else {
      toast.error(result.error || "Erreur lors de la modification du statut");
    }
  };

  return (
    <div className="flex items-center gap-1 sm:gap-2">
      <ViewInstOraDialog instanceId={instora.id} instanceName={instora.oracle_sid} />
      <EditInstOraDialog instora={instora} />
      <Button
        variant="outline"
        size="sm"
        className={`h-7 w-7 sm:h-8 sm:w-8 p-0 ${isDisabled ? 'border-green-300 hover:bg-green-50' : 'border-red-300 hover:bg-red-50'}`}
        title={isDisabled ? "Réactiver" : "Désactiver"}
        onClick={handleToggleStatus}
      >
        {isDisabled ? (
          <Database className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
        ) : (
          <Ban className="h-3 w-3 sm:h-4 sm:w-4 text-red-600" />
        )}
      </Button>
    </div>
  );
}

