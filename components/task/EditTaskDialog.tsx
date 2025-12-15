"use client";

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { FormDialog } from '@/components/ui/form-dialog';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Calendar } from "lucide-react";
import { updateTask } from '@/actions/task-actions';
import { toast } from 'react-toastify';

interface EditTaskDialogProps {
  task: {
    id: number;
    title: string;
    descr: string | null;
    status: "EN_ATTENTE" | "EN_COURS" | "BLOQUE" | "TERMINE" | "SUCCES" | "ECHEC";
    date?: Date | string | null;
    estimatedDuration?: number | null;
    effectiveDuration?: number | null;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditTaskDialog({ task, open, onOpenChange }: EditTaskDialogProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const formatDateTimeLocal = (date: Date | string | null | undefined): string => {
    if (!date) return "";
    const d = new Date(date);
    if (isNaN(d.getTime())) return "";
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes} minute${minutes > 1 ? "s" : ""}`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (mins === 0) {
      return `${hours} heure${hours > 1 ? "s" : ""}`;
    }
    return `${hours} heure${hours > 1 ? "s" : ""} ${mins} minute${mins > 1 ? "s" : ""}`;
  };

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>,
    closeDialog: () => void
  ) => {
    e.preventDefault();
    setErrors({});
    
    const formData = new FormData(e.currentTarget);
    
    startTransition(async () => {
      const dateValue = formData.get("date") as string;
      const estimatedDurationValue = formData.get("estimatedDuration") as string;
      
      const result = await updateTask({
        id: task.id,
        title: formData.get("title") as string,
        descr: formData.get("descr") as string || null,
        date: dateValue ? new Date(dateValue) : null,
        estimatedDuration: estimatedDurationValue ? parseInt(estimatedDurationValue) : null,
      });
      
      if (result.success) {
        toast.success("Chrono-tâche mise à jour avec succès");
        closeDialog();
        router.refresh();
      } else {
        toast.error(result.error || "Erreur lors de la mise à jour");
        if (result.error) {
          setErrors({ general: result.error });
        }
      }
    });
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      trigger={null}
      title="Modifier la chrono-tâche"
      description="Modifiez les informations de la chrono-tâche"
      onSubmit={handleSubmit}
      submitLabel="Enregistrer"
      submitIcon={<Calendar className="h-4 w-4" />}
      isPending={isPending}
      maxWidth="2xl"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Titre */}
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="title" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-orange-600" />
            Titre <span className="text-red-500">*</span>
          </Label>
          <Input
            id="title"
            name="title"
            required
            defaultValue={task.title}
            className="bg-white"
            maxLength={255}
          />
        </div>

        {/* Date */}
        <div className="space-y-2">
          <Label htmlFor="date" className="text-sm font-semibold text-gray-700">
            Date de début prévue
          </Label>
          <Input
            id="date"
            name="date"
            type="datetime-local"
            defaultValue={task.date ? formatDateTimeLocal(task.date) : ""}
            className="bg-white"
          />
        </div>

        {/* Durée estimée */}
        <div className="space-y-2">
          <Label htmlFor="estimatedDuration" className="text-sm font-semibold text-gray-700">
            Durée estimée (minutes)
          </Label>
          <Input
            id="estimatedDuration"
            name="estimatedDuration"
            type="number"
            defaultValue={task.estimatedDuration || ""}
            className="bg-white"
            placeholder="Ex: 480"
            min="0"
          />
        </div>

        {/* Durée effective (lecture seule) */}
        {task.effectiveDuration !== null && task.effectiveDuration !== undefined && (
          <div className="space-y-2 md:col-span-2">
            <Label className="text-sm font-semibold text-gray-700">
              Durée effective (calculée automatiquement)
            </Label>
            <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700">
              {formatDuration(task.effectiveDuration)}
            </div>
          </div>
        )}

        {/* Description */}
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="descr" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            Description
          </Label>
          <textarea
            id="descr"
            name="descr"
            defaultValue={task.descr || ""}
            className="w-full min-h-[100px] px-3 py-2 border border-gray-300 rounded-md bg-white"
          />
        </div>
      </div>
    </FormDialog>
  );
}
