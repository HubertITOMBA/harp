"use client";

import { useState } from 'react';
import { EditAppliDialog } from './EditAppliDialog';
import { ViewAppliDialog } from './ViewAppliDialog';
import { ActionsDropdown, ActionItem } from '@/components/ui/actions-dropdown';
import { Eye, Pencil } from "lucide-react";

interface AppliActionsProps {
  appli: {
    appli: string;
    psversion: string;
    descr: string;
  };
}

export function AppliActions({ appli }: AppliActionsProps) {
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
      
      <ViewAppliDialog 
        appli={appli.appli} 
        psversion={appli.psversion}
        open={viewOpen}
        onOpenChange={setViewOpen}
      />
      
      <EditAppliDialog 
        appli={appli}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
    </>
  );
}

