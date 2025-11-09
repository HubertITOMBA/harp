"use client";

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { FormDialog } from '@/components/ui/form-dialog';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { User, Mail, Key, Calendar, Hash, Lock, UserCircle, Plus } from "lucide-react";
import { createUser } from '@/actions/create-user';
import { toast } from 'react-toastify';
import { SSHKeyInput } from '@/components/user/SSHKeyInput';

export function CreateUserDialog() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>,
    closeDialog: () => void
  ) => {
    e.preventDefault();
    setErrors({});
    
    const formData = new FormData(e.currentTarget);
    
    startTransition(async () => {
      const result = await createUser(formData);
      
      if (result.success) {
        toast.success(result.message);
        closeDialog();
        router.refresh();
      } else {
        toast.error(result.error || "Erreur lors de la création de l'utilisateur");
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
          Créer un utilisateur
        </Button>
      }
      title="Créer un nouvel utilisateur"
      description="Remplissez les informations pour créer un nouveau compte utilisateur"
      onSubmit={handleSubmit}
      submitLabel="Créer l'utilisateur"
      submitIcon={<User className="h-4 w-4" />}
      isPending={isPending}
      maxWidth="2xl"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Net ID */}
        <div className="space-y-2">
          <Label htmlFor="netid" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Hash className="h-4 w-4 text-orange-600" />
            Net ID <span className="text-red-500">*</span>
          </Label>
          <Input
            id="netid"
            name="netid"
            required
            className="bg-white"
            placeholder="Ex: jdupont"
          />
        </div>

        {/* Prénom */}
        <div className="space-y-2">
          <Label htmlFor="prenom" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <User className="h-4 w-4 text-orange-600" />
            Prénom
          </Label>
          <Input
            id="prenom"
            name="prenom"
            className="bg-white"
            placeholder="Ex: Jean"
          />
        </div>

        {/* Nom */}
        <div className="space-y-2">
          <Label htmlFor="nom" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <User className="h-4 w-4 text-orange-600" />
            Nom
          </Label>
          <Input
            id="nom"
            name="nom"
            className="bg-white"
            placeholder="Ex: Dupont"
          />
        </div>

        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Mail className="h-4 w-4 text-orange-600" />
            Adresse email
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            className="bg-white"
            placeholder="Ex: jean.dupont@example.com"
          />
        </div>

        {/* Mot de passe */}
        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Lock className="h-4 w-4 text-orange-600" />
            Mot de passe <span className="text-red-500">*</span>
          </Label>
          <Input
            id="password"
            name="password"
            type="password"
            required
            minLength={6}
            className="bg-white"
            placeholder="Minimum 6 caractères"
          />
        </div>

        {/* Compte Unix */}
        <div className="space-y-2">
          <Label htmlFor="unxid" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <UserCircle className="h-4 w-4 text-orange-600" />
            Compte Unix
          </Label>
          <Input
            id="unxid"
            name="unxid"
            className="bg-white"
            placeholder="Ex: jdupont"
          />
        </div>

        {/* OprId */}
        <div className="space-y-2">
          <Label htmlFor="oprid" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Hash className="h-4 w-4 text-orange-600" />
            OprId
          </Label>
          <Input
            id="oprid"
            name="oprid"
            className="bg-white"
            placeholder="Ex: OPRID001"
          />
        </div>

        {/* Clé SSH */}
        <div className="space-y-2">
          <Label htmlFor="pkeyfile" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Key className="h-4 w-4 text-orange-600" />
            Clé SSH
          </Label>
          <SSHKeyInput
            id="pkeyfile"
            name="pkeyfile"
            className="bg-white"
            placeholder="Ex: ~/.ssh/id_rsa ou /path/to/key.pem"
          />
        </div>

        {/* Page par défaut */}
        <div className="space-y-2">
          <Label htmlFor="defpage" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <User className="h-4 w-4 text-orange-600" />
            Page par défaut
          </Label>
          <Input
            id="defpage"
            name="defpage"
            className="bg-white"
            placeholder="Ex: /home"
          />
        </div>

        {/* Expiration compte Unix */}
        <div className="space-y-2">
          <Label htmlFor="expunx" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-orange-600" />
            Expiration compte Unix
          </Label>
          <Input
            id="expunx"
            name="expunx"
            type="datetime-local"
            className="bg-white"
          />
        </div>

        {/* Expiration Oracle */}
        <div className="space-y-2">
          <Label htmlFor="expora" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-orange-600" />
            Expiration Oracle
          </Label>
          <Input
            id="expora"
            name="expora"
            type="datetime-local"
            className="bg-white"
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

