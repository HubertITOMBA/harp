"use client";

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FormDialog } from '@/components/ui/form-dialog';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Menu, Pencil } from "lucide-react";
import { updateMenu } from '@/actions/update-menu';
import { toast } from 'react-toastify';
import Image from "next/image";
import { getAllRoles } from '@/lib/actions/menu-actions';

interface Role {
  role: string;
  descr: string;
}

const AVAILABLE_ICONS = [
  "anonym.png",
  "autov.png",
  "avatar.png",
  "base_only.png",
  "brain-cog.png",
  "build.png",
  "close.png",
  "combine.png",
  "concierge-bell.png",
  "concierge.png",
  "construction.png",
  "container.png",
  "database_off.png",
  "database_search.png",
  "database.png",
  "decommission.png",
  "delete.png",
  "delivery_truck_bolt.png",
  "delivery_truck_speed.png",
  "deployed.png",
  "desktop_landscape_add.png",
  "dessert.png",
  "diversity.png",
  "edi.png",
  "emoji_events_20dp.png",
  "emoji_events_24dp.png",
  "eraser.png",
  "eye.png",
  "ferme.png",
  "ferris-wheel.png",
  "file-pen-line.png",
  "filter.png",
  "flag.png",
  "format_list.png",
  "forms_add.png",
  "git-merge.png",
  "hand-platter.png",
  "handyman.png",
  "history.png",
  "image-minus.png",
  "invisible.png",
  "KO.png",
  "link.png",
  "list-plus.png",
  "list.png",
  "localact.png",
  "lock_open.png",
  "lock_person.png",
  "log-in.png",
  "log-out.png",
  "logo_dev.png",
  "logout.png",
  "maleFemale.png",
  "medal.png",
  "menu.png",
  "menuenv.png",
  "message.png",
  "modeling.png",
  "more.png",
  "moreDark.png",
  "newspaper.png",
  "no_accounts.png",
  "obsolete.png",
  "OK.png",
  "OPSE_logo_small.gif",
  "ouvert.png",
  "package.png",
  "pencil.png",
  "plus.png",
  "pocket-knife.png",
  "profile.png",
  "puzzle.png",
  "refresh.png",
  "restreint.png",
  "route.png",
  "search.png",
  "server-cog.png",
  "server-off.png",
  "server.png",
  "setting.png",
  "settings.png",
  "share-2.png",
  "shield-check.png",
  "shieldcheck.png",
  "socialead.png",
  "sort.png",
  "special.png",
  "speech.png",
  "tools_flat_head.png",
  "tools.png",
  "truck.png",
  "update.png",
  "user-pen.png",
  "users.png",
  "view.png",
  "visibility_lock.png",
  "visibility.png",
  "vpn_key_alert.png",
  "vpn_key.png",
  "wallet-cards.png",
  "workflow.png",
  "x.png",
];

interface EditMenuDialogProps {
  menu: {
    id: number;
    menu: string;
    href: string | null;
    descr: string | null;
    icone: string | null;
    display: number;
    level: number;
    active: number;
    role: string | null;
  };
}

export function EditMenuDialog({ menu }: EditMenuDialogProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [role, setRole] = useState<string>(menu.role || "");
  const [icone, setIcone] = useState<string>(menu.icone || "");
  const [active, setActive] = useState<string>(menu.active.toString());
  const [roles, setRoles] = useState<Role[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(true);

  useEffect(() => {
    async function fetchRoles() {
      try {
        setLoadingRoles(true);
        const rolesData = await getAllRoles();
        setRoles(rolesData);
      } catch (error) {
        console.error("Erreur lors de la récupération des rôles:", error);
        toast.error("Erreur lors du chargement des rôles");
      } finally {
        setLoadingRoles(false);
      }
    }
    fetchRoles();
  }, []);

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>,
    closeDialog: () => void
  ) => {
    e.preventDefault();
    setErrors({});
    
    const formData = new FormData(e.currentTarget);
    if (role) {
      formData.set("role", role);
    }
    if (icone) {
      formData.set("icone", icone);
    }
    formData.set("active", active);
    
    startTransition(async () => {
      const result = await updateMenu(menu.id, formData);
      
      if (result.success) {
        toast.success(result.message);
        closeDialog();
        router.refresh();
      } else {
        toast.error(result.error || "Erreur lors de la mise à jour du menu");
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
      title={`Modifier le menu ${menu.menu.toUpperCase()}`}
      description="Modifiez les informations du menu"
      onSubmit={handleSubmit}
      submitLabel="Enregistrer les modifications"
      submitIcon={<Pencil className="h-4 w-4" />}
      isPending={isPending}
      maxWidth="2xl"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Nom du menu */}
        <div className="space-y-2">
          <Label htmlFor="menu" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Menu className="h-4 w-4 text-orange-600" />
            Nom du menu <span className="text-red-500">*</span>
          </Label>
          <Input
            id="menu"
            name="menu"
            required
            defaultValue={menu.menu}
            className="bg-white"
            placeholder="Ex: PRODUCTION"
            maxLength={32}
          />
        </div>

        {/* URL */}
        <div className="space-y-2">
          <Label htmlFor="href" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Menu className="h-4 w-4 text-orange-600" />
            URL
          </Label>
          <Input
            id="href"
            name="href"
            defaultValue={menu.href || ""}
            className="bg-white"
            placeholder="Ex: /harp/envs/1"
            maxLength={100}
          />
        </div>

        {/* Icône */}
        <div className="space-y-2">
          <Label htmlFor="icone" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Menu className="h-4 w-4 text-orange-600" />
            Icône
          </Label>
          <Select value={icone || undefined} onValueChange={(value) => setIcone(value || "")}>
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="Sélectionner une icône">
                {icone || ""}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              {AVAILABLE_ICONS.map((icon) => (
                <SelectItem key={icon} value={icon}>
                  <div className="flex items-center gap-2">
                    <Image 
                      src={`/ressources/${icon}`} 
                      alt={icon} 
                      width={16} 
                      height={16} 
                      className="bg-transparent"
                    />
                    <span>{icon}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="descr" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Menu className="h-4 w-4 text-orange-600" />
            Description
          </Label>
          <Input
            id="descr"
            name="descr"
            defaultValue={menu.descr || ""}
            className="bg-white"
            placeholder="Ex: Environnements de production"
            maxLength={50}
          />
        </div>

        {/* Ordre d'affichage */}
        <div className="space-y-2">
          <Label htmlFor="display" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Menu className="h-4 w-4 text-orange-600" />
            Ordre d&apos;affichage
          </Label>
          <Input
            id="display"
            name="display"
            type="number"
            defaultValue={menu.display}
            className="bg-white"
            placeholder="Ex: 1"
            min={0}
          />
        </div>

        {/* Niveau */}
        <div className="space-y-2">
          <Label htmlFor="level" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Menu className="h-4 w-4 text-orange-600" />
            Niveau
          </Label>
          <Input
            id="level"
            name="level"
            type="number"
            defaultValue={menu.level}
            className="bg-white"
            placeholder="Ex: 1"
            min={0}
          />
        </div>

        {/* Rôle */}
        <div className="space-y-2">
          <Label htmlFor="role" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Menu className="h-4 w-4 text-orange-600" />
            Rôle
          </Label>
          <Select value={role || undefined} onValueChange={(value) => setRole(value || "")} disabled={loadingRoles}>
            <SelectTrigger className="bg-white">
              <SelectValue placeholder={loadingRoles ? "Chargement..." : "Sélectionner un rôle"} />
            </SelectTrigger>
            <SelectContent>
              {roles.map((r) => (
                <SelectItem key={r.role} value={r.role}>
                  <div className="flex flex-col">
                    <span className="font-medium">{r.role}</span>
                    {r.descr && (
                      <span className="text-xs text-gray-500">{r.descr}</span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Statut */}
        <div className="space-y-2">
          <Label htmlFor="active" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Menu className="h-4 w-4 text-orange-600" />
            Statut
          </Label>
          <Select value={active} onValueChange={(value) => setActive(value)}>
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="Sélectionner un statut" />
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

