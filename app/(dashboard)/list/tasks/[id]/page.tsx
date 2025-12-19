"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Plus, ArrowLeft, FileDown, Mail, CheckCircle2 } from "lucide-react";
import { getTaskById } from '@/actions/task-actions';
import { CreateTaskItemDialog } from '@/components/task/CreateTaskItemDialog';
import { TaskItemsTable } from '@/components/task/TaskItemsTable';
import { toast } from 'react-toastify';
import { exportTaskToExcel, exportTaskToPDF } from '@/lib/export-task';
import { SendTaskEmailDialog } from '@/components/task/SendTaskEmailDialog';

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

export default function TaskItemsPage() {
  const router = useRouter();
  const params = useParams();
  const taskId = parseInt(params.id as string);
  
  const [task, setTask] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [createItemOpen, setCreateItemOpen] = useState(false);

  useEffect(() => {
    if (taskId) {
      setLoading(true);
      loadTask().finally(() => {
        setLoading(false);
      });
    }
  }, [taskId]);

  const loadTask = async () => {
    // Rafraîchir les données sans afficher le loader
    try {
      const result = await getTaskById(taskId);
      if (result.success && result.data) {
        setTask(result.data);
      } else {
        toast.error(result.error || "Erreur lors du chargement");
      }
    } catch (error) {
      console.error("Erreur lors du chargement:", error);
      toast.error("Erreur lors du chargement");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-200 to-orange-50 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="text-lg">Chargement...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-200 to-orange-50 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12 text-red-500">
            <div className="text-lg">Erreur lors du chargement de la chrono-tâche</div>
            <Button 
              onClick={() => router.push('/list/tasks')}
              className="mt-4"
              variant="outline"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour à la liste
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Calculer la progression basée sur les items terminés (TERMINE, SUCCES, ou ECHEC)
  const totalItems = task.items?.length || 0;
  const completedItems = task.items?.filter((item: any) => 
    ["TERMINE", "SUCCES", "ECHEC"].includes(item.status)
  ).length || 0;
  const progressPercentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-200 to-orange-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Bouton de retour */}
        <Button
          onClick={() => router.push('/list/tasks')}
          variant="outline"
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour à la liste des chrono-tâches
        </Button>

        {/* Carte principale */}
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="harp-card-header">
            <CardTitle className="flex items-center gap-3 text-xl sm:text-2xl lg:text-3xl font-bold">
              <Calendar className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8" />
              {task.title}
            </CardTitle>
            <div className="flex flex-wrap items-center gap-4 mt-2">
              <p className="text-orange-50 text-sm sm:text-base">
                ID: {task.id} • {task.items?.length || 0} tâche{task.items?.length !== 1 ? "s" : ""}
              </p>
              {task.date && (
                <p className="text-orange-50 text-sm sm:text-base">
                  Date: {new Date(task.date).toLocaleDateString("fr-FR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })}
                </p>
              )}
              {task.estimatedDuration && (
                <p className="text-orange-50 text-sm sm:text-base">
                  Estimée: {formatDuration(task.estimatedDuration)}
                </p>
              )}
              {task.effectiveDuration !== null && task.effectiveDuration !== undefined && (
                <p className="text-orange-50 text-sm sm:text-base font-semibold">
                  Effective: {formatDuration(task.effectiveDuration)}
                </p>
              )}
              <Badge className={`${statusColors[task.status]} text-white`}>
                {statusLabels[task.status]}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            {/* Description si présente */}
            {task.descr && (
              <div className="bg-gray-50 p-4 rounded border mb-6">
                <label className="text-sm font-semibold text-gray-700 mb-2 block">Description</label>
                <div className="text-gray-900 text-sm">{task.descr}</div>
              </div>
            )}

            {/* Barre de progression */}
            {totalItems > 0 && (
              <div className={`p-4 rounded-lg border mb-6 ${
                progressPercentage === 100 
                  ? 'bg-gradient-to-r from-green-50 to-green-100 border-green-200' 
                  : 'bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200'
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className={`h-5 w-5 ${progressPercentage === 100 ? 'text-green-600' : 'text-orange-600'}`} />
                    <label className="text-sm font-semibold text-gray-800">
                      Progression de la chrono-tâche
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-800">
                      {completedItems} / {totalItems}
                    </span>
                    <span className={`text-sm font-semibold ${progressPercentage === 100 ? 'text-green-700' : 'text-orange-700'}`}>
                      {progressPercentage}%
                    </span>
                  </div>
                </div>
                <div className="relative h-4 w-full overflow-hidden rounded-full bg-gray-200">
                  <div
                    className={`h-full transition-all duration-500 ${
                      progressPercentage === 100 ? 'bg-green-500' : 'bg-orange-500'
                    }`}
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
                <div className="mt-2 text-xs text-gray-600">
                  {progressPercentage === 100 ? (
                    <span className="text-green-700 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="h-4 w-4" />
                      Toutes les tâches sont terminées ! La chrono-tâche est complète.
                    </span>
                  ) : (
                    <span>
                      {totalItems - completedItems} tâche{totalItems - completedItems > 1 ? "s" : ""} restante{totalItems - completedItems > 1 ? "s" : ""} pour compléter la chrono-tâche
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Tableau des tâches */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">
                  Tâches ({task.items?.length || 0})
                </h3>
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={async () => {
                      try {
                        await exportTaskToExcel(task);
                        toast.success("Export Excel réussi");
                      } catch (error) {
                        console.error(error);
                        toast.error("Erreur lors de l'export Excel");
                      }
                    }}
                    variant="outline"
                    className="bg-white hover:bg-gray-50"
                    title="Exporter en Excel"
                  >
                    <FileDown className="h-4 w-4 mr-2" />
                    Excel
                  </Button>
                  <Button
                    onClick={() => {
                      try {
                        exportTaskToPDF(task);
                        toast.success("Export PDF réussi");
                      } catch (error) {
                        console.error(error);
                        toast.error("Erreur lors de l'export PDF");
                      }
                    }}
                    variant="outline"
                    className="bg-white hover:bg-gray-50"
                    title="Exporter en PDF"
                  >
                    <FileDown className="h-4 w-4 mr-2" />
                    PDF
                  </Button>
                  <SendTaskEmailDialog task={task} />
                  <Button
                    onClick={() => setCreateItemOpen(true)}
                    className="bg-orange-500 hover:bg-orange-600 text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter une tâche
                  </Button>
                </div>
              </div>

              {task.items && task.items.length > 0 ? (
                <TaskItemsTable
                  items={task.items}
                  taskId={taskId}
                  onItemUpdated={loadTask}
                />
              ) : (
                <div className="text-center py-12 text-gray-500 border rounded-lg bg-gray-50">
                  Aucune tâche pour cette chrono-tâche. Cliquez sur "Ajouter une tâche" pour commencer.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

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
    </div>
  );
}
