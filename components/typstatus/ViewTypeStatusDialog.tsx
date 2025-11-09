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
import { Eye, Loader2 } from "lucide-react";
import { ViewTypeStatusContent } from './ViewTypeStatusContent';
import { getTypeStatusById } from '@/lib/actions/typstatus-actions';

interface ViewTypeStatusDialogProps {
  statusId: number;
  statusName: string;
}

export function ViewTypeStatusDialog({ statusId, statusName }: ViewTypeStatusDialogProps) {
  const [statusData, setStatusData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open && !statusData) {
      setLoading(true);
      getTypeStatusById(statusId)
        .then((data) => {
          setStatusData(data);
        })
        .catch((error) => {
          console.error("Erreur lors du chargement du statut:", error);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [open, statusId, statusData]);

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
      <DialogContent className="max-w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-0">
          <DialogTitle className="bg-orange-500 text-white px-4 py-2 rounded-t-md -mx-6 -mt-6">
            Statut {statusName.toUpperCase()}
          </DialogTitle>
          {statusData && statusData.descr && (
            <DialogDescription className="bg-orange-500 text-white px-4 py-1.5 rounded-b-md -mx-6 mb-4">
              {statusData.descr}
            </DialogDescription>
          )}
        </DialogHeader>
        <div className="py-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
            </div>
          ) : statusData ? (
            <ViewTypeStatusContent typeStatus={statusData} />
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

