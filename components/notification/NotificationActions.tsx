"use client";

import { useState } from 'react';
import { EditNotificationDialog } from './EditNotificationDialog';
import { ViewNotificationDialog } from './ViewNotificationDialog';
import { ActionsDropdown, ActionItem } from '@/components/ui/actions-dropdown';
import { Eye, Pencil } from "lucide-react";

interface NotificationActionsProps {
  notification: {
    id: number;
    title: string;
    message: string;
    createdAt: Date;
    creator: {
      id: number;
      name: string | null;
      email: string | null;
      netid: string | null;
    };
    recipients: Array<{
      id: number;
      recipientType: string;
      recipientId: number;
      read: boolean;
      readAt: Date | null;
    }>;
  };
}

export function NotificationActions({ notification }: NotificationActionsProps) {
  const [viewOpen, setViewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const actions: ActionItem[] = [
    {
      label: "Voir",
      icon: <Eye className="h-4 w-4" />,
      onClick: () => setViewOpen(true),
    },
    {
      label: "Modifier",
      icon: <Pencil className="h-4 w-4" />,
      onClick: () => setEditOpen(true),
    },
  ];

  return (
    <>
      <ActionsDropdown actions={actions} />
      
      {viewOpen && (
        <ViewNotificationDialog 
          notificationId={notification.id}
          open={viewOpen}
          onOpenChange={setViewOpen}
        />
      )}
      
      {editOpen && (
        <EditNotificationDialog 
          notificationId={notification.id}
          open={editOpen}
          onOpenChange={setEditOpen}
        />
      )}
    </>
  );
}

