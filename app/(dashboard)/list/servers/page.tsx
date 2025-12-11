import React from 'react'
import { columns } from './columns'
import { db } from "@/lib/db";
import { DataTable } from './data-table';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Server } from "lucide-react";
import { CreateServerDialog } from '@/components/server/CreateServerDialog';

export default async function ServerListPage() {
  const data = await db.harpserve.findMany({
    include: {
      statutenv: true,
    },
    orderBy: {
      srv: 'asc',
    },
  });

  const serverCount = data.length;
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-200 to-orange-50 p-2 sm:p-3">
      <div className="max-w-7xl mx-auto space-y-2">
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="harp-card-header">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl lg:text-2xl font-bold">
              <Server className="h-5 w-5 sm:h-6 sm:w-6" />
              Tous les serveurs ({serverCount})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2 sm:p-3">
            <div className="mb-2 flex justify-end">
              <CreateServerDialog />
            </div>
            <DataTable columns={columns} data={data} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}