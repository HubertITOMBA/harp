"use client";

import { useState } from 'react';
import { ActionsDropdown, ActionItem } from '@/components/ui/actions-dropdown';
import { Eye, Pencil } from 'lucide-react';
import { EditUserRolesDialog } from './EditUserRolesDialog';
import { ViewUserRolesDialog } from './ViewUserRolesDialog';

interface UserRolesActionsProps {
  userRole: {
    netid: string;
    role: string;
    rolep: string;
    datmaj: Date;
  };
}

export function UserRolesActions({ userRole }: UserRolesActionsProps) {
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
      
      <ViewUserRolesDialog 
        netid={userRole.netid} 
        role={userRole.role}
        userName={userRole.netid}
        roleName={userRole.role}
        open={viewOpen}
        onOpenChange={setViewOpen}
      />
      
      <EditUserRolesDialog 
        userRole={userRole}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
    </>
  );
}

