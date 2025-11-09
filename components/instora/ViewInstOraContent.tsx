"use client"

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Database } from "lucide-react";

interface ViewInstOraContentProps {
  instora: {
    id: number;
    oracle_sid: string;
    descr: string | null;
    serverId: number | null;
    typebaseId: number | null;
    harpserve: {
      id: number;
      srv: string;
      ip: string;
      pshome: string;
      os: string;
      psuser: string | null;
      domain: string | null;
      typsrv: string | null;
      statenvId: number | null;
      statutenv: {
        id: number;
        statenv: string;
        descr: string | null;
        icone: string | null;
      } | null;
    } | null;
    harptypebase: {
      id: number;
      type_base: string;
      descr: string | null;
      icone: string | null;
    } | null;
    envsharp: Array<{
      id: number;
      env: string;
      anonym: string | null;
      edi: string | null;
      url: string | null;
      statutenv: {
        id: number;
        statenv: string;
        descr: string | null;
        icone: string | null;
      } | null;
    }>;
  };
}

export function ViewInstOraContent({ instora }: ViewInstOraContentProps) {
  return (
    <div className="space-y-3">
      {/* Informations principales */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Database className="h-5 w-5 text-orange-600" />
            Informations de l&apos;instance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 p-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-700 uppercase tracking-wide flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-t-md">
                <Database className="h-2.5 w-2.5 text-orange-600" />
                Oracle SID
              </Label>
              <p className="text-sm font-mono bg-orange-50 p-2 rounded-md rounded-tl-none border border-orange-200 border-t-0 text-slate-900 shadow-sm">{instora.oracle_sid}</p>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-700 uppercase tracking-wide flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-t-md">
                <Database className="h-2.5 w-2.5 text-orange-600" />
                Description
              </Label>
              <p className="text-sm bg-orange-50 p-2 rounded-md rounded-tl-none border border-orange-200 border-t-0 text-slate-900 shadow-sm">{instora.descr || 'N/A'}</p>
            </div>
            {instora.harptypebase && (
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700 uppercase tracking-wide flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-t-md">
                  <Database className="h-2.5 w-2.5 text-orange-600" />
                  Type de base
                </Label>
                <p className="text-sm bg-orange-50 p-2 rounded-md rounded-tl-none border border-orange-200 border-t-0 text-slate-900 shadow-sm">{instora.harptypebase.type_base}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Informations du serveur */}
      {instora.harpserve && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Database className="h-5 w-5 text-orange-600" />
              Serveur associé
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 p-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700 uppercase tracking-wide flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-t-md">
                  <Database className="h-2.5 w-2.5 text-orange-600" />
                  Nom du serveur
                </Label>
                <p className="text-sm bg-orange-50 p-2 rounded-md rounded-tl-none border border-orange-200 border-t-0 text-slate-900 shadow-sm">{instora.harpserve.srv}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700 uppercase tracking-wide flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-t-md">
                  <Database className="h-2.5 w-2.5 text-orange-600" />
                  Adresse IP
                </Label>
                <p className="text-sm font-mono bg-orange-50 p-2 rounded-md rounded-tl-none border border-orange-200 border-t-0 text-slate-900 shadow-sm">{instora.harpserve.ip}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700 uppercase tracking-wide flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-t-md">
                  <Database className="h-2.5 w-2.5 text-orange-600" />
                  PS Home
                </Label>
                <p className="text-sm bg-orange-50 p-2 rounded-md rounded-tl-none border border-orange-200 border-t-0 text-slate-900 shadow-sm">{instora.harpserve.pshome}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700 uppercase tracking-wide flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-t-md">
                  <Database className="h-2.5 w-2.5 text-orange-600" />
                  Système d&apos;exploitation
                </Label>
                <p className="text-sm bg-orange-50 p-2 rounded-md rounded-tl-none border border-orange-200 border-t-0 text-slate-900 shadow-sm">{instora.harpserve.os}</p>
              </div>
              {instora.harpserve.psuser && (
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700 uppercase tracking-wide flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-t-md">
                    <Database className="h-2.5 w-2.5 text-orange-600" />
                    Utilisateur PS
                  </Label>
                  <p className="text-sm bg-orange-50 p-2 rounded-md rounded-tl-none border border-orange-200 border-t-0 text-slate-900 shadow-sm">{instora.harpserve.psuser}</p>
                </div>
              )}
              {instora.harpserve.domain && (
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700 uppercase tracking-wide flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-t-md">
                    <Database className="h-2.5 w-2.5 text-orange-600" />
                    Domaine
                  </Label>
                  <p className="text-sm bg-orange-50 p-2 rounded-md rounded-tl-none border border-orange-200 border-t-0 text-slate-900 shadow-sm">{instora.harpserve.domain}</p>
                </div>
              )}
              {instora.harpserve.statenv && (
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700 uppercase tracking-wide flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-t-md">
                    <Database className="h-2.5 w-2.5 text-orange-600" />
                    Statut
                  </Label>
                  <p className="text-sm bg-orange-50 p-2 rounded-md rounded-tl-none border border-orange-200 border-t-0 text-slate-900 shadow-sm">{instora.harpserve.statenv.statenv}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Environnements associés */}
      {instora.envsharp && instora.envsharp.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Database className="h-5 w-5 text-orange-600" />
              Environnements associés
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3">
            <div className="space-y-2">
              {instora.envsharp.map((env) => (
                <div key={env.id} className="bg-orange-50 p-2 rounded-md border border-orange-200 text-slate-900 shadow-sm">
                  <p className="text-sm font-semibold">{env.env}</p>
                  {env.url && (
                    <p className="text-xs text-gray-600">URL: {env.url}</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

