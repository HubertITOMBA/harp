"use client"

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Settings } from "lucide-react";

interface ViewHarParamContentProps {
  harParam: {
    param: string;
    valeur: string;
    descr: string;
  };
}

export function ViewHarParamContent({ harParam }: ViewHarParamContentProps) {
  return (
    <div className="space-y-6">
      {/* Informations générales */}
      <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="harp-card-header">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Settings className="h-6 w-6" />
            </div>
            <CardTitle className="text-xl sm:text-2xl">Informations générales</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
            <div className="space-y-1">
              <Label className="text-[10px] font-semibold text-slate-700 uppercase tracking-wide flex items-center gap-2 bg-slate-100 px-2 py-1 rounded-t-md">
                <Settings className="h-3 w-3 text-orange-600" />
                Paramètre
              </Label>
              <div className="p-2.5 bg-orange-50 rounded-md rounded-tl-none border border-orange-200 border-t-0 text-xs font-medium text-slate-900 font-mono shadow-sm">
                {harParam.param}
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-semibold text-slate-700 uppercase tracking-wide flex items-center gap-2 bg-slate-100 px-2 py-1 rounded-t-md">
                <Settings className="h-3 w-3 text-orange-600" />
                Valeur
              </Label>
              <div className="p-2.5 bg-orange-50 rounded-md rounded-tl-none border border-orange-200 border-t-0 text-xs font-medium text-slate-900 font-mono shadow-sm">
                {harParam.valeur}
              </div>
            </div>
            <div className="space-y-1 md:col-span-2">
              <Label className="text-[10px] font-semibold text-slate-700 uppercase tracking-wide flex items-center gap-2 bg-slate-100 px-2 py-1 rounded-t-md">
                <Settings className="h-3 w-3 text-orange-600" />
                Description
              </Label>
              <div className="p-2.5 bg-orange-50 rounded-md rounded-tl-none border border-orange-200 border-t-0 text-xs font-medium text-slate-900 shadow-sm">
                {harParam.descr}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

