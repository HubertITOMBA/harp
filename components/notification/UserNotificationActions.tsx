"use client";

import { useState } from 'react';
import { ActionsDropdown, ActionItem } from '@/components/ui/actions-dropdown';
import { Eye, CheckCircle } from "lucide-react";
import { ViewNotificationDialog } from './ViewNotificationDialog';
import { markNotificationAsRead } from '@/lib/actions/notification-actions';
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation';

type UserNotification = {
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

interface UserNotificationActionsProps {
  notification: UserNotification;
  onMarkAsRead?: () => void;
}

/**
 * Composant d'actions pour les notifications de l'utilisateur
 */
export function UserNotificationActions({ notification, onMarkAsRead }: UserNotificationActionsProps) {
  const router = useRouter();
  const [viewOpen, setViewOpen] = useState(false);
  const isUnread = notification.recipients?.some((r: any) => !r.read) || false;

  const handleMarkAsRead = async () => {
    const result = await markNotificationAsRead(notification.id);
    if (result.success) {
      toast.success(result.message);
      router.refresh();
      if (onMarkAsRead) {
        onMarkAsRead();
      }
    } else {
      toast.error(result.error || "Erreur lors du marquage de la notification");
    }
  };

  const actions: ActionItem[] = [
    {
      label: "Voir",
      icon: <Eye className="h-4 w-4" />,
      onClick: () => setViewOpen(true),
    },
    ...(isUnread ? [{
      label: "Marquer comme lue",
      icon: <CheckCircle className="h-4 w-4" />,
      onClick: handleMarkAsRead,
    }] : []),
  ];

  return (
    <>
      <ActionsDropdown actions={actions} />
      
      {viewOpen && (
        <ViewNotificationDialog 
          notificationId={notification.id}
          open={viewOpen}
          onOpenChange={(open) => {
            setViewOpen(open);
            if (!open) {
              router.refresh();
            }
          }}
        />
      )}
    </>
  );
}

