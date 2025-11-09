import React from 'react'
import { columns } from './columns'
import { db } from "@/lib/db";
import { DataTable } from './data-table';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Database } from "lucide-react";
import { CreateInstOraDialog } from '@/components/instora/CreateInstOraDialog';

const InstOraListPage = async () => {
  
  const data = await db.harpinstance.findMany({
    orderBy: {
      oracle_sid: 'asc',
    },
    select: {
      id: true, 
      oracle_sid: true,
      descr: true,   
      serverId: true, 
      typebaseId: true,
      envsharp: {
        select: {
          id: true,
          env: true,
          anonym: true,
          edi: true,
          url: true,
        }
      },
      harpserve: {
        select: {
          id: true,
          srv: true,
          ip: true,
          pshome: true,
          os: true,
          psuser: true,
          domain: true,
          typsrv: true,
          statenvId: true,
        }
      }
    }
  });

  const instoraCount = data.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-200 to-orange-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="harp-card-header">
            <CardTitle className="flex items-center gap-3 text-xl sm:text-2xl lg:text-3xl font-bold">
              <Database className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8" />
              Toutes les instances Oracle
            </CardTitle>
            <p className="text-orange-50 text-sm sm:text-base mt-2">
              {instoraCount} instance{instoraCount > 1 ? "s" : ""} enregistrée{instoraCount > 1 ? "s" : ""}
            </p>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="mb-4 flex justify-end">
              <CreateInstOraDialog />
            </div>
            <DataTable columns={columns} data={data} />
          </CardContent>
        </Card>
      </div>
    </div>
  )    
}

export default InstOraListPage