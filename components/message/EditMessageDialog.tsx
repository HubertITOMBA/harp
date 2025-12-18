"use client";

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { updateMessage } from '@/lib/actions/message-actions';
import { toast } from 'react-toastify';

interface EditMessageDialogProps {
  message: {
    num: number;
    msg: string;
    fromdate: Date;
    todate: Date;
    statut: string;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditMessageDialog({ message, open, onOpenChange }: EditMessageDialogProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Formater les dates pour les inputs datetime-local
  const formatDateForInput = (date: Date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const [msg, setMsg] = useState(message.msg);
  const [fromdate, setFromdate] = useState(formatDateForInput(message.fromdate));
  const [todate, setTodate] = useState(formatDateForInput(message.todate));
  const [statut, setStatut] = useState(message.statut);

  useEffect(() => {
    if (open) {
      setMsg(message.msg);
      setFromdate(formatDateForInput(message.fromdate));
      setTodate(formatDateForInput(message.todate));
      setStatut(message.statut);
      setErrors({});
    }
  }, [open, message]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});

    const formData = new FormData();
    formData.append("num", message.num.toString());
    formData.append("msg", msg);
    formData.append("fromdate", fromdate);
    formData.append("todate", todate);
    formData.append("statut", statut);

    startTransition(async () => {
      const result = await updateMessage(formData);

      if (result.success) {
        toast.success(result.message);
        onOpenChange(false);
        router.refresh();
      } else {
        toast.error(result.error || "Erreur lors de la modification du message");
        if (result.error) {
          setErrors({ general: result.error });
        }
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader className="space-y-0">
          <DialogTitle className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-2 rounded-t-md -mx-6 -mt-6">
            Modifier le message
          </DialogTitle>
          <DialogDescription className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-1.5 rounded-b-md -mx-6 mb-4">
            Modifiez les informations du message
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
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              {isPending ? "Modification..." : "Modifier"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

