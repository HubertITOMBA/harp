"use client";

import { Label } from "@/components/ui/label";
import { Bell, User, Shield, Calendar, Mail, FileText, CheckCircle2, XCircle } from "lucide-react";

interface ViewNotificationContentProps {
  notification: {
    id: number;
    title: string;
    message: string;
    createdAt: Date;
    creator: {
      id: number;
      name: string | null;
      email: string | null;
      netid: string | null;
    };
    recipients: Array<{
      id: number;
      recipientType: string;
      recipientId: number;
      read: boolean;
      readAt: Date | null;
    }>;
  };
}

export function ViewNotificationContent({ notification }: ViewNotificationContentProps) {
  const userRecipients = notification.recipients.filter(r => r.recipientType === "USER");
  const roleRecipients = notification.recipients.filter(r => r.recipientType === "ROLE");

  return (
    <div className="space-y-4">
      {/* Titre */}
      <div className="space-y-1">
        <Label className="text-[9px] sm:text-[10px] font-semibold text-slate-700 uppercase tracking-wide flex items-center gap-1 sm:gap-2 bg-slate-100 px-2 py-1 rounded-t-md">
          <Bell className="h-3 w-3 sm:h-4 sm:w-4 text-orange-600" />
          Titre
        </Label>
        <div className="p-2 sm:p-2.5 bg-orange-50 rounded-md rounded-tl-none border border-orange-200 border-t-0 text-xs font-medium text-slate-900 shadow-sm">
          {notification.title}
        </div>
      </div>

      {/* Message */}
      <div className="space-y-1">
        <Label className="text-[9px] sm:text-[10px] font-semibold text-slate-700 uppercase tracking-wide flex items-center gap-1 sm:gap-2 bg-slate-100 px-2 py-1 rounded-t-md">
          <FileText className="h-3 w-3 sm:h-4 sm:w-4 text-orange-600" />
          Message
        </Label>
        <div className="p-2 sm:p-2.5 bg-orange-50 rounded-md rounded-tl-none border border-orange-200 border-t-0 text-xs font-medium text-slate-900 whitespace-pre-wrap shadow-sm">
          {notification.message}
        </div>
      </div>

      {/* Créateur */}
      <div className="space-y-1">
        <Label className="text-[9px] sm:text-[10px] font-semibold text-slate-700 uppercase tracking-wide flex items-center gap-1 sm:gap-2 bg-slate-100 px-2 py-1 rounded-t-md">
          <User className="h-3 w-3 sm:h-4 sm:w-4 text-orange-600" />
          Créé par
        </Label>
        <div className="p-2 sm:p-2.5 bg-orange-50 rounded-md rounded-tl-none border border-orange-200 border-t-0 text-xs font-medium text-slate-900 shadow-sm">
          {notification.creator.name || notification.creator.netid || notification.creator.email || "Inconnu"}
          {notification.creator.email && (
            <span className="text-gray-600 ml-2">({notification.creator.email})</span>
          )}
        </div>
      </div>

      {/* Date de création */}
      <div className="space-y-1">
        <Label className="text-[9px] sm:text-[10px] font-semibold text-slate-700 uppercase tracking-wide flex items-center gap-1 sm:gap-2 bg-slate-100 px-2 py-1 rounded-t-md">
          <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-orange-600" />
          Date de création
        </Label>
        <div className="p-2 sm:p-2.5 bg-orange-50 rounded-md rounded-tl-none border border-orange-200 border-t-0 text-xs font-medium text-slate-900 shadow-sm">
          {new Intl.DateTimeFormat("fr-FR", {
            dateStyle: "full",
            timeStyle: "medium",
          }).format(new Date(notification.createdAt))}
        </div>
      </div>

      {/* Destinataires - Utilisateurs */}
      {userRecipients.length > 0 && (
        <div className="space-y-1">
          <Label className="text-[9px] sm:text-[10px] font-semibold text-slate-700 uppercase tracking-wide flex items-center gap-1 sm:gap-2 bg-slate-100 px-2 py-1 rounded-t-md">
            <User className="h-3 w-3 sm:h-4 sm:w-4 text-orange-600" />
            Destinataires - Utilisateurs ({userRecipients.length})
          </Label>
          <div className="p-2 sm:p-2.5 bg-orange-50 rounded-md rounded-tl-none border border-orange-200 border-t-0 text-xs font-medium text-slate-900 shadow-sm">
            <div className="space-y-1">
              {userRecipients.map((recipient) => (
                <div key={recipient.id} className="flex items-center gap-2">
                  {recipient.read ? (
                    <CheckCircle2 className="h-3 w-3 text-green-600" />
                  ) : (
                    <XCircle className="h-3 w-3 text-gray-400" />
                  )}
                  <span>Utilisateur ID: {recipient.recipientId}</span>
                  {recipient.read && recipient.readAt && (
                    <span className="text-gray-600 text-xs">
                      (lu le {new Intl.DateTimeFormat("fr-FR", {
                        dateStyle: "full",
                        timeStyle: "medium",
                      }).format(new Date(recipient.readAt))})
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Destinataires - Rôles */}
      {roleRecipients.length > 0 && (
        <div className="space-y-1">
          <Label className="text-[9px] sm:text-[10px] font-semibold text-slate-700 uppercase tracking-wide flex items-center gap-1 sm:gap-2 bg-slate-100 px-2 py-1 rounded-t-md">
            <Shield className="h-3 w-3 sm:h-4 sm:w-4 text-orange-600" />
            Destinataires - Rôles ({roleRecipients.length})
          </Label>
          <div className="p-2 sm:p-2.5 bg-orange-50 rounded-md rounded-tl-none border border-orange-200 border-t-0 text-xs font-medium text-slate-900 shadow-sm">
            <div className="space-y-1">
              {roleRecipients.map((recipient) => (
                <div key={recipient.id} className="flex items-center gap-2">
                  {recipient.read ? (
                    <CheckCircle2 className="h-3 w-3 text-green-600" />
                  ) : (
                    <XCircle className="h-3 w-3 text-gray-400" />
                  )}
                  <span>Rôle ID: {recipient.recipientId}</span>
                  {recipient.read && recipient.readAt && (
                    <span className="text-gray-600 text-xs">
                      (lu le {new Intl.DateTimeFormat("fr-FR", {
                        dateStyle: "full",
                        timeStyle: "medium",
                      }).format(new Date(recipient.readAt))})
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

