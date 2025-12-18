"use client";

import { useState, useEffect } from 'react';
import { Loader2, Info, Calendar, MessageSquare, CheckCircle, XCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getMessageById } from '@/lib/actions/message-actions';

interface ViewMessageDialogProps {
  messageId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ViewMessageDialog({ messageId, open, onOpenChange }: ViewMessageDialogProps) {
  const [message, setMessage] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && messageId) {
      setLoading(true);
      setError(null);
      getMessageById(messageId)
        .then((data) => {
          if (data) {
            setMessage(data);
          } else {
            setError("Message non trouvé");
          }
        })
        .catch((err) => {
          console.error("Erreur lors du chargement du message:", err);
          setError("Erreur lors du chargement du message");
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [open, messageId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader className="space-y-0">
          <DialogTitle className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-2 rounded-t-md -mx-6 -mt-6">
            Détails du message
          </DialogTitle>
          <DialogDescription className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-1.5 rounded-b-md -mx-6 mb-4">
            Informations complètes du message
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
          </div>
        )}

        {error && (
          <div className="py-4">
            <p className="text-red-600 text-center">{error}</p>
          </div>
        )}

        {!loading && !error && message && (
          <div className="space-y-4">
            <div className="space-y-1">
              <Label className="text-[9px] sm:text-[10px] font-semibold text-slate-700 uppercase tracking-wide flex items-center gap-1 sm:gap-2 bg-slate-100 px-2 py-1 rounded-t-md">
                <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4 text-orange-600" />
                Message
              </Label>
              <div className="p-2 sm:p-2.5 bg-orange-50 rounded-md rounded-tl-none border border-orange-200 border-t-0 text-xs font-medium text-slate-900 shadow-sm">
                {message.msg}
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-[9px] sm:text-[10px] font-semibold text-slate-700 uppercase tracking-wide flex items-center gap-1 sm:gap-2 bg-slate-100 px-2 py-1 rounded-t-md">
                <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-orange-600" />
                Statut
              </Label>
              <div className="p-2 sm:p-2.5 bg-orange-50 rounded-md rounded-tl-none border border-orange-200 border-t-0">
                <Badge 
                  variant={message.statut === 'ACTIF' ? 'default' : 'secondary'}
                  className={message.statut === 'ACTIF' 
                    ? 'bg-green-100 text-green-800 border-green-300' 
                    : 'bg-gray-100 text-gray-800 border-gray-300'
                  }
                >
                  {message.statut}
                </Badge>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-[9px] sm:text-[10px] font-semibold text-slate-700 uppercase tracking-wide flex items-center gap-1 sm:gap-2 bg-slate-100 px-2 py-1 rounded-t-md">
                <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-orange-600" />
                Date de début
              </Label>
              <div className="p-2 sm:p-2.5 bg-orange-50 rounded-md rounded-tl-none border border-orange-200 border-t-0 text-xs font-medium text-slate-900 font-mono shadow-sm">
                {new Intl.DateTimeFormat("fr-FR", {
                  dateStyle: "short",
                  timeStyle: "short",
                }).format(new Date(message.fromdate))}
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-[9px] sm:text-[10px] font-semibold text-slate-700 uppercase tracking-wide flex items-center gap-1 sm:gap-2 bg-slate-100 px-2 py-1 rounded-t-md">
                <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-orange-600" />
                Date de fin
              </Label>
              <div className="p-2 sm:p-2.5 bg-orange-50 rounded-md rounded-tl-none border border-orange-200 border-t-0 text-xs font-medium text-slate-900 font-mono shadow-sm">
                {new Intl.DateTimeFormat("fr-FR", {
                  dateStyle: "short",
                  timeStyle: "short",
                }).format(new Date(message.todate))}
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="bg-slate-50 hover:bg-slate-100 border-slate-300 text-slate-700 hover:text-slate-900 text-xs sm:text-sm shadow-sm"
          >
            Retour à la liste
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

