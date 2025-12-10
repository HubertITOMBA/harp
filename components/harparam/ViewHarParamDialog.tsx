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
import { ViewHarParamContent } from './ViewHarParamContent';
import { getHarParamById } from '@/lib/actions/harparam-actions';

interface ViewHarParamDialogProps {
  param: string;
  paramName: string;
}

interface HarParamData {
  param: string;
  valeur: string;
  descr: string;
}

export function ViewHarParamDialog({ param, paramName }: ViewHarParamDialogProps) {
  const router = useRouter();
  const [harParamData, setHarParamData] = useState<HarParamData | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const handleBackToList = () => {
    setOpen(false);
    setTimeout(() => {
      router.push('/list/harparam');
    }, 100);
  };

  useEffect(() => {
    if (open) {
      setLoading(true);
      getHarParamById(param)
        .then((data) => {
          setHarParamData(data as HarParamData | null);
        })
        .catch((error) => {
          console.error("Erreur lors du chargement du paramètre:", error);
          setHarParamData(null);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setHarParamData(null);
    }
  }, [open, param]);

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
            Paramètre {paramName.toUpperCase()}
          </DialogTitle>
          {harParamData && (
            <DialogDescription className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-3 py-1 rounded-b-md -mx-6 mb-3 text-xs sm:text-sm">
              {harParamData.descr}
            </DialogDescription>
          )}
        </DialogHeader>
        <div className="py-2">
          {loading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-orange-500" />
            </div>
          ) : harParamData ? (
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
              <ViewHarParamContent harParam={harParamData} />
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

