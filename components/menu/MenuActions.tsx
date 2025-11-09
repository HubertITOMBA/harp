"use client";

import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Eye, Pencil, Menu as MenuIcon, Ban } from "lucide-react";
import { ViewMenuDialog } from './ViewMenuDialog';
import { EditMenuDialog } from './EditMenuDialog';
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

  return (
    <div className="flex items-center gap-1 sm:gap-2">
      <ViewMenuDialog menuId={menu.id} />
      <EditMenuDialog menu={menu} />
      <Button
        variant="outline"
        size="sm"
        className={`h-7 w-7 sm:h-8 sm:w-8 p-0 ${isDisabled ? 'border-green-300 hover:bg-green-50' : 'border-red-300 hover:bg-red-50'}`}
        title={isDisabled ? "Activer" : "Désactiver"}
        onClick={handleToggleStatus}
      >
        {isDisabled ? (
          <MenuIcon className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
        ) : (
          <Ban className="h-3 w-3 sm:h-4 sm:w-4 text-red-600" />
        )}
      </Button>
    </div>
  );
}

