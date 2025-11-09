"use client";

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FormDialog } from '@/components/ui/form-dialog';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Server, Plus } from "lucide-react";
import { createServRole } from '@/actions/create-servrole';
import { toast } from 'react-toastify';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ServerData {
  srv: string;
  ip: string;
  os: string;
}

interface Environment {
  env: string;
  descr: string;
  site: string;
}

interface TypeServer {
  typsrv: string;
  descr: string;
}

export function CreateServRoleDialog() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [servers, setServers] = useState<ServerData[]>([]);
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [typeServers, setTypeServers] = useState<TypeServer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSrv, setSelectedSrv] = useState<string>('');
  const [selectedEnv, setSelectedEnv] = useState<string>('');
  const [selectedTypsrv, setSelectedTypsrv] = useState<string>('');
  const [status, setStatus] = useState<string>('1');

  useEffect(() => {
    async function fetchData() {
      try {
        const [serversRes, envsRes, typsrvRes] = await Promise.all([
          fetch('/api/servers'),
          fetch('/api/environments'),
          fetch('/api/typeservers'),
        ]);
        const serversData = await serversRes.json();
        const envsData = await envsRes.json();
        const typsrvData = await typsrvRes.json();
        setServers(serversData);
        setEnvironments(envsData);
        setTypeServers(typsrvData);
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
    
    if (!selectedSrv || !selectedEnv || !selectedTypsrv) {
      setErrors({ general: "Veuillez remplir tous les champs obligatoires" });
      return;
    }
    
    const formData = new FormData();
    formData.append('srv', selectedSrv);
    formData.append('env', selectedEnv);
    formData.append('typsrv', selectedTypsrv);
    formData.append('status', status);
    
    startTransition(async () => {
      const result = await createServRole(formData);
      
      if (result.success) {
        toast.success(result.message);
        closeDialog();
        setSelectedSrv('');
        setSelectedEnv('');
        setSelectedTypsrv('');
        setStatus('1');
        router.refresh();
      } else {
        toast.error(result.error || "Erreur lors de la création du rôle serveur");
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
          Créer un rôle serveur
        </Button>
      }
      title="Créer un rôle serveur"
      description="Sélectionnez un serveur, un environnement et un type de serveur"
      onSubmit={handleSubmit}
      submitLabel="Créer le rôle serveur"
      submitIcon={<Server className="h-4 w-4" />}
      isPending={isPending}
      maxWidth="2xl"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Serveur */}
        <div className="space-y-2">
          <Label htmlFor="srv" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Server className="h-4 w-4 text-orange-600" />
            Serveur <span className="text-red-500">*</span>
          </Label>
          {loading ? (
            <div className="p-2 text-sm text-gray-500">Chargement...</div>
          ) : (
            <Select value={selectedSrv} onValueChange={setSelectedSrv} required>
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="Sélectionner un serveur" />
              </SelectTrigger>
              <SelectContent>
                {servers.map((server) => (
                  <SelectItem key={server.srv} value={server.srv}>
                    {server.srv} - {server.ip} ({server.os})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Environnement */}
        <div className="space-y-2">
          <Label htmlFor="env" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Server className="h-4 w-4 text-orange-600" />
            Environnement <span className="text-red-500">*</span>
          </Label>
          {loading ? (
            <div className="p-2 text-sm text-gray-500">Chargement...</div>
          ) : (
            <Select value={selectedEnv} onValueChange={setSelectedEnv} required>
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="Sélectionner un environnement" />
              </SelectTrigger>
              <SelectContent>
                {environments.map((env) => (
                  <SelectItem key={env.env} value={env.env}>
                    {env.env} - {env.descr}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Type de serveur */}
        <div className="space-y-2">
          <Label htmlFor="typsrv" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Server className="h-4 w-4 text-orange-600" />
            Type de serveur <span className="text-red-500">*</span>
          </Label>
          {loading ? (
            <div className="p-2 text-sm text-gray-500">Chargement...</div>
          ) : (
            <Select value={selectedTypsrv} onValueChange={setSelectedTypsrv} required>
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="Sélectionner un type de serveur" />
              </SelectTrigger>
              <SelectContent>
                {typeServers.map((typsrv) => (
                  <SelectItem key={typsrv.typsrv} value={typsrv.typsrv}>
                    {typsrv.typsrv} - {typsrv.descr}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Statut */}
        <div className="space-y-2">
          <Label htmlFor="status" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Server className="h-4 w-4 text-orange-600" />
            Statut
          </Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Actif</SelectItem>
              <SelectItem value="0">Inactif</SelectItem>
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

