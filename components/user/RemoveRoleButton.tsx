"use client"

import { useTransition } from 'react'
import { Button } from "@/components/ui/button";
import { Trash2, Loader2 } from "lucide-react";
import { removeUserRole } from '@/actions/user-roles';
import { useRouter } from 'next/navigation';
import { toast } from "react-toastify";

interface RemoveRoleButtonProps {
  netid: string;
  role: string;
}

export function RemoveRoleButton({ netid, role }: RemoveRoleButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleRemove = () => {
    if (!confirm(`Êtes-vous sûr de vouloir retirer le rôle "${role}" de cet utilisateur ?`)) {
      return;
    }

    startTransition(async () => {
      const result = await removeUserRole(netid, role);
      
      if (result.success) {
        toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result.error || "Erreur lors du retrait du rôle");
      }
    });
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleRemove}
      disabled={isPending}
      className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
    >
      {isPending ? (
        <>
          <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 animate-spin" />
          <span className="hidden sm:inline">Retrait...</span>
        </>
      ) : (
        <>
          <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
          <span className="hidden sm:inline">Retirer</span>
        </>
      )}
    </Button>
  );
}

