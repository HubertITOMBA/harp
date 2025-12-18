"use client";

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FormDialog } from '@/components/ui/form-dialog';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Combobox, ComboboxOption } from "@/components/ui/combobox";
import { Calendar, Plus } from "lucide-react";
import { createTaskItem } from '@/actions/create-task-item';
import { getTaskItems } from '@/actions/get-task-items';
import { getAllHarpItems, searchHarpItems, createHarpItem } from '@/actions/harpitems-actions';
import { getUsersForTaskResource } from '@/actions/get-users';
import { toast } from 'react-toastify';

interface CreateTaskItemDialogProps {
  taskId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateTaskItemDialog({ taskId, open, onOpenChange }: CreateTaskItemDialogProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [existingItems, setExistingItems] = useState<Array<{ id: number; order: number; status: string; harpitem: { id: number; descr: string } | null }>>([]);
  const [harpItems, setHarpItems] = useState<Array<{ id: number; descr: string }>>([]);
  const [selectedHarpItemId, setSelectedHarpItemId] = useState<string>("");
  const [itemInput, setItemInput] = useState("");
  const [users, setUsers] = useState<Array<{ netid: string; nom: string | null; prenom: string | null }>>([]);

  // Charger les tâches existantes pour permettre la sélection d'un prédécesseur
  useEffect(() => {
    if (open && taskId) {
      loadExistingItems();
      loadHarpItems();
      loadUsers();
    }
  }, [open, taskId]);

  const loadExistingItems = async () => {
    const result = await getTaskItems(taskId);
    if (result.success && result.data) {
      setExistingItems(result.data);
    }
  };

  const loadHarpItems = async () => {
    const result = await getAllHarpItems();
    if (result.success && result.data) {
      setHarpItems(result.data);
    }
  };

  const loadUsers = async () => {
    const result = await getUsersForTaskResource();
    if (result.success && result.data) {
      setUsers(result.data);
    }
  };

  const handleItemInputChange = async (value: string) => {
    setItemInput(value);
    setSelectedHarpItemId("");
    
    if (value.length > 0) {
      const result = await searchHarpItems({ query: value, limit: 20 });
      if (result.success && result.data) {
        setHarpItems(result.data);
        // Si un item correspond exactement, le sélectionner automatiquement
        const exactMatch = result.data.find(item => 
          item.descr.toLowerCase() === value.toLowerCase()
        );
        if (exactMatch) {
          setSelectedHarpItemId(exactMatch.id.toString());
        }
      }
    } else {
      loadHarpItems();
    }
  };

  const handleCreateHarpItem = async (descr: string): Promise<number | null> => {
    if (!descr.trim()) {
      return null;
    }
    const result = await createHarpItem({ descr: descr.trim() });
    if (result.success && result.data) {
      toast.success("Item réutilisable créé");
      await loadHarpItems(); // Recharger la liste
      return result.data.id;
    } else {
      toast.error(result.error || "Erreur lors de la création de l'item");
      return null;
    }
  };

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>,
    closeDialog: () => void
  ) => {
    e.preventDefault();
    setErrors({});
    
    const formData = new FormData(e.currentTarget);
    
    startTransition(async () => {
      const predecessorIdValue = formData.get("predecessorId") as string;
      const predecessorId = predecessorIdValue && predecessorIdValue !== "" && predecessorIdValue !== "none"
        ? parseInt(predecessorIdValue) 
        : undefined;

      // Gérer la sélection/création de l'item réutilisable
      let harpitemId: number | undefined = undefined;

      if (selectedHarpItemId && selectedHarpItemId !== "") {
        // Item existant sélectionné
        harpitemId = parseInt(selectedHarpItemId);
      } else if (itemInput.trim()) {
        // Recherche effectuée mais aucun item sélectionné - créer un nouvel item réutilisable
        const newItemId = await handleCreateHarpItem(itemInput.trim());
        if (newItemId) {
          harpitemId = newItemId;
        } else {
          return; // Erreur lors de la création
        }
      } else {
        toast.error("Veuillez sélectionner un item réutilisable ou en créer un nouveau");
        return;
      }

      const resourceNetidRaw = (formData.get("resourceNetid") as string) ?? "";
      const resourceNetid =
        resourceNetidRaw && resourceNetidRaw !== "none"
          ? resourceNetidRaw.trim()
          : undefined;

      const result = await createTaskItem({
        taskId: taskId,
        harpitemId: harpitemId,
        startDate: formData.get("startDate") ? new Date(formData.get("startDate") as string) : undefined,
        endDate: formData.get("endDate") ? new Date(formData.get("endDate") as string) : undefined,
        resourceNetid,
        predecessorId: predecessorId,
        status: (formData.get("status") as any) || "EN_ATTENTE",
        comment: formData.get("comment") as string || undefined,
      });
      
      if (result.success) {
        toast.success("Tâche créée avec succès");
        closeDialog();
        // Réinitialiser les états
        setSelectedHarpItemId("");
        setItemInput("");
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
      open={open}
      onOpenChange={onOpenChange}
      trigger={null}
      title="Ajouter une tâche"
      description="Remplissez les informations pour ajouter une nouvelle tâche"
      onSubmit={handleSubmit}
      submitLabel="Créer la tâche"
      submitIcon={<Plus className="h-4 w-4" />}
      isPending={isPending}
      maxWidth="3xl"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Item réutilisable */}
        <div className="space-y-2 md:col-span-2">
          <Label className="text-sm font-semibold text-gray-700">
            Item réutilisable <span className="text-red-500">*</span>
          </Label>
          <div className="space-y-2">
            <Combobox
              options={harpItems.map(item => ({ value: item.id.toString(), label: item.descr }))}
              value={selectedHarpItemId}
              onValueChange={(value) => {
                setSelectedHarpItemId(value);
                if (value) {
                  const selectedItem = harpItems.find(item => item.id.toString() === value);
                  if (selectedItem) {
                    setItemInput(selectedItem.descr);
                  }
                }
              }}
              onInputChange={handleItemInputChange}
              placeholder="Rechercher ou sélectionner un item réutilisable..."
              searchPlaceholder="Rechercher un item..."
              emptyMessage="Aucun item trouvé. L'item sera créé automatiquement."
              className="bg-white"
            />
            {itemInput && !selectedHarpItemId && (
              <div className="bg-blue-50 border border-blue-200 rounded p-2 text-xs text-blue-700">
                <strong>Nouvel item :</strong> "{itemInput}" sera créé automatiquement comme item réutilisable.
              </div>
            )}
          </div>
          <p className="text-xs text-gray-500">
            Sélectionnez un item existant ou tapez pour créer un nouvel item réutilisable automatiquement.
          </p>
        </div>

        {/* Statut */}
        <div className="space-y-2">
          <Label htmlFor="status" className="text-sm font-semibold text-gray-700">
            Statut
          </Label>
          <Select name="status" defaultValue="EN_ATTENTE">
            <SelectTrigger className="bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="EN_ATTENTE">En attente</SelectItem>
              <SelectItem value="EN_COURS">En cours</SelectItem>
              <SelectItem value="BLOQUE">Bloqué</SelectItem>
              <SelectItem value="TERMINE">Terminé</SelectItem>
              <SelectItem value="SUCCES">Succès</SelectItem>
              <SelectItem value="ECHEC">Échec</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Date début */}
        <div className="space-y-2">
          <Label htmlFor="startDate" className="text-sm font-semibold text-gray-700">
            Date/heure début
          </Label>
          <Input
            id="startDate"
            name="startDate"
            type="datetime-local"
            className="bg-white"
          />
        </div>

        {/* Date fin */}
        <div className="space-y-2">
          <Label htmlFor="endDate" className="text-sm font-semibold text-gray-700">
            Date/heure fin
          </Label>
          <Input
            id="endDate"
            name="endDate"
            type="datetime-local"
            className="bg-white"
          />
        </div>

        {/* Ressource */}
        <div className="space-y-2">
          <Label htmlFor="resourceNetid" className="text-sm font-semibold text-gray-700">
            Ressource (utilisateur)
          </Label>
          <Select name="resourceNetid" defaultValue="none">
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="Sélectionner un utilisateur" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Aucun utilisateur</SelectItem>
              {users.map((user) => {
                const displayName = user.nom || user.prenom
                  ? `${user.nom || ''} ${user.prenom || ''}`.trim()
                  : user.netid;
                return (
                  <SelectItem key={user.netid} value={user.netid}>
                    {displayName} ({user.netid})
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        {/* Prédécesseur */}
        <div className="space-y-2">
          <Label htmlFor="predecessorId" className="text-sm font-semibold text-gray-700">
            Prédécesseur (tâche précédente)
          </Label>
          <Select name="predecessorId" defaultValue="none">
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="Aucun prédécesseur" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Aucun prédécesseur</SelectItem>
              {existingItems.map((item) => (
                <SelectItem key={item.id} value={item.id.toString()}>
                  {item.order}. {item.harpitem?.descr || "N/A"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {existingItems.length === 0 && (
            <p className="text-xs text-gray-500">Aucune tâche existante. Cette tâche sera la première.</p>
          )}
        </div>

        {/* Commentaire */}
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="comment" className="text-sm font-semibold text-gray-700">
            Commentaire
          </Label>
          <textarea
            id="comment"
            name="comment"
            className="w-full min-h-[100px] px-3 py-2 border border-gray-300 rounded-md bg-white"
            placeholder="Commentaire sur la tâche..."
          />
        </div>
      </div>
    </FormDialog>
  );
}
