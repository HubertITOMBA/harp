import React from 'react'
import { columns } from './columns'
import { db } from "@/lib/db";
import { DataTable } from './data-table';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";

export default async function EnvListPage () {
  const data = await db.user.findMany();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-200 to-orange-50 p-3 sm:p-4 lg:p-6">
      <div className="space-y-4 sm:space-y-6">
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="harp-card-header">
            <CardTitle className="flex items-center gap-3 text-xl sm:text-2xl lg:text-3xl font-bold">
              <Users className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8" />
              Les utilisateurs
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <DataTable columns={columns} data={data} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
