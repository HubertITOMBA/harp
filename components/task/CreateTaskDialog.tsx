"use client";

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FormDialog } from '@/components/ui/form-dialog';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Plus, Copy } from "lucide-react";
import { createTask } from '@/actions/create-task';
import { copyTask } from '@/actions/copy-task';
import { getTasksList } from '@/actions/get-tasks-list';
import { getTaskById } from '@/actions/task-actions';
import { toast } from 'react-toastify';

export function CreateTaskDialog() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [creationMode, setCreationMode] = useState<"new" | "copy">("new");
  const [sourceTasks, setSourceTasks] = useState<Array<{ id: number; title: string }>>([]);
  const [selectedSourceTaskId, setSelectedSourceTaskId] = useState<string>("");
  const [selectedSourceTask, setSelectedSourceTask] = useState<any>(null);

  // Charger la liste des tâches existantes pour la copie
  useEffect(() => {
    if (creationMode === "copy") {
      loadSourceTasks();
    } else {
      // Réinitialiser quand on revient en mode création
      setSelectedSourceTaskId("");
      setSelectedSourceTask(null);
      setSourceTasks([]);
    }
  }, [creationMode]);

  const loadSourceTasks = async () => {
    try {
      setSourceTasks([]); // Réinitialiser pendant le chargement
      const result = await getTasksList();
      if (result.success && result.data && Array.isArray(result.data)) {
        const tasks = result.data.map((task: any) => ({
          id: task.id,
          title: task.title,
        }));
        setSourceTasks(tasks);
        if (tasks.length === 0) {
          toast.info("Aucune chrono-tâche disponible pour la copie");
        }
      } else {
        console.error("Erreur lors du chargement:", result.error);
        toast.error(result.error || "Erreur lors du chargement des tâches");
      }
    } catch (error) {
      console.error("Erreur lors du chargement des tâches:", error);
      toast.error("Erreur lors du chargement des tâches");
    }
  };

  const handleSourceTaskChange = async (taskId: string) => {
    setSelectedSourceTaskId(taskId);
    if (taskId) {
      try {
        // Charger les détails complets de la tâche source
        const result = await getTaskById(parseInt(taskId));
        if (result.success && result.data) {
          setSelectedSourceTask(result.data);
        }
      } catch (error) {
        console.error("Erreur lors du chargement de la tâche:", error);
      }
    } else {
      setSelectedSourceTask(null);
    }
  };

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
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (mins === 0) {
      return `${hours}h`;
    }
    return `${hours}h ${mins}min`;
  };

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>,
    closeDialog: () => void
  ) => {
    e.preventDefault();
    setErrors({});
    
    const formData = new FormData(e.currentTarget);
    
    startTransition(async () => {
      // Validation en mode copie
      if (creationMode === "copy" && !selectedSourceTaskId) {
        toast.error("Veuillez sélectionner une chrono-tâche à copier");
        setErrors({ general: "Une chrono-tâche source est requise en mode copie" });
        return;
      }

      const dateValue = formData.get("date") as string;
      const estimatedDurationValue = formData.get("estimatedDuration") as string;
      
      let result;
      
      if (creationMode === "copy" && selectedSourceTaskId) {
        // Mode copie
        result = await copyTask({
          sourceTaskId: parseInt(selectedSourceTaskId),
          title: formData.get("title") as string,
          descr: formData.get("descr") as string || null,
          date: dateValue ? new Date(dateValue) : null,
          estimatedDuration: estimatedDurationValue ? parseInt(estimatedDurationValue) : null,
        });
        
        if (result.success) {
          toast.success("Chrono-tâche copiée avec succès");
        }
      } else {
        // Mode création normale
        result = await createTask({
          title: formData.get("title") as string,
          descr: formData.get("descr") as string || undefined,
          date: dateValue ? new Date(dateValue) : null,
          estimatedDuration: estimatedDurationValue ? parseInt(estimatedDurationValue) : null,
        });
        
        if (result.success) {
          toast.success("Chrono-tâche créée avec succès");
        }
      }
      
      if (result.success) {
        closeDialog();
        // Réinitialiser les états
        setCreationMode("new");
        setSelectedSourceTaskId("");
        setSelectedSourceTask(null);
        router.refresh();
      } else {
        toast.error(result.error || "Erreur lors de la création");
        if (result.error) {
          setErrors({ general: result.error });
        }
      }
    });
  };

  return (
    <FormDialog
      trigger={
        <Button className="bg-orange-500 hover:bg-orange-600 text-white shadow-md">
          <Plus className="h-4 w-4 mr-2" />
          Créer une chrono-tâche
        </Button>
      }
      title={creationMode === "copy" ? "Copier une chrono-tâche" : "Créer une nouvelle chrono-tâche"}
      description={creationMode === "copy" 
        ? "Sélectionnez une chrono-tâche existante à copier et modifiez les informations nécessaires"
        : "Remplissez les informations pour créer une nouvelle chrono-tâche"}
      onSubmit={handleSubmit}
      submitLabel={creationMode === "copy" ? "Copier la chrono-tâche" : "Créer la chrono-tâche"}
      submitIcon={creationMode === "copy" ? <Copy className="h-4 w-4" /> : <Calendar className="h-4 w-4" />}
      isPending={isPending}
      maxWidth="2xl"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Mode de création */}
        <div className="space-y-2 md:col-span-2">
          <Label className="text-sm font-semibold text-gray-700">
            Mode de création
          </Label>
          <div className="flex gap-2">
            <Button
              type="button"
              variant={creationMode === "new" ? "default" : "outline"}
              onClick={() => {
                setCreationMode("new");
                setSelectedSourceTaskId("");
                setSelectedSourceTask(null);
              }}
              className="flex-1"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle tâche
            </Button>
            <Button
              type="button"
              variant={creationMode === "copy" ? "default" : "outline"}
              onClick={() => setCreationMode("copy")}
              className="flex-1"
            >
              <Copy className="h-4 w-4 mr-2" />
              Copier depuis une tâche existante
            </Button>
          </div>
        </div>

        {/* Sélection de la tâche source (mode copie) */}
        {creationMode === "copy" && (
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="sourceTaskId" className="text-sm font-semibold text-gray-700">
              Tâche source à copier <span className="text-red-500">*</span>
            </Label>
            <Select
              value={selectedSourceTaskId}
              onValueChange={handleSourceTaskChange}
            >
              <SelectTrigger className="bg-white w-full">
                <SelectValue placeholder={sourceTasks.length === 0 ? "Chargement..." : "Sélectionner une chrono-tâche..."} />
              </SelectTrigger>
              <SelectContent className="z-[200] max-h-[300px]">
                {sourceTasks.length > 0 ? (
                  sourceTasks.map((task) => (
                    <SelectItem 
                      key={task.id} 
                      value={task.id.toString()}
                    >
                      {task.title}
                    </SelectItem>
                  ))
                ) : (
                  <div className="px-2 py-1.5 text-sm text-gray-500">
                    {creationMode === "copy" ? "Chargement des chrono-tâches..." : "Aucune chrono-tâche disponible"}
                  </div>
                )}
              </SelectContent>
            </Select>
            {sourceTasks.length === 0 && creationMode === "copy" && (
              <p className="text-xs text-gray-500">
                Chargement des chrono-tâches...
              </p>
            )}
            {selectedSourceTask && (
              <div className="bg-blue-50 border border-blue-200 rounded p-3 text-xs text-blue-700">
                <strong className="block mb-2">Informations de la tâche source :</strong>
                <ul className="list-disc list-inside space-y-1">
                  <li><strong>{selectedSourceTask.items?.length || 0}</strong> tâche(s) seront copiée(s)</li>
                  {selectedSourceTask.descr && (
                    <li>Description actuelle : {selectedSourceTask.descr.length > 80 
                      ? selectedSourceTask.descr.substring(0, 80) + "..." 
                      : selectedSourceTask.descr}</li>
                  )}
                  {selectedSourceTask.date && (
                    <li>Date source : {new Date(selectedSourceTask.date).toLocaleDateString("fr-FR")}</li>
                  )}
                  {selectedSourceTask.estimatedDuration && (
                    <li>Durée estimée source : {formatDuration(selectedSourceTask.estimatedDuration)}</li>
                  )}
                </ul>
                <p className="mt-2 text-blue-600 italic">
                  Tous les items seront copiés avec leur structure (prédécesseurs, ressources, etc.). 
                  Les dates de début seront initialisées avec la date que vous définissez ci-dessous.
                </p>
              </div>
            )}
          </div>
        )}

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
            className="bg-white"
            placeholder={creationMode === "copy" && selectedSourceTask 
              ? `Ex: ${selectedSourceTask.title} (nouvelle version)` 
              : "Ex: Upgrade d'un environnement PeopleSoft"}
            defaultValue={creationMode === "copy" && selectedSourceTask 
              ? `${selectedSourceTask.title} (copie)` 
              : ""}
            maxLength={255}
          />
        </div>

        {/* Date */}
        <div className="space-y-2">
          <Label htmlFor="date" className="text-sm font-semibold text-gray-700">
            Date de début prévue {creationMode === "copy" && <span className="text-orange-600 text-xs">(sera utilisée pour startDate des items)</span>}
          </Label>
          <Input
            id="date"
            name="date"
            type="datetime-local"
            className="bg-white"
            defaultValue={creationMode === "copy" && selectedSourceTask?.date
              ? formatDateTimeLocal(selectedSourceTask.date)
              : ""}
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
            className="bg-white"
            placeholder="Ex: 480"
            min="0"
            defaultValue={creationMode === "copy" && selectedSourceTask?.estimatedDuration
              ? selectedSourceTask.estimatedDuration.toString()
              : ""}
          />
        </div>

        {/* Description */}
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="descr" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            Description
          </Label>
          <textarea
            id="descr"
            name="descr"
            className="w-full min-h-[100px] px-3 py-2 border border-gray-300 rounded-md bg-white"
            placeholder="Description de la chrono-tâche..."
            defaultValue={creationMode === "copy" && selectedSourceTask?.descr 
              ? selectedSourceTask.descr 
              : ""}
          />
        </div>
      </div>
    </FormDialog>
  );
}
