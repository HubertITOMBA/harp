"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, Bell, CheckCircle2 } from "lucide-react";
import { ViewNotificationContent } from './ViewNotificationContent';
import { getNotificationById, markNotificationAsRead } from '@/lib/actions/notification-actions';
import { toast } from 'react-toastify';

interface ViewNotificationDialogProps {
  notificationId: number;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function ViewNotificationDialog({ notificationId, open: controlledOpen, onOpenChange }: ViewNotificationDialogProps) {
  const router = useRouter();
  const [notificationData, setNotificationData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;

  const handleBackToList = () => {
    setOpen(false);
    setTimeout(() => {
      router.push('/list/notifications');
    }, 100);
  };

  const handleMarkAsRead = async () => {
    const result = await markNotificationAsRead(notificationId);
    if (result.success) {
      toast.success(result.message);
      router.refresh();
      // Recharger les données
      if (open) {
        loadNotification();
      }
    } else {
      toast.error(result.error || "Erreur lors du marquage de la notification");
    }
  };

  const loadNotification = async () => {
    setLoading(true);
    try {
      const data = await getNotificationById(notificationId);
      setNotificationData(data);
    } catch (error) {
      console.error("Erreur lors du chargement de la notification:", error);
      setNotificationData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      loadNotification();
    } else {
      setNotificationData(null);
    }
  }, [open, notificationId]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-[60vw] max-h-[85vh] overflow-y-auto">
        <DialogHeader className="space-y-0">
          <DialogTitle className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-3 py-1.5 rounded-t-md -mx-6 -mt-6 text-base sm:text-lg flex items-center gap-2">
            <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
            Notification
          </DialogTitle>
          {notificationData && (
            <DialogDescription className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-3 py-1 rounded-b-md -mx-6 mb-3 text-xs sm:text-sm">
              {notificationData.title}
            </DialogDescription>
          )}
        </DialogHeader>
        <div className="py-2">
          {loading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-orange-500" />
            </div>
          ) : notificationData ? (
            <>
              <div className="mb-3 flex justify-between items-center pb-2 border-b border-slate-200">
                <Button 
                  onClick={handleBackToList}
                  variant="outline" 
                  size="sm" 
                  className="bg-slate-50 hover:bg-slate-100 border-slate-300 text-slate-700 hover:text-slate-900 shadow-sm text-xs sm:text-sm"
                >
                  <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5" />
                  Retour à la liste
                </Button>
                {notificationData.recipients && notificationData.recipients.some((r: any) => !r.read) && (
                  <Button 
                    onClick={handleMarkAsRead}
                    variant="outline" 
                    size="sm" 
                    className="bg-green-50 hover:bg-green-100 border-green-300 text-green-700 hover:text-green-900 shadow-sm text-xs sm:text-sm"
                  >
                    <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5" />
                    Marquer comme lue
                  </Button>
                )}
              </div>
              <ViewNotificationContent notification={notificationData} />
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

