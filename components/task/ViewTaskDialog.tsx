"use client";

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Plus } from "lucide-react";
import { getTaskById } from '@/actions/task-actions';
import { CreateTaskItemDialog } from './CreateTaskItemDialog';
import { TaskItemsTable } from './TaskItemsTable';
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation';

interface ViewTaskDialogProps {
  taskId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const statusColors = {
  EN_ATTENTE: "bg-gray-500",
  EN_COURS: "bg-blue-500",
  BLOQUE: "bg-red-500",
  TERMINE: "bg-yellow-500",
  SUCCES: "bg-green-500",
  ECHEC: "bg-red-600",
};

const statusLabels = {
  EN_ATTENTE: "En attente",
  EN_COURS: "En cours",
  BLOQUE: "Bloqué",
  TERMINE: "Terminé",
  SUCCES: "Succès",
  ECHEC: "Échec",
};

export function ViewTaskDialog({ taskId, open, onOpenChange }: ViewTaskDialogProps) {
  const router = useRouter();
  const [task, setTask] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [createItemOpen, setCreateItemOpen] = useState(false);

  useEffect(() => {
    if (open && taskId) {
      loadTask();
    }
  }, [open, taskId]);

  const loadTask = async () => {
    setLoading(true);
    const result = await getTaskById(taskId);
    if (result.success && result.data) {
      setTask(result.data);
    } else {
      toast.error(result.error || "Erreur lors du chargement");
    }
    setLoading(false);
  };


  if (!open) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto p-0">
          <DialogHeader className="space-y-0">
            <DialogTitle className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-2 rounded-t-md -mx-6 -mt-6 flex items-center gap-2 text-base">
              <Calendar className="h-4 w-4" />
              {loading ? "Chargement..." : task?.title || "Chrono-tâche"}
            </DialogTitle>
            {task && (
              <DialogDescription className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-1 rounded-b-md -mx-6 mb-3 text-xs">
                ID: {task.id} • {task.items?.length || 0} tâche{task.items?.length !== 1 ? "s" : ""} • Statut: {statusLabels[task.status]}
              </DialogDescription>
            )}
          </DialogHeader>
          <div className="px-6 pb-6">

            {loading ? (
              <div className="text-center py-6 text-sm">Chargement...</div>
            ) : task ? (
              <div className="space-y-3">
                {/* Description si présente */}
                {task.descr && (
                  <div className="bg-gray-50 p-2 rounded border text-xs">
                    <label className="text-xs font-semibold text-gray-700 mb-1 block">Description</label>
                    <div className="text-gray-900 text-xs">{task.descr}</div>
                  </div>
                )}

                {/* Tableau des tâches */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-sm font-semibold text-gray-800">Tâches ({task.items?.length || 0})</h3>
                    <Button
                      onClick={() => setCreateItemOpen(true)}
                      className="bg-orange-500 hover:bg-orange-600 text-white h-7 text-xs px-2"
                      size="sm"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Ajouter
                    </Button>
                  </div>

                  {task.items && task.items.length > 0 ? (
                    <TaskItemsTable
                      items={task.items}
                      taskId={taskId}
                      onItemUpdated={loadTask}
                    />
                  ) : (
                    <div className="text-center py-6 text-gray-500 border rounded-lg bg-gray-50 text-xs">
                      Aucune tâche pour cette chrono-tâche. Cliquez sur "Ajouter" pour commencer.
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-red-500 text-sm">
                Erreur lors du chargement de la chrono-tâche
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <CreateTaskItemDialog
        taskId={taskId}
        open={createItemOpen}
        onOpenChange={(open) => {
          setCreateItemOpen(open);
          if (!open) {
            loadTask();
          }
        }}
      />
    </>
  );
}
