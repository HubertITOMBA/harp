"use client";

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FormDialog } from '@/components/ui/form-dialog';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Mail, FileDown, Send } from "lucide-react";
import { sendTasksExportByEmail } from '@/lib/actions/export-tasks-actions';
import { getAllUsersForNotifications, getAllRolesForNotifications } from '@/lib/actions/notification-actions';
import { toast } from 'react-toastify';
import { MultiSelect, MultiSelectOption } from '@/components/ui/multi-select';
import { TaskData } from '@/lib/export-tasks';

interface SendTasksExportDialogProps {
  tasks: TaskData[];
  visibleColumns: string[];
}

export function SendTasksExportDialog({ tasks, visibleColumns }: SendTasksExportDialogProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
  const [userOptions, setUserOptions] = useState<MultiSelectOption[]>([]);
  const [roleOptions, setRoleOptions] = useState<MultiSelectOption[]>([]);
  const [exportType, setExportType] = useState<'excel' | 'pdf'>('excel');

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

    formData.append("exportType", exportType);
    // Ajouter les colonnes visibles
    visibleColumns.forEach(col => {
      formData.append("visibleColumns", col);
    });

    startTransition(async () => {
      const result = await sendTasksExportByEmail(formData);

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
        <Button
          variant="outline"
          className="bg-white hover:bg-gray-50"
          title="Envoyer par email"
        >
          <Mail className="h-4 w-4 mr-2" />
          Envoyer
        </Button>
      }
      title="Envoyer l'export par email"
      description="Choisissez le format et renseignez les informations d'envoi"
      onSubmit={handleSubmit}
      submitLabel="Envoyer"
      submitIcon={<Send className="h-4 w-4" />}
      isPending={isPending}
      maxWidth="2xl"
    >
      <div className="space-y-4">
        {/* Sélection du type d'export */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold text-gray-700">
            Format d'export
          </Label>
          <div className="flex gap-2">
            <Button
              type="button"
              variant={exportType === 'excel' ? 'default' : 'outline'}
              onClick={() => setExportType('excel')}
              className="flex-1"
            >
              <FileDown className="h-4 w-4 mr-2" />
              Excel
            </Button>
            <Button
              type="button"
              variant={exportType === 'pdf' ? 'default' : 'outline'}
              onClick={() => setExportType('pdf')}
              className="flex-1"
            >
              <FileDown className="h-4 w-4 mr-2" />
              PDF
            </Button>
          </div>
        </div>

        {/* Sujet */}
        <div className="space-y-2">
          <Label htmlFor="subject" className="text-sm font-semibold text-gray-700">
            Sujet
          </Label>
          <Input
            id="subject"
            name="subject"
            defaultValue={`Export des chrono-tâches - ${new Date().toLocaleDateString('fr-FR')}`}
            className="bg-white"
            placeholder="Sujet de l'email"
          />
          {errors.subject && (
            <p className="text-sm text-red-600">{errors.subject}</p>
          )}
        </div>

        {/* Message */}
        <div className="space-y-2">
          <Label htmlFor="message" className="text-sm font-semibold text-gray-700">
            Message
          </Label>
          <Textarea
            id="message"
            name="message"
            rows={4}
            defaultValue={`Veuillez trouver ci-joint l'export des chrono-tâches (${tasks.length} chrono-tâche${tasks.length > 1 ? 's' : ''}).`}
            className="bg-white"
            placeholder="Message de l'email"
          />
          {errors.message && (
            <p className="text-sm text-red-600">{errors.message}</p>
          )}
        </div>

        {/* Destinataires */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold text-gray-700">
            Destinataires
          </Label>
          <div className="space-y-3">
            <div>
              <Label className="text-xs text-gray-600 mb-1 block">Utilisateurs</Label>
              <MultiSelect
                options={userOptions}
                value={selectedUserIds}
                onValueChange={setSelectedUserIds}
                placeholder="Sélectionner des utilisateurs..."
                emptyMessage="Aucun utilisateur trouvé"
              />
            </div>
            <div>
              <Label className="text-xs text-gray-600 mb-1 block">Rôles</Label>
              <MultiSelect
                options={roleOptions}
                value={selectedRoleIds}
                onValueChange={setSelectedRoleIds}
                placeholder="Sélectionner des rôles..."
                emptyMessage="Aucun rôle trouvé"
              />
            </div>
          </div>
          {errors.recipients && (
            <p className="text-sm text-red-600">{errors.recipients}</p>
          )}
        </div>

        {errors.general && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {errors.general}
          </div>
        )}
      </div>
    </FormDialog>
  );
}

