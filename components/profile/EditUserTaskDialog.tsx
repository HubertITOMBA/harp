"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, Clock, CheckSquare, Loader2, MessageSquare } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { updateUserTask } from "@/actions/user-task-actions";
import { toast } from 'react-toastify';

interface Task {
  id: number;
  order: number;
  startDate: Date | string | null;
  endDate: Date | string | null;
  status: "EN_ATTENTE" | "EN_COURS" | "BLOQUE" | "TERMINE" | "SUCCES" | "ECHEC";
  comment: string | null;
  task: {
    id: number;
    title: string;
    status: string;
  };
  harpitem: {
    id: number;
    descr: string;
  } | null;
}

interface EditUserTaskDialogProps {
  task: Task;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTaskUpdated: (task: Task) => void;
}

const statusLabels = {
  EN_ATTENTE: "En attente",
  EN_COURS: "En cours",
  BLOQUE: "Bloqué",
  TERMINE: "Terminé",
  SUCCES: "Succès",
  ECHEC: "Échec",
};

/**
 * Dialog pour modifier une tâche utilisateur (date début, date fin, statut)
 */
export function EditUserTaskDialog({ task, open, onOpenChange, onTaskUpdated }: EditUserTaskDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState<string>("");
  const [startTime, setStartTime] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [endTime, setEndTime] = useState<string>("");
  const [status, setStatus] = useState<Task["status"]>(task.status);
  const [comment, setComment] = useState<string>(task.comment || "");

  // Initialiser les valeurs depuis la tâche
  useEffect(() => {
    if (task.startDate) {
      const start = new Date(task.startDate);
      setStartDate(start.toISOString().split('T')[0]);
      setStartTime(start.toTimeString().slice(0, 5));
    } else {
      setStartDate("");
      setStartTime("");
    }

    if (task.endDate) {
      const end = new Date(task.endDate);
      setEndDate(end.toISOString().split('T')[0]);
      setEndTime(end.toTimeString().slice(0, 5));
    } else {
      setEndDate("");
      setEndTime("");
    }

    setStatus(task.status);
    setComment(task.comment || "");
  }, [task, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Construire les dates complètes avec date et heure
      const startDateTime = startDate && startTime 
        ? `${startDate}T${startTime}:00`
        : startDate 
        ? `${startDate}T00:00:00`
        : null;

      const endDateTime = endDate && endTime 
        ? `${endDate}T${endTime}:00`
        : endDate 
        ? `${endDate}T00:00:00`
        : null;

      const formData = new FormData();
      formData.append("id", task.id.toString());
      if (startDateTime) {
        formData.append("startDate", startDateTime);
      } else {
        formData.append("startDate", "");
      }
      if (endDateTime) {
        formData.append("endDate", endDateTime);
      } else {
        formData.append("endDate", "");
      }
      formData.append("status", status);
      formData.append("comment", comment || "");

      const result = await updateUserTask(formData);

      if (result.success) {
        // Mettre à jour la tâche avec les nouvelles valeurs
        const updatedTask: Task = {
          ...task,
          startDate: startDateTime ? new Date(startDateTime) : null,
          endDate: endDateTime ? new Date(endDateTime) : null,
          status: status,
          comment: comment || null,
        };
        onTaskUpdated(updatedTask);
        router.refresh();
      } else {
        toast.error(result.error || "Erreur lors de la mise à jour");
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors de la mise à jour de la tâche");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-0">
          <DialogTitle className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-2 rounded-t-md -mx-6 -mt-6">
            Modifier ma tâche
          </DialogTitle>
          <DialogDescription className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-1.5 rounded-b-md -mx-6 mb-4">
            {task.harpitem?.descr || `Tâche #${task.order}`} - {task.task.title}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Date de début */}
          <div className="space-y-2">
            <Label className="text-xs sm:text-sm font-semibold text-slate-700 uppercase tracking-wide flex items-center gap-2 bg-slate-100 px-2 py-1 rounded-t-md">
              <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-orange-600" />
              Date de début
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full border-slate-300 text-slate-900 font-medium focus:border-orange-500 focus:ring-orange-500"
              />
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full border-slate-300 text-slate-900 font-medium focus:border-orange-500 focus:ring-orange-500"
              />
            </div>
          </div>

          {/* Date de fin */}
          <div className="space-y-2">
            <Label className="text-xs sm:text-sm font-semibold text-slate-700 uppercase tracking-wide flex items-center gap-2 bg-slate-100 px-2 py-1 rounded-t-md">
              <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-orange-600" />
              Date de fin
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full border-slate-300 text-slate-900 font-medium focus:border-orange-500 focus:ring-orange-500"
              />
              <Input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full border-slate-300 text-slate-900 font-medium focus:border-orange-500 focus:ring-orange-500"
              />
            </div>
          </div>

          {/* Statut */}
          <div className="space-y-2">
            <Label className="text-xs sm:text-sm font-semibold text-slate-700 uppercase tracking-wide flex items-center gap-2 bg-slate-100 px-2 py-1 rounded-t-md">
              <CheckSquare className="h-3 w-3 sm:h-4 sm:w-4 text-orange-600" />
              Statut
            </Label>
            <Select value={status} onValueChange={(value) => setStatus(value as Task["status"])}>
              <SelectTrigger className="w-full border-slate-300 text-slate-900 font-medium focus:border-orange-500 focus:ring-orange-500">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(statusLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Commentaire */}
          <div className="space-y-2">
            <Label className="text-xs sm:text-sm font-semibold text-slate-700 uppercase tracking-wide flex items-center gap-2 bg-slate-100 px-2 py-1 rounded-t-md">
              <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4 text-orange-600" />
              Commentaire
            </Label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Ajouter un commentaire (optionnel)..."
              className="w-full border-slate-300 text-slate-900 font-medium focus:border-orange-500 focus:ring-orange-500 min-h-[80px] resize-y"
              rows={3}
            />
          </div>

          {/* Boutons */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="bg-slate-50 hover:bg-slate-100 border-slate-300 text-slate-700 hover:text-slate-900 text-xs sm:text-sm shadow-sm"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-orange-500 hover:bg-orange-600 text-white text-xs sm:text-sm shadow-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                "Enregistrer"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

