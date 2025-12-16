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
import { updateItem } from '@/lib/actions/item-actions';
import { toast } from 'react-toastify';

interface EditItemDialogProps {
  item: {
    id: number;
    descr: string;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditItemDialog({ item, open, onOpenChange }: EditItemDialogProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [descr, setDescr] = useState(item.descr);

  useEffect(() => {
    if (open) {
      setDescr(item.descr);
      setErrors({});
    }
  }, [open, item.descr]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});

    const formData = new FormData();
    formData.append("id", item.id.toString());
    formData.append("descr", descr);

    startTransition(async () => {
      const result = await updateItem(formData);

      if (result.success) {
        toast.success(result.message);
        onOpenChange(false);
        router.refresh();
      } else {
        toast.error(result.error || "Erreur lors de la modification de l'item");
        if (result.error) {
          setErrors({ descr: result.error });
        }
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader className="space-y-0">
          <DialogTitle className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-2 rounded-t-md -mx-6 -mt-6">
            Modifier l'item
          </DialogTitle>
          <DialogDescription className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-1.5 rounded-b-md -mx-6 mb-4">
            Modifiez les informations de l'item
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs sm:text-sm font-semibold text-slate-700 uppercase tracking-wide flex items-center gap-2 bg-slate-100 px-2 py-1 rounded-t-md">
                Description
              </Label>
              <Input
                value={descr}
                onChange={(e) => setDescr(e.target.value)}
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

