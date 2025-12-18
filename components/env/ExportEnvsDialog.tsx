"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { FileDown, Mail } from "lucide-react";
import { exportEnvsToExcel, exportEnvsToPDF, EnvData } from '@/lib/export-envs';
import { toast } from 'react-toastify';
import { SendEnvsExportDialog } from './SendEnvsExportDialog';

interface ExportEnvsDialogProps {
  envs: EnvData[];
  visibleColumns: string[];
}

export function ExportEnvsDialog({ envs, visibleColumns }: ExportEnvsDialogProps) {
  const handleDownload = (type: 'excel' | 'pdf') => {
    try {
      if (type === 'excel') {
        exportEnvsToExcel(envs, visibleColumns);
        toast.success("Export Excel téléchargé avec succès");
      } else {
        exportEnvsToPDF(envs, visibleColumns);
        toast.success("Export PDF téléchargé avec succès");
      }
    } catch (error) {
      console.error(error);
      toast.error(`Erreur lors de l'export ${type.toUpperCase()}`);
    }
  };

  return (
    <div className="flex gap-2">
      <Button
        onClick={() => handleDownload('excel')}
        variant="outline"
        className="bg-white hover:bg-gray-50"
        title="Télécharger en Excel"
      >
        <FileDown className="h-4 w-4 mr-2" />
        Excel
      </Button>
      <Button
        onClick={() => handleDownload('pdf')}
        variant="outline"
        className="bg-white hover:bg-gray-50"
        title="Télécharger en PDF"
      >
        <FileDown className="h-4 w-4 mr-2" />
        PDF
      </Button>
      <SendEnvsExportDialog envs={envs} visibleColumns={visibleColumns} />
    </div>
  );
}

