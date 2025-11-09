"use client"

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Link as LinkIcon } from "lucide-react";

interface ViewLinkContentProps {
  link: {
    display: number;
    link: string;
    typlink: string;
    url: string;
    tab: string;
    logo: string;
    descr: string;
  };
}

export function ViewLinkContent({ link }: ViewLinkContentProps) {
  return (
    <div className="space-y-3">
      {/* Informations principales */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <LinkIcon className="h-5 w-5 text-orange-600" />
            Détails du lien
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 p-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-700 uppercase tracking-wide flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-t-md">
                <LinkIcon className="h-2.5 w-2.5 text-orange-600" />
                Nom du lien
              </Label>
              <p className="text-sm font-mono bg-orange-50 p-2 rounded-md rounded-tl-none border border-orange-200 border-t-0 text-slate-900 shadow-sm">{link.link}</p>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-700 uppercase tracking-wide flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-t-md">
                <LinkIcon className="h-2.5 w-2.5 text-orange-600" />
                Type de lien
              </Label>
              <p className="text-sm bg-orange-50 p-2 rounded-md rounded-tl-none border border-orange-200 border-t-0 text-slate-900 shadow-sm">{link.typlink}</p>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-700 uppercase tracking-wide flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-t-md">
                <LinkIcon className="h-2.5 w-2.5 text-orange-600" />
                Onglet
              </Label>
              <p className="text-sm bg-orange-50 p-2 rounded-md rounded-tl-none border border-orange-200 border-t-0 text-slate-900 shadow-sm">{link.tab}</p>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-700 uppercase tracking-wide flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-t-md">
                <LinkIcon className="h-2.5 w-2.5 text-orange-600" />
                Ordre d&apos;affichage
              </Label>
              <p className="text-sm bg-orange-50 p-2 rounded-md rounded-tl-none border border-orange-200 border-t-0 text-slate-900 shadow-sm">{link.display}</p>
            </div>
            <div className="space-y-1 md:col-span-2">
              <Label className="text-xs font-semibold text-slate-700 uppercase tracking-wide flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-t-md">
                <LinkIcon className="h-2.5 w-2.5 text-orange-600" />
                URL
              </Label>
              <p className="text-sm bg-orange-50 p-2 rounded-md rounded-tl-none border border-orange-200 border-t-0 text-slate-900 break-all shadow-sm">
                <a 
                  href={link.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {link.url}
                </a>
              </p>
            </div>
            {link.logo && (
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700 uppercase tracking-wide flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-t-md">
                  <LinkIcon className="h-2.5 w-2.5 text-orange-600" />
                  Logo
                </Label>
                <p className="text-sm bg-orange-50 p-2 rounded-md rounded-tl-none border border-orange-200 border-t-0 text-slate-900 shadow-sm">{link.logo}</p>
              </div>
            )}
            {link.descr && (
              <div className="space-y-1 md:col-span-2">
                <Label className="text-xs font-semibold text-slate-700 uppercase tracking-wide flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-t-md">
                  <LinkIcon className="h-2.5 w-2.5 text-orange-600" />
                  Description
                </Label>
                <p className="text-sm bg-orange-50 p-2 rounded-md rounded-tl-none border border-orange-200 border-t-0 text-slate-900 shadow-sm">{link.descr}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

