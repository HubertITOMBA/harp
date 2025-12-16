"use client";

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";
import { createItem } from '@/lib/actions/item-actions';
import { toast } from 'react-toastify';

export function CreateItemDialog() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});

    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await createItem(formData);

      if (result.success) {
        toast.success(result.message);
        setOpen(false);
        router.refresh();
        // Réinitialiser le formulaire
        e.currentTarget.reset();
      } else {
        toast.error(result.error || "Erreur lors de la création de l'item");
        if (result.error) {
          setErrors({ descr: result.error });
        }
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-orange-500 hover:bg-orange-600 text-white">
          <Plus className="h-4 w-4 mr-2" />
          Créer un item
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader className="space-y-0">
          <DialogTitle className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-2 rounded-t-md -mx-6 -mt-6">
            Créer un nouvel item
          </DialogTitle>
          <DialogDescription className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-1.5 rounded-b-md -mx-6 mb-4">
            Ajoutez un nouvel item réutilisable pour les chrono-tâches
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs sm:text-sm font-semibold text-slate-700 uppercase tracking-wide flex items-center gap-2 bg-slate-100 px-2 py-1 rounded-t-md">
                Description
              </Label>
              <Input
                name="descr"
                className="w-full border-slate-300 text-slate-900 font-medium focus:border-orange-500 focus:ring-orange-500"
                placeholder="Description de l'item"
                required
                maxLength={255}
              />
              {errors.descr && (
                <p className="text-sm text-red-600">{errors.descr}</p>
              )}
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              {isPending ? "Création..." : "Créer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

