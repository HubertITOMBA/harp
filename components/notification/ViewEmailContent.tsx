"use client";

import { Label } from "@/components/ui/label";
import { Mail, User, Shield, Calendar, FileText, CheckCircle2, XCircle } from "lucide-react";

interface ViewEmailContentProps {
  email: {
    id: number;
    subject: string;
    message: string;
    sentAt: Date;
    sender: {
      id: number;
      name: string | null;
      email: string | null;
      netid: string | null;
    };
    recipients: Array<{
      id: number;
      recipientType: string;
      recipientId: number;
      email: string;
      name: string | null;
      sent: boolean;
      sentAt: Date | null;
      error: string | null;
    }>;
  };
}

export function ViewEmailContent({ email }: ViewEmailContentProps) {
  const userRecipients = email.recipients.filter(r => r.recipientType === "USER");
  const roleRecipients = email.recipients.filter(r => r.recipientType === "ROLE");
  const sentRecipients = email.recipients.filter(r => r.sent);
  const failedRecipients = email.recipients.filter(r => !r.sent);

  return (
    <div className="space-y-4">
      {/* Sujet */}
      <div className="space-y-1">
        <Label className="text-[9px] sm:text-[10px] font-semibold text-slate-700 uppercase tracking-wide flex items-center gap-1 sm:gap-2 bg-slate-100 px-2 py-1 rounded-t-md">
          <Mail className="h-3 w-3 sm:h-4 sm:w-4 text-orange-600" />
          Sujet
        </Label>
        <div className="p-2 sm:p-2.5 bg-orange-50 rounded-md rounded-tl-none border border-orange-200 border-t-0 text-xs font-medium text-slate-900 shadow-sm">
          {email.subject}
        </div>
      </div>

      {/* Message */}
      <div className="space-y-1">
        <Label className="text-[9px] sm:text-[10px] font-semibold text-slate-700 uppercase tracking-wide flex items-center gap-1 sm:gap-2 bg-slate-100 px-2 py-1 rounded-t-md">
          <FileText className="h-3 w-3 sm:h-4 sm:w-4 text-orange-600" />
          Message
        </Label>
        <div className="p-2 sm:p-2.5 bg-orange-50 rounded-md rounded-tl-none border border-orange-200 border-t-0 text-xs font-medium text-slate-900 whitespace-pre-wrap shadow-sm">
          {email.message}
        </div>
      </div>

      {/* Expéditeur */}
      <div className="space-y-1">
        <Label className="text-[9px] sm:text-[10px] font-semibold text-slate-700 uppercase tracking-wide flex items-center gap-1 sm:gap-2 bg-slate-100 px-2 py-1 rounded-t-md">
          <User className="h-3 w-3 sm:h-4 sm:w-4 text-orange-600" />
          Envoyé par
        </Label>
        <div className="p-2 sm:p-2.5 bg-orange-50 rounded-md rounded-tl-none border border-orange-200 border-t-0 text-xs font-medium text-slate-900 shadow-sm">
          {email.sender.name || email.sender.netid || email.sender.email || "Inconnu"}
          {email.sender.email && (
            <span className="text-gray-600 ml-2">({email.sender.email})</span>
          )}
        </div>
      </div>

      {/* Date d'envoi */}
      <div className="space-y-1">
        <Label className="text-[9px] sm:text-[10px] font-semibold text-slate-700 uppercase tracking-wide flex items-center gap-1 sm:gap-2 bg-slate-100 px-2 py-1 rounded-t-md">
          <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-orange-600" />
          Date d'envoi
        </Label>
        <div className="p-2 sm:p-2.5 bg-orange-50 rounded-md rounded-tl-none border border-orange-200 border-t-0 text-xs font-medium text-slate-900 shadow-sm">
          {new Intl.DateTimeFormat("fr-FR", {
            dateStyle: "full",
            timeStyle: "medium",
          }).format(new Date(email.sentAt))}
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
                  {recipient.sent ? (
                    <CheckCircle2 className="h-3 w-3 text-green-600" />
                  ) : (
                    <XCircle className="h-3 w-3 text-red-600" />
                  )}
                  <span>{recipient.name || recipient.email}</span>
                  {recipient.sent && recipient.sentAt && (
                    <span className="text-gray-600 text-xs">
                      (envoyé le {new Intl.DateTimeFormat("fr-FR", {
                        dateStyle: "short",
                        timeStyle: "short",
                      }).format(new Date(recipient.sentAt))})
                    </span>
                  )}
                  {!recipient.sent && recipient.error && (
                    <span className="text-red-600 text-xs">
                      (erreur: {recipient.error})
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
                  {recipient.sent ? (
                    <CheckCircle2 className="h-3 w-3 text-green-600" />
                  ) : (
                    <XCircle className="h-3 w-3 text-red-600" />
                  )}
                  <span>{recipient.name || recipient.email}</span>
                  {recipient.sent && recipient.sentAt && (
                    <span className="text-gray-600 text-xs">
                      (envoyé le {new Intl.DateTimeFormat("fr-FR", {
                        dateStyle: "short",
                        timeStyle: "short",
                      }).format(new Date(recipient.sentAt))})
                    </span>
                  )}
                  {!recipient.sent && recipient.error && (
                    <span className="text-red-600 text-xs">
                      (erreur: {recipient.error})
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Résumé */}
      <div className="space-y-1">
        <Label className="text-[9px] sm:text-[10px] font-semibold text-slate-700 uppercase tracking-wide flex items-center gap-1 sm:gap-2 bg-slate-100 px-2 py-1 rounded-t-md">
          <Mail className="h-3 w-3 sm:h-4 sm:w-4 text-orange-600" />
          Résumé
        </Label>
        <div className="p-2 sm:p-2.5 bg-orange-50 rounded-md rounded-tl-none border border-orange-200 border-t-0 text-xs font-medium text-slate-900 shadow-sm">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-3 w-3 text-green-600" />
              <span>{sentRecipients.length} email{sentRecipients.length > 1 ? 's' : ''} envoyé{sentRecipients.length > 1 ? 's' : ''} avec succès</span>
            </div>
            {failedRecipients.length > 0 && (
              <div className="flex items-center gap-2">
                <XCircle className="h-3 w-3 text-red-600" />
                <span>{failedRecipients.length} email{failedRecipients.length > 1 ? 's' : ''} n'{failedRecipients.length > 1 ? 'ont' : 'a'} pas pu être envoyé{failedRecipients.length > 1 ? 's' : ''}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

