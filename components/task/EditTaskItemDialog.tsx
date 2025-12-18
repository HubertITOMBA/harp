"use client";

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FormDialog } from '@/components/ui/form-dialog';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Combobox } from "@/components/ui/combobox";
import { Pencil } from "lucide-react";
import { updateTaskItem } from '@/actions/task-actions';
import { getTaskItems } from '@/actions/get-task-items';
import { getAllHarpItems, searchHarpItems, createHarpItem } from '@/actions/harpitems-actions';
import { getUsersForTaskResource } from '@/actions/get-users';
import { toast } from 'react-toastify';

interface EditTaskItemDialogProps {
  item: {
    id: number;
    startDate?: Date | string | null;
    endDate?: Date | string | null;
    resourceNetid?: string | null;
    predecessorId?: number | null;
    status: "EN_ATTENTE" | "EN_COURS" | "BLOQUE" | "TERMINE" | "SUCCES" | "ECHEC";
    comment?: string | null;
    taskId: number;
    harpitemId?: number | null;
    harpitem?: {
      id: number;
      descr: string;
    } | null;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditTaskItemDialog({ item, open, onOpenChange }: EditTaskItemDialogProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [existingItems, setExistingItems] = useState<Array<{ id: number; order: number; status: string; harpitem: { id: number; descr: string } | null }>>([]);
  const [harpItems, setHarpItems] = useState<Array<{ id: number; descr: string }>>([]);
  const [selectedHarpItemId, setSelectedHarpItemId] = useState<string>("");
  const [itemInput, setItemInput] = useState("");
  const [users, setUsers] = useState<Array<{ netid: string; nom: string | null; prenom: string | null }>>([]);

  useEffect(() => {
    if (open && item.taskId) {
      loadExistingItems();
      loadHarpItems();
      loadUsers();
      // Initialiser les valeurs
      if (item.harpitemId && item.harpitem) {
        setSelectedHarpItemId(item.harpitemId.toString());
        setItemInput(item.harpitem.descr);
      } else {
        setSelectedHarpItemId("");
        setItemInput("");
      }
    }
  }, [open, item.taskId, item.harpitemId, item.harpitem]);

  const loadExistingItems = async () => {
    const result = await getTaskItems(item.taskId);
    if (result.success && result.data) {
      // Exclure l'item actuel de la liste des prédécesseurs possibles
      setExistingItems(result.data.filter(i => i.id !== item.id));
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
        : null;

      // Gérer la sélection/création de l'item réutilisable
      let harpitemId: number | null | undefined = undefined;

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
        // Si rien n'a changé, garder la valeur actuelle
        harpitemId = item.harpitemId || null;
      }

      const resourceNetidRaw = (formData.get("resourceNetid") as string) ?? "";
      const resourceNetid =
        resourceNetidRaw && resourceNetidRaw !== "none"
          ? resourceNetidRaw.trim()
          : null;

      const result = await updateTaskItem({
        id: item.id,
        harpitemId: harpitemId,
        startDate: formData.get("startDate") ? new Date(formData.get("startDate") as string) : null,
        endDate: formData.get("endDate") ? new Date(formData.get("endDate") as string) : null,
        resourceNetid,
        predecessorId: predecessorId,
        status: (formData.get("status") as any),
        comment: formData.get("comment") as string || null,
      });
      
      if (result.success) {
        toast.success("Tâche mise à jour avec succès");
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
      title="Modifier la tâche"
      description="Modifiez les informations de la tâche"
      onSubmit={handleSubmit}
      submitLabel="Enregistrer"
      submitIcon={<Pencil className="h-4 w-4" />}
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
          <Select name="status" defaultValue={item.status}>
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
            defaultValue={formatDateTimeLocal(item.startDate)}
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
            defaultValue={formatDateTimeLocal(item.endDate)}
            className="bg-white"
          />
        </div>

        {/* Ressource */}
        <div className="space-y-2">
          <Label htmlFor="resourceNetid" className="text-sm font-semibold text-gray-700">
            Ressource (utilisateur)
          </Label>
          <Select name="resourceNetid" defaultValue={item.resourceNetid ?? "none"}>
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
          <Select name="predecessorId" defaultValue={item.predecessorId ? item.predecessorId.toString() : "none"}>
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="Aucun prédécesseur" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Aucun prédécesseur</SelectItem>
              {existingItems.map((existingItem) => (
                <SelectItem key={existingItem.id} value={existingItem.id.toString()}>
                  {existingItem.order}. {existingItem.harpitem?.descr || "N/A"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Commentaire */}
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="comment" className="text-sm font-semibold text-gray-700">
            Commentaire
          </Label>
          <textarea
            id="comment"
            name="comment"
            defaultValue={item.comment || ""}
            className="w-full min-h-[100px] px-3 py-2 border border-gray-300 rounded-md bg-white"
          />
        </div>
      </div>
    </FormDialog>
  );
}
