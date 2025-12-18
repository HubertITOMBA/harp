"use client";

import React, { useState, useEffect } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { DataTable } from './data-table';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import { CreateTaskDialog } from '@/components/task/CreateTaskDialog';
import { ImportTasksExcelDialog } from '@/components/task/ImportTasksExcelDialog';
import { ExportTasksDialog } from '@/components/task/ExportTasksDialog';
import { ListTask } from './columns';

interface TasksListPageClientProps {
  data: ListTask[];
  taskCount: number;
  columns: ColumnDef<ListTask>[];
}

export function TasksListPageClient({ data, taskCount, columns }: TasksListPageClientProps) {
  const [visibleColumns, setVisibleColumns] = useState<string[]>([]);

  // Debug: afficher les colonnes visibles quand elles changent
  useEffect(() => {
    console.log('TasksListPageClient - Colonnes visibles mises à jour:', visibleColumns);
  }, [visibleColumns]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-200 to-orange-50 p-2 sm:p-3">
      <div className="max-w-7xl mx-auto space-y-2">
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="harp-card-header">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl lg:text-2xl font-bold">
              <Image src="/ressources/history.png" alt="Chrono-tâches" width={20} height={20} className="flex-shrink-0" />
              Chrono-tâches ({taskCount})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2 sm:p-3">
            <div className="mb-2 flex justify-between items-center gap-2 flex-wrap">
              <ExportTasksDialog tasks={data} visibleColumns={visibleColumns} />
              <div className="flex gap-2">
                <ImportTasksExcelDialog />
                <CreateTaskDialog />
              </div>
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

