"use client"

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Flag, FileText, Image } from "lucide-react";

interface ViewTypeStatusContentProps {
  typeStatus: {
    id: number;
    statenv: string;
    descr: string | null;
    icone: string | null;
    envsharp?: Array<{
      id: number;
      env: string;
      descr: string;
    }>;
    harpserve?: Array<{
      id: number;
      srv: string;
    }>;
    harpenvserv?: Array<{
      id: number;
    }>;
    harpenvdispo?: Array<{
      id: number;
    }>;
  };
}

export function ViewTypeStatusContent({ typeStatus }: ViewTypeStatusContentProps) {
  return (
    <div className="space-y-6">
      {/* Informations générales */}
      <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="harp-card-header">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Flag className="h-6 w-6" />
            </div>
            <CardTitle className="text-xl sm:text-2xl">Informations générales</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
            <div className="space-y-1">
              <Label className="text-[10px] font-semibold text-slate-700 bg-slate-100 px-2 py-1 rounded-t-md uppercase tracking-wide flex items-center gap-2">
                <Flag className="h-3 w-3 text-orange-600" />
                Statut
              </Label>
              <div className="p-2.5 bg-orange-50 rounded-md rounded-tl-none border border-orange-200 border-t-0 shadow-sm text-xs font-medium text-slate-900 font-mono">
                {typeStatus.statenv}
              </div>
            </div>
            {typeStatus.descr && (
              <div className="space-y-1 md:col-span-2">
                <Label className="text-[10px] font-semibold text-slate-700 bg-slate-100 px-2 py-1 rounded-t-md uppercase tracking-wide flex items-center gap-2">
                  <FileText className="h-3 w-3 text-orange-600" />
                  Description
                </Label>
                <div className="p-2.5 bg-orange-50 rounded-md rounded-tl-none border border-orange-200 border-t-0 shadow-sm text-xs font-medium text-slate-900">
                  {typeStatus.descr}
                </div>
              </div>
            )}
            {typeStatus.icone && (
              <div className="space-y-1 md:col-span-2">
                <Label className="text-[10px] font-semibold text-slate-700 bg-slate-100 px-2 py-1 rounded-t-md uppercase tracking-wide flex items-center gap-2">
                  <Image className="h-3 w-3 text-orange-600" />
                  Icône
                </Label>
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-orange-50 rounded-md rounded-tl-none border border-orange-200 border-t-0 shadow-sm text-xs font-medium text-slate-900">
                    {typeStatus.icone}
                  </div>
                  <img 
                    src={`/ressources/${typeStatus.icone}`} 
                    alt={typeStatus.statenv} 
                    width={24} 
                    height={24} 
                    className="bg-transparent"
                  />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

