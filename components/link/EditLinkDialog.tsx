"use client";

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { FormDialog } from '@/components/ui/form-dialog';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Link as LinkIcon, Pencil } from "lucide-react";
import { updateLink } from '@/actions/update-link';
import { toast } from 'react-toastify';

interface EditLinkDialogProps {
  link: {
    display: number;
    link: string;
    typlink: string;
    url: string;
    tab: string;
    logo: string;
    descr: string;
  };
}

export function EditLinkDialog({ link }: EditLinkDialogProps) {
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
      const result = await updateLink(link.link, link.typlink, link.tab, formData);
      
      if (result.success) {
        toast.success(result.message);
        closeDialog();
        router.refresh();
      } else {
        toast.error(result.error || "Erreur lors de la mise à jour du lien");
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
      title={`Modifier le lien ${link.link.toUpperCase()}`}
      description="Modifiez les informations du lien"
      onSubmit={handleSubmit}
      submitLabel="Enregistrer les modifications"
      submitIcon={<Pencil className="h-4 w-4" />}
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
            defaultValue={link.link}
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
            defaultValue={link.typlink}
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
            defaultValue={link.tab}
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
            defaultValue={link.url}
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
            defaultValue={link.logo}
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
            defaultValue={link.display}
            className="bg-white"
            placeholder="Ex: 1"
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
            defaultValue={link.descr}
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

