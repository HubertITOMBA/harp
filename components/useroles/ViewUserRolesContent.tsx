"use client"

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Users, Shield, Calendar } from "lucide-react";

interface ViewUserRolesContentProps {
  userRole: {
    netid: string;
    role: string;
    rolep: string;
    datmaj: Date;
    psadm_user?: {
      netid: string;
      nom: string | null;
      prenom: string | null;
      email: string | null;
    };
    psadm_role?: {
      role: string;
      descr: string;
    };
  };
}

export function ViewUserRolesContent({ userRole }: ViewUserRolesContentProps) {
  return (
    <div className="space-y-6">
      {/* Informations générales */}
      <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="harp-card-header">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Users className="h-6 w-6" />
            </div>
            <CardTitle className="text-xl sm:text-2xl">Informations générales</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
            <div className="space-y-1">
              <Label className="text-[10px] font-semibold text-slate-700 bg-slate-100 px-2 py-1 rounded-t-md uppercase tracking-wide flex items-center gap-2">
                <Users className="h-3 w-3 text-orange-600" />
                Utilisateur
              </Label>
              <div className="p-2.5 bg-orange-50 rounded-md rounded-tl-none border border-orange-200 border-t-0 shadow-sm text-xs font-medium text-slate-900 font-mono">
                {userRole.netid}
              </div>
              {userRole.psadm_user && (
                <div className="text-xs text-gray-600 mt-1">
                  {userRole.psadm_user.prenom} {userRole.psadm_user.nom}
                </div>
              )}
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-semibold text-slate-700 bg-slate-100 px-2 py-1 rounded-t-md uppercase tracking-wide flex items-center gap-2">
                <Shield className="h-3 w-3 text-orange-600" />
                Rôle
              </Label>
              <div className="p-2.5 bg-orange-50 rounded-md rounded-tl-none border border-orange-200 border-t-0 shadow-sm text-xs font-medium text-slate-900 font-mono">
                {userRole.role}
              </div>
              {userRole.psadm_role && (
                <div className="text-xs text-gray-600 mt-1">
                  {userRole.psadm_role.descr}
                </div>
              )}
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-semibold text-slate-700 bg-slate-100 px-2 py-1 rounded-t-md uppercase tracking-wide flex items-center gap-2">
                <Shield className="h-3 w-3 text-orange-600" />
                Rôle principal
              </Label>
              <div className="p-2.5 bg-orange-50 rounded-md rounded-tl-none border border-orange-200 border-t-0 shadow-sm text-xs font-medium text-slate-900">
                {userRole.rolep === 'Y' ? 'Oui' : 'Non'}
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-semibold text-slate-700 bg-slate-100 px-2 py-1 rounded-t-md uppercase tracking-wide flex items-center gap-2">
                <Calendar className="h-3 w-3 text-orange-600" />
                Date de mise à jour
              </Label>
              <div className="p-2.5 bg-orange-50 rounded-md rounded-tl-none border border-orange-200 border-t-0 shadow-sm text-xs font-medium text-slate-900">
                {new Intl.DateTimeFormat("fr-FR", {
                  dateStyle: 'short',
                  timeStyle: 'short',
                }).format(new Date(userRole.datmaj))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

