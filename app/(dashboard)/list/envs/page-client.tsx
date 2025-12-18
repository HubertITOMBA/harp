"use client";

import React, { useState, useEffect } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { DataTable } from './data-table';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Server } from "lucide-react";
import { CreateEnvDialog } from '@/components/env/CreateEnvDialog';
import { ExportEnvsDialog } from '@/components/env/ExportEnvsDialog';
import { Envs } from './columns';

interface EnvListPageClientProps {
  data: Envs[];
  envCount: number;
  columns: ColumnDef<Envs>[];
}

export function EnvListPageClient({ data, envCount, columns }: EnvListPageClientProps) {
  const [visibleColumns, setVisibleColumns] = useState<string[]>([]);

  // Debug: afficher les colonnes visibles quand elles changent
  React.useEffect(() => {
    console.log('EnvListPageClient - Colonnes visibles mises à jour:', visibleColumns);
  }, [visibleColumns]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-200 to-orange-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="harp-card-header">
            <CardTitle className="flex items-center gap-3 text-xl sm:text-2xl lg:text-3xl font-bold">
              <Server className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8" />
              Tous les environnements
            </CardTitle>
            <p className="text-orange-50 text-sm sm:text-base mt-2">
              {envCount} environnement{envCount > 1 ? "s" : ""} enregistré{envCount > 1 ? "s" : ""}
            </p>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="mb-4 flex justify-between items-center gap-2 flex-wrap">
              <ExportEnvsDialog envs={data} visibleColumns={visibleColumns} />
              <CreateEnvDialog />
            </div>
            <DataTable 
              columns={columns} 
              data={data} 
              onVisibleColumnsChange={setVisibleColumns}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

