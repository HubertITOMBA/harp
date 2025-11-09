"use client";

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { FormDialog } from '@/components/ui/form-dialog';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { User, Mail, Key, Calendar, Hash, UserCircle, Pencil } from "lucide-react";
import { updateUser } from '@/actions/update-user';
import { toast } from 'react-toastify';
import { SSHKeyInput } from '@/components/user/SSHKeyInput';

interface EditUserDialogProps {
  user: {
    netid: string;
    nom: string | null;
    prenom: string | null;
    email: string | null;
    unxid: string | null;
    oprid: string | null;
    pkeyfile: string | null;
    defpage: string | null;
    expunx: Date | null;
    expora: Date | null;
  };
}

export function EditUserDialog({ user }: EditUserDialogProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Formater les dates pour les inputs datetime-local
  const formatDateForInput = (date: Date | null) => {
    if (!date) return '';
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
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
      const result = await updateUser(user.netid, formData);
      
      if (result.success) {
        toast.success(result.message);
        closeDialog();
        router.refresh();
      } else {
        toast.error(result.error || "Erreur lors de la mise à jour de l'utilisateur");
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
      title={`Modifier l'utilisateur ${user.netid}`}
      description="Modifiez les informations de l'utilisateur"
      onSubmit={handleSubmit}
      submitLabel="Enregistrer les modifications"
      submitIcon={<Pencil className="h-4 w-4" />}
      isPending={isPending}
      maxWidth="2xl"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Net ID (lecture seule) */}
        <div className="space-y-2">
          <Label htmlFor="netid" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Hash className="h-4 w-4 text-orange-600" />
            Net ID
          </Label>
          <Input
            id="netid"
            value={user.netid}
            disabled
            className="bg-gray-100 cursor-not-allowed"
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
            defaultValue={user.prenom || ''}
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
            defaultValue={user.nom || ''}
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
            defaultValue={user.email || ''}
            className="bg-white"
            placeholder="Ex: jean.dupont@example.com"
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
            defaultValue={user.unxid || ''}
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
            defaultValue={user.oprid || ''}
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
            defaultValue={user.pkeyfile || ''}
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
            defaultValue={user.defpage || ''}
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
            defaultValue={formatDateForInput(user.expunx)}
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
            defaultValue={formatDateForInput(user.expora)}
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

