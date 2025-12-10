"use client";

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FormDialog } from '@/components/ui/form-dialog';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Bell, Plus, Users, Shield } from "lucide-react";
import { createNotification, getAllUsersForNotifications, getAllRolesForNotifications } from '@/lib/actions/notification-actions';
import { toast } from 'react-toastify';
import { MultiSelect, MultiSelectOption } from '@/components/ui/multi-select';

export function CreateNotificationDialog() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
  const [userOptions, setUserOptions] = useState<MultiSelectOption[]>([]);
  const [roleOptions, setRoleOptions] = useState<MultiSelectOption[]>([]);

  // Charger les utilisateurs et rôles au montage
  useEffect(() => {
    async function loadOptions() {
      const [users, roles] = await Promise.all([
        getAllUsersForNotifications(),
        getAllRolesForNotifications(),
      ]);

      setUserOptions(
        users.map(user => ({
          value: user.id.toString(),
          label: `${user.name || user.netid || user.email || 'Utilisateur'} ${user.netid ? `(${user.netid})` : ''}`.trim(),
        }))
      );

      setRoleOptions(
        roles.map(role => ({
          value: role.id.toString(),
          label: `${role.role}${role.descr ? ` - ${role.descr}` : ''}`,
        }))
      );
    }

    loadOptions();
  }, []);

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>,
    closeDialog: () => void
  ) => {
    e.preventDefault();
    setErrors({});

    // Vérifier qu'au moins un destinataire est sélectionné
    if (selectedUserIds.length === 0 && selectedRoleIds.length === 0) {
      setErrors({ recipients: "Vous devez sélectionner au moins un utilisateur ou un rôle" });
      toast.error("Vous devez sélectionner au moins un utilisateur ou un rôle");
      return;
    }

    const formData = new FormData(e.currentTarget);
    
    // Ajouter les IDs sélectionnés au FormData
    selectedUserIds.forEach(userId => {
      formData.append("userIds", userId);
    });
    
    selectedRoleIds.forEach(roleId => {
      formData.append("roleIds", roleId);
    });

    startTransition(async () => {
      const result = await createNotification(formData);

      if (result.success) {
        toast.success(result.message);
        closeDialog();
        setSelectedUserIds([]);
        setSelectedRoleIds([]);
        router.refresh();
      } else {
        toast.error(result.error || "Erreur lors de la création de la notification");
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
          Créer une notification
        </Button>
      }
      title="Créer une nouvelle notification"
      description="Rédigez votre notification et sélectionnez les destinataires"
      icon={<Bell className="h-5 w-5 text-orange-600" />}
      onSubmit={handleSubmit}
      isPending={isPending}
    >
      <div className="space-y-4">
        {errors.general && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
            {errors.general}
          </div>
        )}

        {/* Titre */}
        <div className="space-y-2">
          <Label htmlFor="title" className="text-sm font-semibold text-slate-700">
            Titre <span className="text-red-500">*</span>
          </Label>
          <Input
            id="title"
            name="title"
            placeholder="Titre de la notification"
            required
            maxLength={255}
            className="w-full"
            disabled={isPending}
          />
        </div>

        {/* Message */}
        <div className="space-y-2">
          <Label htmlFor="message" className="text-sm font-semibold text-slate-700">
            Message <span className="text-red-500">*</span>
          </Label>
          <Textarea
            id="message"
            name="message"
            placeholder="Contenu de la notification"
            required
            rows={6}
            className="w-full resize-none"
            disabled={isPending}
          />
        </div>

        {/* Sélection des utilisateurs */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <Users className="h-4 w-4 text-orange-600" />
            Utilisateurs
          </Label>
          <MultiSelect
            options={userOptions}
            selected={selectedUserIds}
            onChange={setSelectedUserIds}
            placeholder="Sélectionner des utilisateurs..."
            searchPlaceholder="Rechercher un utilisateur..."
            emptyMessage="Aucun utilisateur trouvé."
            disabled={isPending}
          />
        </div>

        {/* Sélection des rôles */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <Shield className="h-4 w-4 text-orange-600" />
            Rôles
          </Label>
          <MultiSelect
            options={roleOptions}
            selected={selectedRoleIds}
            onChange={setSelectedRoleIds}
            placeholder="Sélectionner des rôles..."
            searchPlaceholder="Rechercher un rôle..."
            emptyMessage="Aucun rôle trouvé."
            disabled={isPending}
          />
        </div>

        {errors.recipients && (
          <div className="p-2 bg-red-50 border border-red-200 rounded-md text-red-700 text-xs">
            {errors.recipients}
          </div>
        )}

        <div className="text-xs text-gray-500 mt-2">
          <p className="font-semibold mb-1">Note :</p>
          <p>Vous devez sélectionner au moins un utilisateur ou un rôle pour envoyer la notification.</p>
        </div>
      </div>
    </FormDialog>
  );
}

