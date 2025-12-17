"use client";

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FormDialog } from '@/components/ui/form-dialog';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Mail, Plus, Users, Shield, CheckSquare, Square } from "lucide-react";
import { sendEmail, getAllUsersForNotifications, getAllRolesForNotifications } from '@/lib/actions/notification-actions';
import { toast } from 'react-toastify';
import { MultiSelect, MultiSelectOption } from '@/components/ui/multi-select';

export function SendEmailDialog() {
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

  // Fonctions pour sélectionner/désélectionner tous les utilisateurs
  const handleSelectAllUsers = () => {
    const allUserIds = userOptions.map(option => option.value);
    setSelectedUserIds(allUserIds);
  };

  const handleDeselectAllUsers = () => {
    setSelectedUserIds([]);
  };

  // Fonctions pour sélectionner/désélectionner tous les rôles
  const handleSelectAllRoles = () => {
    const allRoleIds = roleOptions.map(option => option.value);
    setSelectedRoleIds(allRoleIds);
  };

  const handleDeselectAllRoles = () => {
    setSelectedRoleIds([]);
  };

  // Vérifier si tous les utilisateurs sont sélectionnés
  const allUsersSelected = userOptions.length > 0 && selectedUserIds.length === userOptions.length;
  const allRolesSelected = roleOptions.length > 0 && selectedRoleIds.length === roleOptions.length;

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

    // Renommer "subject" pour l'email
    formData.set("subject", formData.get("subject") as string);

    startTransition(async () => {
      const result = await sendEmail(formData);

      if (result.success) {
        toast.success(result.message);
        closeDialog();
        setSelectedUserIds([]);
        setSelectedRoleIds([]);
        router.refresh();
      } else {
        toast.error(result.error || "Erreur lors de l'envoi de l'email");
        if (result.error) {
          setErrors({ general: result.error });
        }
      }
    });
  };

  return (
    <FormDialog
      trigger={
        <Button className="bg-blue-500 hover:bg-blue-600 text-white shadow-md">
          <Mail className="h-4 w-4 mr-2" />
          Envoyer un email
        </Button>
      }
      title="Envoyer un email"
      description="Rédigez votre email et sélectionnez les destinataires"
      icon={<Mail className="h-5 w-5 text-blue-600" />}
      onSubmit={handleSubmit}
      isPending={isPending}
      submitLabel="Envoyer l'email"
      submitIcon={<Mail className="h-4 w-4" />}
    >
      <div className="space-y-4">
        {errors.general && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
            {errors.general}
          </div>
        )}

        {/* Sujet */}
        <div className="space-y-2">
          <Label htmlFor="subject" className="text-sm font-semibold text-slate-700">
            Sujet <span className="text-red-500">*</span>
          </Label>
          <Input
            id="subject"
            name="subject"
            placeholder="Sujet de l'email"
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
            placeholder="Contenu de l'email"
            required
            rows={6}
            className="w-full resize-none"
            disabled={isPending}
          />
        </div>

        {/* Sélection des utilisateurs */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              Utilisateurs
              {selectedUserIds.length > 0 && (
                <span className="text-xs font-normal text-slate-500 ml-1">
                  ({selectedUserIds.length} sélectionné{selectedUserIds.length > 1 ? 's' : ''})
                </span>
              )}
            </Label>
            <div className="flex items-center gap-1">
              {allUsersSelected ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleDeselectAllUsers}
                  disabled={isPending || userOptions.length === 0}
                  className="text-xs"
                >
                  <Square className="h-3 w-3 mr-1" />
                  Désélectionner tous
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAllUsers}
                  disabled={isPending || userOptions.length === 0}
                  className="text-xs"
                >
                  <CheckSquare className="h-3 w-3 mr-1" />
                  Sélectionner tous
                </Button>
              )}
            </div>
          </div>
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
          <div className="flex items-center justify-between">
            <Label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Shield className="h-4 w-4 text-blue-600" />
              Rôles
              {selectedRoleIds.length > 0 && (
                <span className="text-xs font-normal text-slate-500 ml-1">
                  ({selectedRoleIds.length} sélectionné{selectedRoleIds.length > 1 ? 's' : ''})
                </span>
              )}
            </Label>
            <div className="flex items-center gap-1">
              {allRolesSelected ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleDeselectAllRoles}
                  disabled={isPending || roleOptions.length === 0}
                  className="text-xs"
                >
                  <Square className="h-3 w-3 mr-1" />
                  Désélectionner tous
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAllRoles}
                  disabled={isPending || roleOptions.length === 0}
                  className="text-xs"
                >
                  <CheckSquare className="h-3 w-3 mr-1" />
                  Sélectionner tous
                </Button>
              )}
            </div>
          </div>
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
          <p>Vous devez sélectionner au moins un utilisateur ou un rôle pour envoyer l'email. Seuls les utilisateurs avec une adresse email valide recevront l'email.</p>
        </div>
      </div>
    </FormDialog>
  );
}

