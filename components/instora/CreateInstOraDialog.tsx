"use client";

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FormDialog } from '@/components/ui/form-dialog';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Database, Plus } from "lucide-react";
import { createInstOra } from '@/actions/create-instora';
import { toast } from 'react-toastify';

interface Server {
  id: number;
  srv: string;
  ip: string;
  os: string;
}

interface TypeBase {
  id: number;
  type_base: string;
}

export function CreateInstOraDialog() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [servers, setServers] = useState<Server[]>([]);
  const [typeBases, setTypeBases] = useState<TypeBase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [serversRes, typeBasesRes] = await Promise.all([
          fetch('/api/harpservers'),
          fetch('/api/typebases'),
        ]);

        if (serversRes.ok) {
          const serversData = await serversRes.json();
          setServers(serversData);
        }

        if (typeBasesRes.ok) {
          const typeBasesData = await typeBasesRes.json();
          setTypeBases(typeBasesData);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
        toast.error('Erreur lors du chargement des données');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>,
    closeDialog: () => void
  ) => {
    e.preventDefault();
    setErrors({});
    
    const formData = new FormData(e.currentTarget);
    
    startTransition(async () => {
      const result = await createInstOra(formData);
      
      if (result.success) {
        toast.success(result.message);
        closeDialog();
        router.refresh();
      } else {
        toast.error(result.error || "Erreur lors de la création de l'instance");
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
          Créer une instance
        </Button>
      }
      title="Créer une nouvelle instance Oracle"
      description="Remplissez les informations pour créer une nouvelle instance"
      onSubmit={handleSubmit}
      submitLabel="Créer l'instance"
      submitIcon={<Database className="h-4 w-4" />}
      isPending={isPending}
      maxWidth="2xl"
    >
      {loading ? (
        <div className="text-center py-4">Chargement...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Oracle SID */}
          <div className="space-y-2">
            <Label htmlFor="oracle_sid" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Database className="h-4 w-4 text-orange-600" />
              Oracle SID <span className="text-red-500">*</span>
            </Label>
            <Input
              id="oracle_sid"
              name="oracle_sid"
              required
              className="bg-white"
              placeholder="Ex: PRODDB01"
              maxLength={8}
              minLength={8}
            />
            <p className="text-xs text-gray-500">Exactement 8 caractères</p>
          </div>

          {/* Serveur */}
          <div className="space-y-2">
            <Label htmlFor="serverId" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Database className="h-4 w-4 text-orange-600" />
              Serveur <span className="text-red-500">*</span>
            </Label>
            <Select name="serverId" required>
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="Sélectionner un serveur" />
              </SelectTrigger>
              <SelectContent>
                {servers.map((server) => (
                  <SelectItem key={server.id} value={server.id.toString()}>
                    {server.srv} ({server.ip}) - {server.os}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Type de base */}
          <div className="space-y-2">
            <Label htmlFor="typebaseId" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Database className="h-4 w-4 text-orange-600" />
              Type de base <span className="text-red-500">*</span>
            </Label>
            <Select name="typebaseId" required>
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="Sélectionner un type de base" />
              </SelectTrigger>
              <SelectContent>
                {typeBases.map((typeBase) => (
                  <SelectItem key={typeBase.id} value={typeBase.id.toString()}>
                    {typeBase.type_base}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="descr" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Database className="h-4 w-4 text-orange-600" />
              Description <span className="text-red-500">*</span>
            </Label>
            <Input
              id="descr"
              name="descr"
              required
              className="bg-white"
              placeholder="Ex: Instance de production"
              maxLength={50}
              minLength={6}
            />
          </div>
        </div>
      )}

      {errors.general && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {errors.general}
        </div>
      )}
    </FormDialog>
  );
}

