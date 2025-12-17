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
import { Loader2, ArrowLeft, Mail } from "lucide-react";
import { ViewEmailContent } from './ViewEmailContent';
import { getSentEmailById } from '@/lib/actions/notification-actions';

interface ViewEmailDialogProps {
  emailId: number;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function ViewEmailDialog({ emailId, open: controlledOpen, onOpenChange }: ViewEmailDialogProps) {
  const router = useRouter();
  const [emailData, setEmailData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;

  const handleBackToList = () => {
    setOpen(false);
    setTimeout(() => {
      router.push('/list/emails');
    }, 100);
  };

  const loadEmail = async () => {
    setLoading(true);
    try {
      const data = await getSentEmailById(emailId);
      setEmailData(data);
    } catch (error) {
      console.error("Erreur lors du chargement de l'email:", error);
      setEmailData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      loadEmail();
    } else {
      setEmailData(null);
    }
  }, [open, emailId]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-[60vw] max-h-[85vh] overflow-y-auto">
        <DialogHeader className="space-y-0">
          <DialogTitle className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-3 py-1.5 rounded-t-md -mx-6 -mt-6 text-base sm:text-lg flex items-center gap-2">
            <Mail className="h-4 w-4 sm:h-5 sm:w-5" />
            Email envoyé
          </DialogTitle>
          {emailData && (
            <DialogDescription className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-3 py-1 rounded-b-md -mx-6 mb-3 text-xs sm:text-sm">
              {emailData.subject}
            </DialogDescription>
          )}
        </DialogHeader>
        <div className="py-2">
          {loading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-orange-500" />
            </div>
          ) : emailData ? (
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
              </div>
              <ViewEmailContent email={emailData} />
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

