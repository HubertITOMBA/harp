"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FileText, ListTodo, Calendar, Clock, CheckSquare, MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const statusLabels: Record<string, string> = {
  EN_ATTENTE: "En attente",
  EN_COURS: "En cours",
  BLOQUE: "Bloqué",
  TERMINE: "Terminé",
  SUCCES: "Succès",
  ECHEC: "Échec",
};

const statusColors: Record<string, string> = {
  EN_ATTENTE: "bg-gray-500",
  EN_COURS: "bg-blue-500",
  BLOQUE: "bg-red-500",
  TERMINE: "bg-yellow-500",
  SUCCES: "bg-green-500",
  ECHEC: "bg-red-600",
};

const formatDateTime = (date: Date | string | null | undefined): string => {
  if (!date) return "—";
  return new Date(date).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

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
  predecessor: {
    id: number;
    order: number;
    harpitem: {
      descr: string;
    } | null;
  } | null;
}

interface ViewUserTaskDialogProps {
  task: Task;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Dialog en lecture seule affichant tous les détails de la tâche assignée
 */
export function ViewUserTaskDialog({ task, open, onOpenChange }: ViewUserTaskDialogProps) {
  const description = task.harpitem?.descr || null;
  const predecessorDescr = task.predecessor?.harpitem?.descr || null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-0">
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold text-slate-800">
            <FileText className="h-5 w-5 text-orange-600" />
            Détails de la tâche
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
              Chrono-tâche
            </p>
            <p className="text-sm font-medium text-slate-900">
              {task.task.title} <span className="text-slate-400">(ID: {task.task.id})</span>
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 flex items-center gap-1">
              <ListTodo className="h-3.5 w-3.5" />
              Description
            </p>
            <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-800 whitespace-pre-wrap">
              {description || "Aucune description disponible."}
            </div>
          </div>

          {predecessorDescr && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                Tâche prédécesseur
              </p>
              <div className="rounded-md border border-slate-200 bg-amber-50/50 p-3 text-sm text-slate-700 whitespace-pre-wrap">
                {predecessorDescr}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1 flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                Date de début
              </p>
              <p className="text-sm text-slate-800">{formatDateTime(task.startDate)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1 flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                Date de fin
              </p>
              <p className="text-sm text-slate-800">{formatDateTime(task.endDate)}</p>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 flex items-center gap-1">
              <CheckSquare className="h-3.5 w-3.5" />
              Statut
            </p>
            <Badge className={`${statusColors[task.status] || "bg-gray-500"} text-white text-xs`}>
              {statusLabels[task.status] ?? task.status}
            </Badge>
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 flex items-center gap-1">
              <MessageSquare className="h-3.5 w-3.5" />
              Commentaire
            </p>
            <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 whitespace-pre-wrap">
              {task.comment || "—"}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
