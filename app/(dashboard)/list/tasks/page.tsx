import React from 'react'
import { columns } from './columns'
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import { TasksListPageClient } from './page-client';

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
 
  return <TasksListPageClient data={data} taskCount={taskCount} columns={columns} />;
}

export default TasksListPage
