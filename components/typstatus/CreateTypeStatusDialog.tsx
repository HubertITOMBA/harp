"use client";

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { FormDialog } from '@/components/ui/form-dialog';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Flag, FileText, Image, Plus, Upload, X } from "lucide-react";
import { createTypeStatus } from '@/actions/create-typstatus';
import { uploadIcon } from '@/actions/upload-icon';
import { toast } from 'react-toastify';

export function CreateTypeStatusDialog() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setUploadedFileName(null);
    const fileInput = document.getElementById('icon-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('icon', selectedFile);

    try {
      const result = await uploadIcon(formData);
      if (result.success && result.fileName) {
        setUploadedFileName(result.fileName);
        toast.success(result.message);
      } else {
        toast.error(result.error || "Erreur lors de l'upload de l'image");
      }
    } catch (error) {
      toast.error("Erreur lors de l'upload de l'image");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>,
    closeDialog: () => void
  ) => {
    e.preventDefault();
    setErrors({});
    
    const formData = new FormData(e.currentTarget);
    
    // Si un fichier a été uploadé, utiliser son nom
    if (uploadedFileName) {
      formData.set('icone', uploadedFileName);
    }
    
    startTransition(async () => {
      const result = await createTypeStatus(formData);
      
      if (result.success) {
        toast.success(result.message);
        closeDialog();
        router.refresh();
      } else {
        toast.error(result.error || "Erreur lors de la création du statut");
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
          Créer un statut
        </Button>
      }
      title="Créer un nouveau statut"
      description="Remplissez les informations pour créer un nouveau statut"
      onSubmit={handleSubmit}
      submitLabel="Créer le statut"
      submitIcon={<Flag className="h-4 w-4" />}
      isPending={isPending}
      maxWidth="2xl"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Statut */}
        <div className="space-y-2">
          <Label htmlFor="statenv" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Flag className="h-4 w-4 text-orange-600" />
            Statut <span className="text-red-500">*</span>
          </Label>
          <Input
            id="statenv"
            name="statenv"
            required
            className="bg-white"
            placeholder="Ex: ACTIF"
            maxLength={32}
          />
        </div>

        {/* Description */}
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="descr" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <FileText className="h-4 w-4 text-orange-600" />
            Description
          </Label>
          <Input
            id="descr"
            name="descr"
            className="bg-white"
            placeholder="Ex: Environnement actif"
            maxLength={70}
          />
        </div>

        {/* Icône - Upload */}
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="icon-upload" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Image className="h-4 w-4 text-orange-600" />
            Icône
          </Label>
          
          {!selectedFile && !uploadedFileName && (
            <div className="flex items-center gap-2">
              <Input
                id="icon-upload"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="bg-white"
              />
            </div>
          )}

          {selectedFile && !uploadedFileName && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">{selectedFile.name}</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleUpload}
                  disabled={isUploading}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {isUploading ? "Upload en cours..." : "Uploader"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleRemoveFile}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              {previewUrl && (
                <div className="mt-2">
                  <img 
                    src={previewUrl} 
                    alt="Preview" 
                    className="h-20 w-20 object-contain border border-gray-200 rounded"
                  />
                </div>
              )}
            </div>
          )}

          {uploadedFileName && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">{uploadedFileName}</span>
              <img 
                src={`/icones/${uploadedFileName}`} 
                alt="Uploaded icon" 
                className="h-8 w-8 object-contain"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRemoveFile}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Champ caché pour le nom du fichier */}
          <Input
            id="icone"
            name="icone"
            type="hidden"
            value={uploadedFileName || ''}
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

