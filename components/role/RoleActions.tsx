"use client";

import { useState } from 'react';
import { EditRoleDialog } from './EditRoleDialog';
import { ViewRoleDialog } from './ViewRoleDialog';
import { ActionsDropdown, ActionItem } from '@/components/ui/actions-dropdown';
import { Eye, Pencil } from "lucide-react";

interface RoleActionsProps {
  role: {
    id: number;
    role: string;
    descr: string;
    slug: string | null;
  };
}

export function RoleActions({ role }: RoleActionsProps) {
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
      
      <ViewRoleDialog 
        roleId={role.id} 
        roleName={role.role}
        open={viewOpen}
        onOpenChange={setViewOpen}
      />
      
      <EditRoleDialog 
        role={role}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
    </>
  );
}

