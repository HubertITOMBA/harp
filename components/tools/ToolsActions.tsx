"use client";

import { useState } from 'react';
import { EditToolsDialog } from './EditToolsDialog';
import { ViewToolsDialog } from './ViewToolsDialog';
import { ActionsDropdown, ActionItem } from '@/components/ui/actions-dropdown';
import { Eye, Pencil } from "lucide-react";

interface ToolsActionsProps {
  tool: {
    id?: number;
    tool: string;
    cmd: string;
    descr: string;
    tooltype: string;
    cmdarg: string;
    page?: string;
    mode: string;
    output: string;
  };
}

export function ToolsActions({ tool }: ToolsActionsProps) {
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
      
      <ViewToolsDialog 
        tool={tool.tool} 
        toolName={tool.tool}
        open={viewOpen}
        onOpenChange={setViewOpen}
      />
      
      <EditToolsDialog 
        tool={tool}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
    </>
  );
}

