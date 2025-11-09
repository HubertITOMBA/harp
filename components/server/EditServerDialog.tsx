"use client";

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { FormDialog } from '@/components/ui/form-dialog';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Server, Network, Monitor, User, Globe, Pencil } from "lucide-react";
import { updateServer } from '@/actions/update-server';
import { toast } from 'react-toastify';

interface EditServerDialogProps {
  server: {
    srv: string;
    ip: string;
    pshome: string;
    os: string | null;
    psuser: string | null;
    domain: string | null;
    statenvId: number | null;
  };
}

export function EditServerDialog({ server }: EditServerDialogProps) {
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
      const result = await updateServer(server.srv, formData);
      
      if (result.success) {
        toast.success(result.message);
        closeDialog();
        router.refresh();
      } else {
        toast.error(result.error || "Erreur lors de la mise à jour du serveur");
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
      title={`Modifier le serveur ${server.srv}`}
      description="Modifiez les informations du serveur"
      onSubmit={handleSubmit}
      submitLabel="Enregistrer les modifications"
      submitIcon={<Pencil className="h-4 w-4" />}
      isPending={isPending}
      maxWidth="2xl"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Nom du serveur (lecture seule) */}
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="srv" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Server className="h-4 w-4 text-orange-600" />
            Nom du serveur
          </Label>
          <Input
            id="srv"
            value={server.srv}
            disabled
            className="bg-gray-100 cursor-not-allowed"
          />
        </div>

        {/* Adresse IP */}
        <div className="space-y-2">
          <Label htmlFor="ip" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Network className="h-4 w-4 text-orange-600" />
            Adresse IP <span className="text-red-500">*</span>
          </Label>
          <Input
            id="ip"
            name="ip"
            required
            defaultValue={server.ip}
            type="text"
            className="bg-white"
            placeholder="Ex: 192.168.1.1"
          />
        </div>

        {/* PS Home */}
        <div className="space-y-2">
          <Label htmlFor="pshome" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Server className="h-4 w-4 text-orange-600" />
            PS Home <span className="text-red-500">*</span>
          </Label>
          <Input
            id="pshome"
            name="pshome"
            required
            defaultValue={server.pshome}
            className="bg-white"
            placeholder="Ex: /opt/peoplesoft"
          />
        </div>

        {/* Système d'exploitation */}
        <div className="space-y-2">
          <Label htmlFor="os" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Monitor className="h-4 w-4 text-orange-600" />
            Système d&apos;exploitation
          </Label>
          <Input
            id="os"
            name="os"
            defaultValue={server.os || ''}
            className="bg-white"
            placeholder="Ex: Linux"
            maxLength={15}
          />
        </div>

        {/* PS User */}
        <div className="space-y-2">
          <Label htmlFor="psuser" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <User className="h-4 w-4 text-orange-600" />
            PS User
          </Label>
          <Input
            id="psuser"
            name="psuser"
            defaultValue={server.psuser || ''}
            className="bg-white"
            placeholder="Ex: psadm"
            maxLength={15}
          />
        </div>

        {/* Domaine */}
        <div className="space-y-2">
          <Label htmlFor="domain" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Globe className="h-4 w-4 text-orange-600" />
            Domaine
          </Label>
          <Input
            id="domain"
            name="domain"
            defaultValue={server.domain || ''}
            className="bg-white"
            placeholder="Ex: DOMAIN"
            maxLength={10}
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

