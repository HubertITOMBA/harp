"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { FileDown, Mail } from "lucide-react";
import { exportTasksToExcel, exportTasksToPDF, TaskData } from '@/lib/export-tasks';
import { toast } from 'react-toastify';
import { SendTasksExportDialog } from './SendTasksExportDialog';

interface ExportTasksDialogProps {
  tasks: TaskData[];
  visibleColumns: string[];
}

export function ExportTasksDialog({ tasks, visibleColumns }: ExportTasksDialogProps) {
  const handleDownload = (type: 'excel' | 'pdf') => {
    try {
      if (type === 'excel') {
        exportTasksToExcel(tasks, visibleColumns);
        toast.success("Export Excel téléchargé avec succès");
      } else {
        exportTasksToPDF(tasks, visibleColumns);
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
      <SendTasksExportDialog tasks={tasks} visibleColumns={visibleColumns} />
    </div>
  );
}

