"use client"

import { useState, useRef, useEffect } from 'react'
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FolderOpen } from "lucide-react";

interface SSHKeyInputProps {
  id: string;
  name: string;
  defaultValue?: string;
  className?: string;
  placeholder?: string;
}

export function SSHKeyInput({ id, name, defaultValue = '', className = '', placeholder }: SSHKeyInputProps) {
  const [value, setValue] = useState(defaultValue);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hiddenInputRef = useRef<HTMLInputElement>(null);

  // Synchroniser avec defaultValue si changé
  useEffect(() => {
    if (defaultValue !== undefined) {
      setValue(defaultValue);
    }
  }, [defaultValue]);

  const handleBrowse = () => {
    fileInputRef.current?.click();
  };

  const formatPath = (fileName: string): string => {
    // Nettoyer le nom du fichier
    const cleanName = fileName.trim();
    
    // Si le nom contient déjà un chemin, le garder tel quel
    if (cleanName.includes('/') || cleanName.startsWith('~')) {
      return cleanName;
    }
    
    // Sinon, formater comme chemin SSH standard
    // Enlever l'extension si c'est .pub pour la clé privée
    const nameWithoutExt = cleanName.replace(/\.pub$/, '');
    return `~/.ssh/${nameWithoutExt}`;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const fileName = file.name;
      const formattedPath = formatPath(fileName);
      setValue(formattedPath);
      
      // Mettre à jour l'input caché pour le formulaire
      if (hiddenInputRef.current) {
        hiddenInputRef.current.value = formattedPath;
      }
    }
    
    // Réinitialiser l'input file pour permettre de sélectionner le même fichier à nouveau
    e.target.value = '';
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    
    // Mettre à jour l'input caché
    if (hiddenInputRef.current) {
      hiddenInputRef.current.value = newValue;
    }
  };

  return (
    <div className="flex gap-2">
      <input
        ref={hiddenInputRef}
        type="hidden"
        name={name}
        value={value}
      />
      <Input
        id={id}
        value={value}
        onChange={handleInputChange}
        className={`flex-1 font-mono text-sm ${className}`}
        placeholder={placeholder || "Ex: ~/.ssh/id_rsa ou /path/to/key.pem"}
      />
      <Button
        type="button"
        variant="outline"
        onClick={handleBrowse}
        className="shrink-0 border-orange-300 hover:bg-orange-50"
        title="Parcourir et sélectionner un fichier de clé SSH"
      >
        <FolderOpen className="h-4 w-4 mr-1" />
        Parcourir
      </Button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".pem,.key,.pub,.id_rsa,.id_ed25519,.*"
        className="hidden"
        onChange={handleFileSelect}
      />
    </div>
  );
}

