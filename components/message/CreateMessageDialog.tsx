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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import { createMessage } from '@/lib/actions/message-actions';
import { toast } from 'react-toastify';

export function CreateMessageDialog() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Initialiser avec la date actuelle
  const now = new Date();
  const formatDateForInput = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const [msg, setMsg] = useState("");
  const [fromdate, setFromdate] = useState(formatDateForInput(now));
  const [todate, setTodate] = useState(formatDateForInput(new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000))); // +7 jours par défaut
  const [statut, setStatut] = useState<string>("ACTIF");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});

    const formData = new FormData();
    formData.append("msg", msg);
    formData.append("fromdate", fromdate);
    formData.append("todate", todate);
    formData.append("statut", statut);

    startTransition(async () => {
      const result = await createMessage(formData);

      if (result.success) {
        toast.success(result.message);
        setOpen(false);
        // Réinitialiser le formulaire
        setMsg("");
        setFromdate(formatDateForInput(now));
        setTodate(formatDateForInput(new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)));
        setStatut("ACTIF");
        router.refresh();
      } else {
        toast.error(result.error || "Erreur lors de la création du message");
        if (result.error) {
          setErrors({ general: result.error });
        }
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-orange-500 hover:bg-orange-600 text-white">
          <Plus className="h-4 w-4 mr-2" />
          Créer un message
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader className="space-y-0">
          <DialogTitle className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-2 rounded-t-md -mx-6 -mt-6">
            Créer un nouveau message
          </DialogTitle>
          <DialogDescription className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-1.5 rounded-b-md -mx-6 mb-4">
            Ajoutez un nouveau message à afficher sur la page d'accueil
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs sm:text-sm font-semibold text-slate-700 uppercase tracking-wide flex items-center gap-2 bg-slate-100 px-2 py-1 rounded-t-md">
                Message
              </Label>
              <Input
                value={msg}
                onChange={(e) => setMsg(e.target.value)}
                className="w-full border-slate-300 text-slate-900 font-medium focus:border-orange-500 focus:ring-orange-500"
                placeholder="Message à afficher"
                required
                maxLength={255}
              />
              {errors.msg && (
                <p className="text-sm text-red-600">{errors.msg}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-xs sm:text-sm font-semibold text-slate-700 uppercase tracking-wide flex items-center gap-2 bg-slate-100 px-2 py-1 rounded-t-md">
                Date de début
              </Label>
              <Input
                type="datetime-local"
                value={fromdate}
                onChange={(e) => setFromdate(e.target.value)}
                className="w-full border-slate-300 text-slate-900 font-medium focus:border-orange-500 focus:ring-orange-500"
                required
              />
              {errors.fromdate && (
                <p className="text-sm text-red-600">{errors.fromdate}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-xs sm:text-sm font-semibold text-slate-700 uppercase tracking-wide flex items-center gap-2 bg-slate-100 px-2 py-1 rounded-t-md">
                Date de fin
              </Label>
              <Input
                type="datetime-local"
                value={todate}
                onChange={(e) => setTodate(e.target.value)}
                className="w-full border-slate-300 text-slate-900 font-medium focus:border-orange-500 focus:ring-orange-500"
                required
              />
              {errors.todate && (
                <p className="text-sm text-red-600">{errors.todate}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-xs sm:text-sm font-semibold text-slate-700 uppercase tracking-wide flex items-center gap-2 bg-slate-100 px-2 py-1 rounded-t-md">
                Statut
              </Label>
              <Select value={statut} onValueChange={setStatut}>
                <SelectTrigger className="w-full border-slate-300 text-slate-900 font-medium focus:border-orange-500 focus:ring-orange-500">
                  <SelectValue placeholder="Sélectionner un statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIF">ACTIF</SelectItem>
                  <SelectItem value="INACTIF">INACTIF</SelectItem>
                </SelectContent>
              </Select>
              {errors.statut && (
                <p className="text-sm text-red-600">{errors.statut}</p>
              )}
            </div>

            {errors.general && (
              <p className="text-sm text-red-600">{errors.general}</p>
            )}
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

