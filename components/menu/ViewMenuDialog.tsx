"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Eye, Loader2, ArrowLeft } from "lucide-react";
import { ViewMenuContent } from './ViewMenuContent';
import { getMenuById } from '@/lib/actions/menu-actions';

interface ViewMenuDialogProps {
  menuId: number;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

interface MenuData {
  id: number;
  menu: string;
  href: string | null;
  descr: string | null;
  icone: string | null;
  display: number;
  level: number;
  active: number;
  role: string | null;
  harpmenurole: Array<{
    harproles: {
      id: number;
      role: string;
      descr: string;
    } | null;
  }>;
}

export function ViewMenuDialog({ menuId, open: controlledOpen, onOpenChange }: ViewMenuDialogProps) {
  const router = useRouter();
  const [menuData, setMenuData] = useState<MenuData | null>(null);
  const [loading, setLoading] = useState(false);
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;

  const handleBackToList = () => {
    setOpen(false);
    setTimeout(() => {
      router.push('/list/menus');
    }, 100);
  };

  useEffect(() => {
    if (open) {
      setLoading(true);
      getMenuById(menuId)
        .then((data) => {
          setMenuData(data as MenuData | null);
        })
        .catch((error) => {
          console.error("Erreur lors du chargement du menu:", error);
          setMenuData(null);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      // Réinitialiser les données quand le dialog se ferme
      setMenuData(null);
    }
  }, [open, menuId]);

  // Si open/onOpenChange sont fournis, ne pas afficher de trigger (contrôlé depuis l'extérieur)
  if (controlledOpen !== undefined || onOpenChange) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[60vw] max-h-[85vh] overflow-y-auto">
        <DialogHeader className="space-y-0">
          <DialogTitle className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-3 py-1.5 rounded-t-md -mx-6 -mt-6 text-base sm:text-lg">
            Menu {menuData?.menu.toUpperCase() || ""}
          </DialogTitle>
          {menuData && (
            <DialogDescription className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-3 py-1 rounded-b-md -mx-6 mb-3 text-xs sm:text-sm">
              {menuData.descr || "Informations complètes du menu"}
            </DialogDescription>
          )}
        </DialogHeader>
        <div className="py-2">
          {loading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-orange-500" />
            </div>
          ) : menuData ? (
            <>
              {/* Bouton retour en haut */}
              <div className="mb-3 flex justify-start pb-2 border-b border-slate-200">
                <Button 
                  onClick={handleBackToList}
                  variant="outline" 
                  size="sm" 
                  className="bg-slate-50 hover:bg-slate-100 border-slate-300 text-slate-700 hover:text-slate-900 text-xs sm:text-sm shadow-sm"
                >
                  <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5" />
                  Retour à la liste
                </Button>
              </div>
              <ViewMenuContent menu={menuData} />
              <div className="mt-3 flex justify-start pt-2 border-t border-slate-200">
                <Button 
                  onClick={handleBackToList}
                  variant="outline" 
                  size="sm" 
                  className="bg-slate-50 hover:bg-slate-100 border-slate-300 text-slate-700 hover:text-slate-900 text-xs sm:text-sm shadow-sm"
                >
                  <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5" />
                  Retour à la liste
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center py-6 text-gray-500 text-sm">
              Erreur lors du chargement des données
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
    );
  }

  // Sinon, afficher avec trigger (mode non-contrôlé)
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-7 w-7 sm:h-8 sm:w-8 p-0 border-orange-300 hover:bg-orange-50"
          title="Voir"
        >
          <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[60vw] max-h-[85vh] overflow-y-auto">
        <DialogHeader className="space-y-0">
          <DialogTitle className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-3 py-1.5 rounded-t-md -mx-6 -mt-6 text-base sm:text-lg">
            Menu {menuData?.menu.toUpperCase() || ""}
          </DialogTitle>
          {menuData && (
            <DialogDescription className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-3 py-1 rounded-b-md -mx-6 mb-3 text-xs sm:text-sm">
              {menuData.descr || "Informations complètes du menu"}
            </DialogDescription>
          )}
        </DialogHeader>
        <div className="py-2">
          {loading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-orange-500" />
            </div>
          ) : menuData ? (
            <>
              {/* Bouton retour en haut */}
              <div className="mb-3 flex justify-start pb-2 border-b border-slate-200">
                <Button 
                  onClick={handleBackToList}
                  variant="outline" 
                  size="sm" 
                  className="bg-slate-50 hover:bg-slate-100 border-slate-300 text-slate-700 hover:text-slate-900 text-xs sm:text-sm shadow-sm"
                >
                  <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5" />
                  Retour à la liste
                </Button>
              </div>
              <ViewMenuContent menu={menuData} />
              <div className="mt-3 flex justify-start pt-2 border-t border-slate-200">
                <Button 
                  onClick={handleBackToList}
                  variant="outline" 
                  size="sm" 
                  className="bg-slate-50 hover:bg-slate-100 border-slate-300 text-slate-700 hover:text-slate-900 text-xs sm:text-sm shadow-sm"
                >
                  <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5" />
                  Retour à la liste
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center py-6 text-gray-500 text-sm">
              Erreur lors du chargement des données
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

