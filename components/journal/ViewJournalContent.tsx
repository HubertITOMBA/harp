"use client"

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { FileText } from "lucide-react";

interface ViewJournalContentProps {
  journal: {
    num: number;
    netid: string | null;
    event: string | null;
    log: string;
    datmaj: Date;
  };
}

export function ViewJournalContent({ journal }: ViewJournalContentProps) {
  const date = new Date(journal.datmaj);
  const formattedDate = Intl.DateTimeFormat("fr-FR", {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date);

  return (
    <div className="space-y-3">
      {/* Informations principales */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5 text-orange-600" />
            Détails du log #{journal.num}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 p-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-700 uppercase tracking-wide flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-t-md">
                <FileText className="h-2.5 w-2.5 text-orange-600" />
                Numéro
              </Label>
              <p className="text-sm font-mono bg-orange-50 p-2 rounded-md rounded-tl-none border border-orange-200 border-t-0 text-slate-900 shadow-sm">{journal.num}</p>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-700 uppercase tracking-wide flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-t-md">
                <FileText className="h-2.5 w-2.5 text-orange-600" />
                NetID
              </Label>
              <p className="text-sm bg-orange-50 p-2 rounded-md rounded-tl-none border border-orange-200 border-t-0 text-slate-900 shadow-sm">{journal.netid || 'N/A'}</p>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-700 uppercase tracking-wide flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-t-md">
                <FileText className="h-2.5 w-2.5 text-orange-600" />
                Événement
              </Label>
              <p className="text-sm bg-orange-50 p-2 rounded-md rounded-tl-none border border-orange-200 border-t-0 text-slate-900 shadow-sm">{journal.event || 'N/A'}</p>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-700 uppercase tracking-wide flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-t-md">
                <FileText className="h-2.5 w-2.5 text-orange-600" />
                Date de modification
              </Label>
              <p className="text-sm bg-orange-50 p-2 rounded-md rounded-tl-none border border-orange-200 border-t-0 text-slate-900 shadow-sm">{formattedDate}</p>
            </div>
          </div>
          <div className="space-y-1 md:col-span-2">
            <Label className="text-xs font-semibold text-slate-700 uppercase tracking-wide flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-t-md">
              <FileText className="h-2.5 w-2.5 text-orange-600" />
              Log
            </Label>
            <p className="text-sm bg-orange-50 p-2 rounded-md rounded-tl-none border border-orange-200 border-t-0 text-slate-900 whitespace-pre-wrap break-words shadow-sm">{journal.log}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

