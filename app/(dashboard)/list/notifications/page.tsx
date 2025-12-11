import React from 'react'
import { columns } from './columns'
import { getAllNotifications } from '@/lib/actions/notification-actions';
import { DataTable } from './data-table';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell } from "lucide-react";
import { CreateNotificationDialog } from '@/components/notification/CreateNotificationDialog';
import { SendEmailDialog } from '@/components/notification/SendEmailDialog';

export default async function NotificationsListPage() {
  const data = await getAllNotifications();
  const notificationCount = data.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <Card className="shadow-lg border-orange-200">
          <CardHeader className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications ({notificationCount})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="mb-4 flex justify-end gap-2">
              <CreateNotificationDialog />
              <SendEmailDialog />
            </div>
            <DataTable columns={columns} data={data} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

