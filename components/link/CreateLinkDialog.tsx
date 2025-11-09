"use client";

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { FormDialog } from '@/components/ui/form-dialog';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Link as LinkIcon, Plus } from "lucide-react";
import { createLink } from '@/actions/create-link';
import { toast } from 'react-toastify';

export function CreateLinkDialog() {
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
      const result = await createLink(formData);
      
      if (result.success) {
        toast.success(result.message);
        closeDialog();
        router.refresh();
      } else {
        toast.error(result.error || "Erreur lors de la création du lien");
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
          Créer un lien
        </Button>
      }
      title="Créer un nouveau lien"
      description="Remplissez les informations pour créer un nouveau lien"
      onSubmit={handleSubmit}
      submitLabel="Créer le lien"
      submitIcon={<LinkIcon className="h-4 w-4" />}
      isPending={isPending}
      maxWidth="2xl"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Nom du lien */}
        <div className="space-y-2">
          <Label htmlFor="link" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <LinkIcon className="h-4 w-4 text-orange-600" />
            Nom du lien <span className="text-red-500">*</span>
          </Label>
          <Input
            id="link"
            name="link"
            required
            className="bg-white"
            placeholder="Ex: Documentation"
            maxLength={32}
          />
        </div>

        {/* Type de lien */}
        <div className="space-y-2">
          <Label htmlFor="typlink" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <LinkIcon className="h-4 w-4 text-orange-600" />
            Type de lien <span className="text-red-500">*</span>
          </Label>
          <Input
            id="typlink"
            name="typlink"
            required
            className="bg-white"
            placeholder="Ex: INTERNAL"
            maxLength={32}
          />
        </div>

        {/* Onglet */}
        <div className="space-y-2">
          <Label htmlFor="tab" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <LinkIcon className="h-4 w-4 text-orange-600" />
            Onglet <span className="text-red-500">*</span>
          </Label>
          <Input
            id="tab"
            name="tab"
            required
            className="bg-white"
            placeholder="Ex: MAIN"
            maxLength={32}
          />
        </div>

        {/* URL */}
        <div className="space-y-2">
          <Label htmlFor="url" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <LinkIcon className="h-4 w-4 text-orange-600" />
            URL <span className="text-red-500">*</span>
          </Label>
          <Input
            id="url"
            name="url"
            type="url"
            required
            className="bg-white"
            placeholder="Ex: https://example.com"
            maxLength={255}
          />
        </div>

        {/* Logo */}
        <div className="space-y-2">
          <Label htmlFor="logo" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <LinkIcon className="h-4 w-4 text-orange-600" />
            Logo
          </Label>
          <Input
            id="logo"
            name="logo"
            className="bg-white"
            placeholder="Ex: logo.png"
            maxLength={50}
          />
        </div>

        {/* Display */}
        <div className="space-y-2">
          <Label htmlFor="display" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <LinkIcon className="h-4 w-4 text-orange-600" />
            Ordre d&apos;affichage
          </Label>
          <Input
            id="display"
            name="display"
            type="number"
            className="bg-white"
            placeholder="Ex: 1"
            defaultValue={0}
          />
        </div>

        {/* Description */}
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="descr" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <LinkIcon className="h-4 w-4 text-orange-600" />
            Description
          </Label>
          <Input
            id="descr"
            name="descr"
            className="bg-white"
            placeholder="Ex: Documentation technique"
            maxLength={50}
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

