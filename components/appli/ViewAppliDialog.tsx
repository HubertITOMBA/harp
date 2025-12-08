"use client";

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Eye, Loader2, Package } from "lucide-react";
import { db } from "@/lib/db";

interface ViewAppliDialogProps {
  appli: string;
  psversion: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function ViewAppliDialog({ appli, psversion, open: controlledOpen, onOpenChange }: ViewAppliDialogProps) {
  const [appliData, setAppliData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;

  useEffect(() => {
    if (open && !appliData) {
      setLoading(true);
      fetch(`/api/appli/${encodeURIComponent(appli)}/${encodeURIComponent(psversion)}`)
        .then((res) => res.json())
        .then((data) => {
          setAppliData(data);
        })
        .catch((error) => {
          console.error("Erreur lors du chargement de l'application:", error);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [open, appli, psversion, appliData]);

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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-0">
          <DialogTitle className="bg-orange-500 text-white px-4 py-2 rounded-t-md -mx-6 -mt-6">
            Application {appli} ({psversion})
          </DialogTitle>
          {appliData && (
            <DialogDescription className="bg-orange-500 text-white px-4 py-1.5 rounded-b-md -mx-6 mb-4">
              {appliData.descr}
            </DialogDescription>
          )}
        </DialogHeader>
        <div className="py-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
            </div>
          ) : appliData ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-600">Code Application</label>
                  <p className="text-sm mt-1">{appliData.appli}</p>
                </div>
                
                <div>
                  <label className="text-xs font-semibold text-gray-600">Version Psoft</label>
                  <p className="text-sm mt-1">{appliData.psversion}</p>
                </div>

                <div className="md:col-span-2">
                  <label className="text-xs font-semibold text-gray-600">Description</label>
                  <p className="text-sm mt-1">{appliData.descr}</p>
                </div>

                {appliData.psadm_env && appliData.psadm_env.length > 0 && (
                  <div className="md:col-span-2">
                    <label className="text-xs font-semibold text-gray-600 mb-2 block">
                      Environnements associés ({appliData.psadm_env.length})
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {appliData.psadm_env.map((env: { env: string }) => (
                        <span
                          key={env.env}
                          className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-medium"
                        >
                          {env.env}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              Erreur lors du chargement des données
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

