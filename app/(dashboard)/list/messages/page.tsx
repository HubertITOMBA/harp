import React from 'react'
import { columns } from './columns'
import { getAllMessages } from '@/lib/actions/message-actions';
import { DataTable } from './data-table';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare } from "lucide-react";
import { CreateMessageDialog } from '@/components/message/CreateMessageDialog';

const MsgListPage = async () => {
  const data = await getAllMessages();
  const messageCount = data.length;
 
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50">
      <div className="w-full mx-auto px-2 sm:px-4 lg:px-6">
        <Card className="shadow-lg border-orange-200">
          <CardHeader className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Messages ({messageCount})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-4">
            <div className="mb-3 flex justify-end">
              <CreateMessageDialog />
            </div>
            <DataTable columns={columns} data={data} />
          </CardContent>
        </Card>
      </div>
    </div>
  )    
}

export default MsgListPage
