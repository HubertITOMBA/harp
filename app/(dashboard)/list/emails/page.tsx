import React from 'react'
import { columns } from './columns'
import { getAllSentEmails } from '@/lib/actions/notification-actions';
import { DataTable } from './data-table';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail } from "lucide-react";
import { SendEmailDialog } from '@/components/notification/SendEmailDialog';

export default async function EmailsListPage() {
  const data = await getAllSentEmails();
  const emailCount = data.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <Card className="shadow-lg border-orange-200">
          <CardHeader className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Mails envoyés ({emailCount})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="mb-4 flex justify-end gap-2">
              <SendEmailDialog />
            </div>
            <DataTable columns={columns} data={data} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

