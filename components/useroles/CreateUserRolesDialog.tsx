"use client";

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FormDialog } from '@/components/ui/form-dialog';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Users, Shield, Plus } from "lucide-react";
import { createUserRoles } from '@/actions/create-useroles';
import { toast } from 'react-toastify';
import { Combobox } from "@/components/ui/combobox";

interface User {
  netid: string;
  nom: string | null;
  prenom: string | null;
}

interface Role {
  role: string;
  descr: string;
}

export function CreateUserRolesDialog() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNetid, setSelectedNetid] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [selectedRolep, setSelectedRolep] = useState<string>('Y');

  useEffect(() => {
    async function fetchData() {
      try {
        const [usersRes, rolesRes] = await Promise.all([
          fetch('/api/users'),
          fetch('/api/roles'),
        ]);
        const usersData = await usersRes.json();
        const rolesData = await rolesRes.json();
        setUsers(usersData);
        setRoles(rolesData);
      } catch (error) {
        console.error("Erreur lors du chargement des données:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>,
    closeDialog: () => void
  ) => {
    e.preventDefault();
    setErrors({});
    
    if (!selectedNetid || !selectedRole) {
      setErrors({ general: "Veuillez sélectionner un utilisateur et un rôle" });
      return;
    }
    
    const formData = new FormData();
    formData.append('netid', selectedNetid);
    formData.append('role', selectedRole);
    formData.append('rolep', selectedRolep);
    
    startTransition(async () => {
      const result = await createUserRoles(formData);
      
      if (result.success) {
        toast.success(result.message);
        closeDialog();
        setSelectedNetid('');
        setSelectedRole('');
        setSelectedRolep('Y');
        router.refresh();
      } else {
        toast.error(result.error || "Erreur lors de la création de l'attribution de rôle");
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
          Attribuer un rôle
        </Button>
      }
      title="Attribuer un rôle à un utilisateur"
      description="Sélectionnez un utilisateur et un rôle à attribuer"
      onSubmit={handleSubmit}
      submitLabel="Attribuer le rôle"
      submitIcon={<Users className="h-4 w-4" />}
      isPending={isPending}
      maxWidth="2xl"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Utilisateur */}
        <div className="space-y-2">
          <Label htmlFor="netid" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Users className="h-4 w-4 text-orange-600" />
            Utilisateur <span className="text-red-500">*</span>
          </Label>
          {loading ? (
            <div className="p-2 text-sm text-gray-500">Chargement...</div>
          ) : (
            <Combobox
              options={users.map((user) => ({
                value: user.netid,
                label: `${user.netid} - ${user.prenom || ''} ${user.nom || ''}`.trim(),
              }))}
              value={selectedNetid}
              onValueChange={setSelectedNetid}
              placeholder="Sélectionner un utilisateur"
              searchPlaceholder="Rechercher un utilisateur..."
              emptyMessage="Aucun utilisateur trouvé."
              required
            />
          )}
        </div>

        {/* Rôle */}
        <div className="space-y-2">
          <Label htmlFor="role" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Shield className="h-4 w-4 text-orange-600" />
            Rôle <span className="text-red-500">*</span>
          </Label>
          {loading ? (
            <div className="p-2 text-sm text-gray-500">Chargement...</div>
          ) : (
            <Combobox
              options={roles.map((role) => ({
                value: role.role,
                label: `${role.role} - ${role.descr}`,
              }))}
              value={selectedRole}
              onValueChange={setSelectedRole}
              placeholder="Sélectionner un rôle"
              searchPlaceholder="Rechercher un rôle..."
              emptyMessage="Aucun rôle trouvé."
              required
            />
          )}
        </div>

        {/* Rôle principal */}
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="rolep" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Shield className="h-4 w-4 text-orange-600" />
            Rôle principal
          </Label>
          <Combobox
            options={[
              { value: "Y", label: "Oui" },
              { value: "N", label: "Non" },
            ]}
            value={selectedRolep}
            onValueChange={setSelectedRolep}
            placeholder="Sélectionner..."
            searchPlaceholder="Rechercher..."
            emptyMessage="Aucun résultat."
          />
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

