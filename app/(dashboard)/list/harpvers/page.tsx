import React from 'react'
import { columns } from './columns'
import { db } from "@/lib/db";
import { DataTable } from './data-table';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package } from "lucide-react";
import { CreateHarpVersDialog } from '@/components/harpvers/CreateHarpVersDialog';

const HarpVersListPage = async () => {
  const data = await db.psadm_release.findMany({
    orderBy: {
      harprelease: 'asc',
    },
    select: {
      harprelease: true,
      descr: true,
    },
  });

  const releaseCount = data.length;
 
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-200 to-orange-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="harp-card-header">
            <CardTitle className="flex items-center gap-3 text-xl sm:text-2xl lg:text-3xl font-bold">
              <Package className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8" />
              Release Management
            </CardTitle>
            <p className="text-orange-50 text-sm sm:text-base mt-2">
              {releaseCount} release{releaseCount > 1 ? "s" : ""} enregistrée{releaseCount > 1 ? "s" : ""}
            </p>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="mb-4 flex justify-end">
              <CreateHarpVersDialog />
            </div>
            <DataTable columns={columns} data={data} />
          </CardContent>
        </Card>
      </div>
    </div>
  )    
}

export default HarpVersListPage