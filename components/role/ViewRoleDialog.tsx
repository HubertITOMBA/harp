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
import { ViewRoleContent } from './ViewRoleContent';
import { getHarpRoleByIdWithUsers } from '@/lib/actions/harprole-actions';

interface ViewRoleDialogProps {
  roleId: number;
  roleName: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

interface RoleData {
  id: number;
  role: string;
  descr: string;
  slug: string | null;
  harpuseroles: Array<{
    user: {
      id: number;
      netid: string | null;
      nom: string | null;
      prenom: string | null;
      email: string | null;
    };
  }>;
}

export function ViewRoleDialog({ roleId, roleName, open: controlledOpen, onOpenChange }: ViewRoleDialogProps) {
  const router = useRouter();
  const [roleData, setRoleData] = useState<RoleData | null>(null);
  const [loading, setLoading] = useState(false);
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;

  const handleBackToList = () => {
    setOpen(false);
    // Petit délai pour permettre au dialog de se fermer avant la navigation
    setTimeout(() => {
      router.push('/list/roles');
    }, 100);
  };

  useEffect(() => {
    if (open) {
      setLoading(true);
      getHarpRoleByIdWithUsers(roleId)
        .then((data) => {
          setRoleData(data as RoleData | null);
        })
        .catch((error) => {
          console.error("Erreur lors du chargement du rôle:", error);
          setRoleData(null);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      // Réinitialiser les données quand le dialog se ferme
      setRoleData(null);
    }
  }, [open, roleId]);

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
            Rôle {roleName.toUpperCase()}
          </DialogTitle>
          {roleData && (
            <DialogDescription className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-3 py-1 rounded-b-md -mx-6 mb-3 text-xs sm:text-sm">
              {roleData.descr}
            </DialogDescription>
          )}
        </DialogHeader>
        <div className="py-2">
          {loading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-orange-500" />
            </div>
          ) : roleData ? (
            <>
              {/* Bouton retour en haut */}
              <div className="mb-3 flex justify-start pb-2 border-b border-slate-200">
                <Button 
                  onClick={handleBackToList}
                  variant="outline" 
                  size="sm" 
                  className="bg-slate-50 hover:bg-slate-100 border-slate-300 text-slate-700 hover:text-slate-900 shadow-sm text-xs sm:text-sm"
                >
                  <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5" />
                  Retour à la liste
                </Button>
              </div>
              <ViewRoleContent role={roleData} />
              <div className="mt-3 flex justify-start pt-2 border-t border-slate-200">
                <Button 
                  onClick={handleBackToList}
                  variant="outline" 
                  size="sm" 
                  className="bg-slate-50 hover:bg-slate-100 border-slate-300 text-slate-700 hover:text-slate-900 shadow-sm text-xs sm:text-sm"
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

