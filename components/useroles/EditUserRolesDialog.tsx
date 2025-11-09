"use client";

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { FormDialog } from '@/components/ui/form-dialog';
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Users, Shield, Pencil } from "lucide-react";
import { updateUserRoles } from '@/actions/update-useroles';
import { toast } from 'react-toastify';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface EditUserRolesDialogProps {
  userRole: {
    netid: string;
    role: string;
    rolep: string;
    datmaj: Date;
  };
}

export function EditUserRolesDialog({ userRole }: EditUserRolesDialogProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedRolep, setSelectedRolep] = useState<string>(userRole.rolep);

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>,
    closeDialog: () => void
  ) => {
    e.preventDefault();
    setErrors({});
    
    const formData = new FormData();
    formData.append('rolep', selectedRolep);
    
    startTransition(async () => {
      const result = await updateUserRoles(userRole.netid, userRole.role, formData);
      
      if (result.success) {
        toast.success(result.message);
        closeDialog();
        router.refresh();
      } else {
        toast.error(result.error || "Erreur lors de la mise à jour de l'attribution de rôle");
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
          size="sm"
          className="h-7 w-7 sm:h-8 sm:w-8 p-0 border-blue-300 hover:bg-blue-50"
          title="Éditer"
        >
          <Pencil className="h-3 w-3 sm:h-4 sm:w-4" />
        </Button>
      }
      title={`Modifier l'attribution de rôle`}
      description={`${userRole.netid} - ${userRole.role}`}
      onSubmit={handleSubmit}
      submitLabel="Enregistrer les modifications"
      submitIcon={<Pencil className="h-4 w-4" />}
      isPending={isPending}
      maxWidth="2xl"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Utilisateur (lecture seule) */}
        <div className="space-y-2">
          <Label htmlFor="netid" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Users className="h-4 w-4 text-orange-600" />
            Utilisateur
          </Label>
          <div className="p-2 bg-gray-100 rounded-md text-sm font-mono">
            {userRole.netid}
          </div>
        </div>

        {/* Rôle (lecture seule) */}
        <div className="space-y-2">
          <Label htmlFor="role" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Shield className="h-4 w-4 text-orange-600" />
            Rôle
          </Label>
          <div className="p-2 bg-gray-100 rounded-md text-sm font-mono">
            {userRole.role}
          </div>
        </div>

        {/* Rôle principal */}
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="rolep" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Shield className="h-4 w-4 text-orange-600" />
            Rôle principal <span className="text-red-500">*</span>
          </Label>
          <Select value={selectedRolep} onValueChange={setSelectedRolep}>
            <SelectTrigger className="bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Y">Oui</SelectItem>
              <SelectItem value="N">Non</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {errors.general && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {errors.general}
        </div>
      )}
    </FormDialog>
  );
}

