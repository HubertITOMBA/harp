"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ActionsDropdown, ActionItem } from '@/components/ui/actions-dropdown';
import { Eye, Pencil, Menu as MenuIcon, Ban, Users } from "lucide-react";
import { ViewMenuDialog } from './ViewMenuDialog';
import { EditMenuDialog } from './EditMenuDialog';
import { MenuRolesDialog } from './MenuRolesDialog';
import { toggleMenuStatus } from '@/actions/toggle-menu-status';
import { toast } from 'react-toastify';

interface MenuActionsProps {
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

export function MenuActions({ menu }: MenuActionsProps) {
  const router = useRouter();
  const [viewOpen, setViewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [rolesOpen, setRolesOpen] = useState(false);
  const isDisabled = menu.active === 0;

  const handleToggleStatus = async () => {
    if (isDisabled) {
      if (!confirm(`Êtes-vous sûr de vouloir activer le menu ${menu.menu} ?`)) {
        return;
      }
    } else {
      if (!confirm(`Êtes-vous sûr de vouloir désactiver le menu ${menu.menu} ?`)) {
        return;
      }
    }

    const result = await toggleMenuStatus(menu.id);
    
    if (result.success) {
      toast.success(result.message);
      router.refresh();
    } else {
      toast.error(result.error || "Erreur lors de la modification du statut");
    }
  };

  const actions: ActionItem[] = [
    {
      label: "Voir",
      icon: <Eye className="h-4 w-4" />,
      onClick: () => setViewOpen(true),
    },
    {
      label: "Modifier",
      icon: <Pencil className="h-4 w-4" />,
      onClick: () => setEditOpen(true),
    },
    {
      label: "Rôles",
      icon: <Users className="h-4 w-4" />,
      onClick: () => setRolesOpen(true),
    },
    {
      label: isDisabled ? "Activer" : "Désactiver",
      icon: isDisabled ? (
        <MenuIcon className="h-4 w-4" />
      ) : (
        <Ban className="h-4 w-4" />
      ),
      onClick: handleToggleStatus,
      variant: isDisabled ? "default" : "destructive",
    },
  ];

  return (
    <>
      <ActionsDropdown actions={actions} />
      
      <ViewMenuDialog 
        menuId={menu.id}
        open={viewOpen}
        onOpenChange={setViewOpen}
      />
      
      <EditMenuDialog 
        menu={menu}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
      
      <MenuRolesDialog 
        menuId={menu.id} 
        menuName={menu.menu}
        open={rolesOpen}
        onOpenChange={setRolesOpen}
      />
    </>
  );
}

