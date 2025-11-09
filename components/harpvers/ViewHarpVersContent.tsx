"use client"

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Package, FileText } from "lucide-react";

interface ViewHarpVersContentProps {
  harpVers: {
    harprelease: string;
    descr: string;
    psadm_env?: Array<{
      env: string;
      descr: string;
      site: string;
    }>;
  };
}

export function ViewHarpVersContent({ harpVers }: ViewHarpVersContentProps) {
  return (
    <div className="space-y-6">
      {/* Informations générales */}
      <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="harp-card-header">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Package className="h-6 w-6" />
            </div>
            <CardTitle className="text-xl sm:text-2xl">Informations générales</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
            <div className="space-y-1">
              <Label className="text-[10px] font-semibold text-slate-700 bg-slate-100 px-2 py-1 rounded-t-md uppercase tracking-wide flex items-center gap-2">
                <Package className="h-3 w-3 text-orange-600" />
                Release
              </Label>
              <div className="p-2.5 bg-orange-50 rounded-md rounded-tl-none border border-orange-200 border-t-0 shadow-sm text-xs font-medium text-slate-900 font-mono">
                {harpVers.harprelease}
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-semibold text-slate-700 bg-slate-100 px-2 py-1 rounded-t-md uppercase tracking-wide flex items-center gap-2">
                <FileText className="h-3 w-3 text-orange-600" />
                Description
              </Label>
              <div className="p-2.5 bg-orange-50 rounded-md rounded-tl-none border border-orange-200 border-t-0 shadow-sm text-xs font-medium text-slate-900">
                {harpVers.descr}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

