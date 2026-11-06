"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { deleteFamily } from "@/actions/family-admin";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type DeleteFamilyButtonProps = {
  id: number;
  typenv: string;
  typenvid: number | null;
  environmentCount: number;
  subroleCount: number;
  menuCount: number;
};

/**
 * Demande confirmation, puis laisse le serveur refuser toute famille encore liée.
 *
 * @param props - Identité affichée et comptes déjà lus pour la ligne
 */
export function DeleteFamilyButton({
  id,
  typenv,
  typenvid,
  environmentCount,
  subroleCount,
  menuCount,
}: DeleteFamilyButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const blocked = environmentCount > 0 || subroleCount > 0 || menuCount > 0;
  const label = typenvid == null ? `${typenv} (sans typenvid)` : `${typenv} (typenvid ${typenvid})`;
  const blockReason = deletionBlockReason(environmentCount, subroleCount, menuCount);

  function confirmDelete(): void {
    startTransition(async () => {
      const result = await deleteFamily(id);
      if (!result.success) {
        toast.error(result.error || "Suppression refusée");
        return;
      }
      toast.success(result.message || "Famille supprimée");
      setOpen(false);
      router.refresh();
    });
  }

  const deleteButton = (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={blocked}
      className="border-red-300 text-red-700 hover:bg-red-50 disabled:pointer-events-none disabled:opacity-100 disabled:border-slate-500 disabled:bg-slate-100 disabled:text-slate-800 disabled:shadow-none"
      onClick={() => setOpen(true)}
    >
      Supprimer
    </Button>
  );

  return (
    <>
      {blocked ? (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex cursor-not-allowed" tabIndex={0}>{deleteButton}</span>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs bg-slate-900 text-white">{blockReason}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : deleteButton}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader className="space-y-0">
            <DialogTitle className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-2 rounded-t-md -mx-6 -mt-6">
              Supprimer la famille
            </DialogTitle>
            <DialogDescription className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-1.5 rounded-b-md -mx-6 mb-4">
              {label}
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm text-slate-800">
            Confirmer la suppression de {label}. Les environnements, menus, rôles et autorisations ne sont pas concernés. Le serveur revérifie ces absences avant d&apos;effacer la ligne.
          </p>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={pending}>
              Annuler
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={pending}
              onClick={confirmDelete}
            >
              Confirmer la suppression
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/**
 * Explique pourquoi la suppression est inactive.
 *
 * @param environmentCount - Environnements liés
 * @param subroleCount - Liens de sous-rôles
 * @param menuCount - Menus de niveau 3 de même display
 * @returns Texte d'aide
 */
function deletionBlockReason(
  environmentCount: number,
  subroleCount: number,
  menuCount: number
): string {
  const parts: string[] = [];
  if (environmentCount > 0) {
    parts.push(`${environmentCount} environnement${environmentCount > 1 ? "s" : ""}`);
  }
  if (subroleCount > 0) {
    parts.push(`${subroleCount} lien${subroleCount > 1 ? "s" : ""} RBAC`);
  }
  if (menuCount > 0) {
    parts.push(`${menuCount} menu${menuCount > 1 ? "s" : ""} de niveau 3`);
  }
  return `Suppression impossible : ${parts.join(", ")}.`;
}
