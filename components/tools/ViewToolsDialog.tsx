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
import { ViewToolsContent } from './ViewToolsContent';
import { getToolsById } from '@/lib/actions/tools-actions';

interface ViewToolsDialogProps {
  tool: string;
  toolName: string;
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

interface ToolsData {
  tool: string;
  cmd: string;
  descr: string;
  tooltype: string;
  cmdarg: string;
  page: string;
  mode: string;
  output: string;
}

export function ViewToolsDialog({ tool, toolName, children, open: controlledOpen, onOpenChange }: ViewToolsDialogProps) {
  const router = useRouter();
  const [toolsData, setToolsData] = useState<ToolsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;

  const handleBackToList = () => {
    setOpen(false);
    setTimeout(() => {
      router.push('/list/tools');
    }, 100);
  };

  useEffect(() => {
    if (open) {
      setLoading(true);
      getToolsById(tool)
        .then((data) => {
          setToolsData(data as ToolsData | null);
        })
        .catch((error) => {
          console.error("Erreur lors du chargement de l'outil:", error);
          setToolsData(null);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setToolsData(null);
    }
  }, [open, tool]);

  // Si open/onOpenChange sont fournis, ne pas afficher de trigger (contrôlé depuis l'extérieur)
  if (controlledOpen !== undefined || onOpenChange) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[60vw] max-h-[85vh] overflow-y-auto">
          <DialogHeader className="space-y-0">
            <DialogTitle className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-3 py-1.5 rounded-t-md -mx-6 -mt-6 text-base sm:text-lg">
              Outil {toolName.toUpperCase()}
            </DialogTitle>
            {toolsData && (
              <DialogDescription className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-3 py-1 rounded-b-md -mx-6 mb-3 text-xs sm:text-sm">
                {toolsData.descr}
              </DialogDescription>
            )}
          </DialogHeader>
          <div className="py-2">
            {loading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-orange-500" />
              </div>
            ) : toolsData ? (
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
                <ViewToolsContent tool={toolsData} />
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

  // Sinon, afficher avec trigger (mode non-contrôlé)
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {children ? (
        <DialogTrigger asChild onClick={() => setOpen(true)}>
          {children}
        </DialogTrigger>
      ) : (
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
      )}
      <DialogContent className="max-w-[60vw] max-h-[85vh] overflow-y-auto">
        <DialogHeader className="space-y-0">
          <DialogTitle className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-3 py-1.5 rounded-t-md -mx-6 -mt-6 text-base sm:text-lg">
            Outil {toolName.toUpperCase()}
          </DialogTitle>
          {toolsData && (
            <DialogDescription className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-3 py-1 rounded-b-md -mx-6 mb-3 text-xs sm:text-sm">
              {toolsData.descr}
            </DialogDescription>
          )}
        </DialogHeader>
        <div className="py-2">
          {loading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-orange-500" />
            </div>
          ) : toolsData ? (
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
              <ViewToolsContent tool={toolsData} />
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

