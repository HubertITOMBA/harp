"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FileText, ListTodo } from "lucide-react";

interface Task {
  id: number;
  order: number;
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

interface TaskDescriptionDialogProps {
  task: Task;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Dialog en lecture seule affichant la description complète de la tâche assignée
 */
export function TaskDescriptionDialog({ task, open, onOpenChange }: TaskDescriptionDialogProps) {
  const description = task.harpitem?.descr || null;
  const predecessorDescr = task.predecessor?.harpitem?.descr || null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] max-h-[85vh] overflow-y-auto">
        <DialogHeader className="space-y-0">
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold text-slate-800">
            <FileText className="h-5 w-5 text-orange-600" />
            Description de la tâche
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
