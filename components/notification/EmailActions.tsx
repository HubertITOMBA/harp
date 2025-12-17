"use client";

import { useState } from 'react';
import { ViewEmailDialog } from './ViewEmailDialog';
import { ActionsDropdown, ActionItem } from '@/components/ui/actions-dropdown';
import { Eye } from "lucide-react";

interface EmailActionsProps {
  email: {
    id: number;
    subject: string;
    message: string;
    sentAt: Date;
    sender: {
      id: number;
      name: string | null;
      email: string | null;
      netid: string | null;
    };
    recipients: Array<{
      id: number;
      recipientType: string;
      recipientId: number;
      email: string;
      name: string | null;
      sent: boolean;
      sentAt: Date | null;
      error: string | null;
    }>;
  };
}

export function EmailActions({ email }: EmailActionsProps) {
  const [viewOpen, setViewOpen] = useState(false);

  const actions: ActionItem[] = [
    {
      label: "Voir",
      icon: <Eye className="h-4 w-4" />,
      onClick: () => setViewOpen(true),
    },
  ];

  return (
    <>
      <ActionsDropdown actions={actions} />
      
      {viewOpen && (
        <ViewEmailDialog 
          emailId={email.id}
          open={viewOpen}
          onOpenChange={setViewOpen}
        />
      )}
    </>
  );
}

