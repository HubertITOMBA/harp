import React from 'react'
import { columns } from './columns'
import { db } from "@/lib/db";
import { DataTable } from './data-table';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import { CreateTaskDialog } from '@/components/task/CreateTaskDialog';
import { ImportTasksExcelDialog } from '@/components/task/ImportTasksExcelDialog';

const TasksListPage = async () => {
  const data = await db.harptask.findMany({
    select: {
      id: true,
      title: true,
      descr: true,
      status: true,
      date: true,
      estimatedDuration: true,
      effectiveDuration: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: { items: true },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  const taskCount = data.length;
 
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
            <div className="mb-2 flex justify-end gap-2">
              <ImportTasksExcelDialog />
              <CreateTaskDialog />
            </div>
            <DataTable columns={columns} data={data} />
          </CardContent>
        </Card>
      </div>
    </div>
  )    
}

export default TasksListPage
