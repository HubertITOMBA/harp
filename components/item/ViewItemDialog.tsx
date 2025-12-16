"use client";

import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { getItemById } from '@/lib/actions/item-actions';
import { Info } from 'lucide-react';

interface ViewItemDialogProps {
  itemId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ViewItemDialog({ itemId, open, onOpenChange }: ViewItemDialogProps) {
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && itemId) {
      setLoading(true);
      setError(null);
      getItemById(itemId)
        .then((data) => {
          if (data) {
            setItem(data);
          } else {
            setError("Item non trouvé");
          }
        })
        .catch((err) => {
          console.error("Erreur lors du chargement de l'item:", err);
          setError("Erreur lors du chargement de l'item");
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [open, itemId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader className="space-y-0">
          <DialogTitle className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-2 rounded-t-md -mx-6 -mt-6">
            Détails de l'item
          </DialogTitle>
          <DialogDescription className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-1.5 rounded-b-md -mx-6 mb-4">
            Informations complètes de l'item
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
          </div>
        )}

        {error && (
          <div className="py-4">
            <p className="text-red-600 text-center">{error}</p>
          </div>
        )}

        {!loading && !error && item && (
          <div className="space-y-4">
            <div className="space-y-1">
              <Label className="text-[9px] sm:text-[10px] font-semibold text-slate-700 uppercase tracking-wide flex items-center gap-1 sm:gap-2 bg-slate-100 px-2 py-1 rounded-t-md">
                <Info className="h-3 w-3 sm:h-4 sm:w-4 text-orange-600" />
                Description
              </Label>
              <div className="p-2 sm:p-2.5 bg-orange-50 rounded-md rounded-tl-none border border-orange-200 border-t-0 text-xs font-medium text-slate-900 font-mono shadow-sm">
                {item.descr}
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-[9px] sm:text-[10px] font-semibold text-slate-700 uppercase tracking-wide flex items-center gap-1 sm:gap-2 bg-slate-100 px-2 py-1 rounded-t-md">
                <Info className="h-3 w-3 sm:h-4 sm:w-4 text-orange-600" />
                Nombre d'utilisations
              </Label>
              <div className="p-2 sm:p-2.5 bg-orange-50 rounded-md rounded-tl-none border border-orange-200 border-t-0 text-xs font-medium text-slate-900 font-mono shadow-sm">
                {item._count?.taskItems || 0} tâche(s)
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-[9px] sm:text-[10px] font-semibold text-slate-700 uppercase tracking-wide flex items-center gap-1 sm:gap-2 bg-slate-100 px-2 py-1 rounded-t-md">
                <Info className="h-3 w-3 sm:h-4 sm:w-4 text-orange-600" />
                Date de création
              </Label>
              <div className="p-2 sm:p-2.5 bg-orange-50 rounded-md rounded-tl-none border border-orange-200 border-t-0 text-xs font-medium text-slate-900 font-mono shadow-sm">
                {new Intl.DateTimeFormat("fr-FR", {
                  dateStyle: "short",
                  timeStyle: "short",
                }).format(new Date(item.createdAt))}
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-[9px] sm:text-[10px] font-semibold text-slate-700 uppercase tracking-wide flex items-center gap-1 sm:gap-2 bg-slate-100 px-2 py-1 rounded-t-md">
                <Info className="h-3 w-3 sm:h-4 sm:w-4 text-orange-600" />
                Dernière modification
              </Label>
              <div className="p-2 sm:p-2.5 bg-orange-50 rounded-md rounded-tl-none border border-orange-200 border-t-0 text-xs font-medium text-slate-900 font-mono shadow-sm">
                {new Intl.DateTimeFormat("fr-FR", {
                  dateStyle: "short",
                  timeStyle: "short",
                }).format(new Date(item.updatedAt))}
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="bg-slate-50 hover:bg-slate-100 border-slate-300 text-slate-700 hover:text-slate-900 text-xs sm:text-sm shadow-sm"
          >
            Fermer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

