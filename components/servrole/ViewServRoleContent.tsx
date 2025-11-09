"use client"

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Server } from "lucide-react";

interface ViewServRoleContentProps {
  servRole: {
    srv: string;
    env: string;
    typsrv: string;
    status: number | null;
    psadm_srv?: {
      srv: string;
      ip: string;
      pshome: string;
      os: string;
      psuser: string | null;
      domain: string | null;
    };
    psadm_env?: {
      env: string;
      descr: string;
      site: string;
    };
    psadm_typsrv?: {
      typsrv: string;
      descr: string;
    };
  };
}

export function ViewServRoleContent({ servRole }: ViewServRoleContentProps) {
  return (
    <div className="space-y-6">
      {/* Informations générales */}
      <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="harp-card-header">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Server className="h-6 w-6" />
            </div>
            <CardTitle className="text-xl sm:text-2xl">Informations générales</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
            <div className="space-y-1">
              <Label className="text-[10px] font-semibold text-slate-700 bg-slate-100 px-2 py-1 rounded-t-md uppercase tracking-wide flex items-center gap-2">
                <Server className="h-3 w-3 text-orange-600" />
                Serveur
              </Label>
              <div className="p-2.5 bg-orange-50 rounded-md rounded-tl-none border border-orange-200 border-t-0 shadow-sm text-xs font-medium text-slate-900 font-mono">
                {servRole.srv}
              </div>
              {servRole.psadm_srv && (
                <div className="text-xs text-gray-600 mt-1">
                  IP: {servRole.psadm_srv.ip} | OS: {servRole.psadm_srv.os}
                </div>
              )}
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-semibold text-slate-700 bg-slate-100 px-2 py-1 rounded-t-md uppercase tracking-wide flex items-center gap-2">
                <Server className="h-3 w-3 text-orange-600" />
                Environnement
              </Label>
              <div className="p-2.5 bg-orange-50 rounded-md rounded-tl-none border border-orange-200 border-t-0 shadow-sm text-xs font-medium text-slate-900 font-mono">
                {servRole.env}
              </div>
              {servRole.psadm_env && (
                <div className="text-xs text-gray-600 mt-1">
                  {servRole.psadm_env.descr} ({servRole.psadm_env.site})
                </div>
              )}
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-semibold text-slate-700 bg-slate-100 px-2 py-1 rounded-t-md uppercase tracking-wide flex items-center gap-2">
                <Server className="h-3 w-3 text-orange-600" />
                Type de serveur
              </Label>
              <div className="p-2.5 bg-orange-50 rounded-md rounded-tl-none border border-orange-200 border-t-0 shadow-sm text-xs font-medium text-slate-900 font-mono">
                {servRole.typsrv}
              </div>
              {servRole.psadm_typsrv && (
                <div className="text-xs text-gray-600 mt-1">
                  {servRole.psadm_typsrv.descr}
                </div>
              )}
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-semibold text-slate-700 bg-slate-100 px-2 py-1 rounded-t-md uppercase tracking-wide flex items-center gap-2">
                <Server className="h-3 w-3 text-orange-600" />
                Statut
              </Label>
              <div className="p-2.5 bg-orange-50 rounded-md rounded-tl-none border border-orange-200 border-t-0 shadow-sm text-xs font-medium text-slate-900">
                {servRole.status === 1 ? 'Actif' : servRole.status === 0 ? 'Inactif' : 'Non défini'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Détails du serveur */}
      {servRole.psadm_srv && (
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="harp-card-header">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Server className="h-6 w-6" />
              </div>
              <CardTitle className="text-xl sm:text-2xl">Détails du serveur</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
              <div className="space-y-1">
                <Label className="text-[10px] font-semibold text-slate-700 bg-slate-100 px-2 py-1 rounded-t-md uppercase tracking-wide">
                  IP
                </Label>
                <div className="p-2.5 bg-orange-50 rounded-md rounded-tl-none border border-orange-200 border-t-0 shadow-sm text-xs font-medium text-slate-900 font-mono">
                  {servRole.psadm_srv.ip}
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-semibold text-slate-700 bg-slate-100 px-2 py-1 rounded-t-md uppercase tracking-wide">
                  PS Home
                </Label>
                <div className="p-2.5 bg-orange-50 rounded-md rounded-tl-none border border-orange-200 border-t-0 shadow-sm text-xs font-medium text-slate-900 font-mono">
                  {servRole.psadm_srv.pshome}
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-semibold text-slate-700 bg-slate-100 px-2 py-1 rounded-t-md uppercase tracking-wide">
                  OS
                </Label>
                <div className="p-2.5 bg-orange-50 rounded-md rounded-tl-none border border-orange-200 border-t-0 shadow-sm text-xs font-medium text-slate-900">
                  {servRole.psadm_srv.os}
                </div>
              </div>
              {servRole.psadm_srv.psuser && (
                <div className="space-y-1">
                  <Label className="text-[10px] font-semibold text-slate-700 bg-slate-100 px-2 py-1 rounded-t-md uppercase tracking-wide">
                    PS User
                  </Label>
                  <div className="p-2.5 bg-orange-50 rounded-md rounded-tl-none border border-orange-200 border-t-0 shadow-sm text-xs font-medium text-slate-900 font-mono">
                    {servRole.psadm_srv.psuser}
                  </div>
                </div>
              )}
              {servRole.psadm_srv.domain && (
                <div className="space-y-1">
                  <Label className="text-[10px] font-semibold text-slate-700 bg-slate-100 px-2 py-1 rounded-t-md uppercase tracking-wide">
                    Domain
                  </Label>
                  <div className="p-2.5 bg-orange-50 rounded-md rounded-tl-none border border-orange-200 border-t-0 shadow-sm text-xs font-medium text-slate-900">
                    {servRole.psadm_srv.domain}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

