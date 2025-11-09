"use client";

import { EditRoleDialog } from './EditRoleDialog';
import { ViewRoleDialog } from './ViewRoleDialog';

interface RoleActionsProps {
  role: {
    id: number;
    role: string;
    descr: string;
    slug: string | null;
  };
}

export function RoleActions({ role }: RoleActionsProps) {
  return (
    <div className="flex items-center gap-1 sm:gap-2">
      <ViewRoleDialog roleId={role.id} roleName={role.role} />
      <EditRoleDialog role={role} />
    </div>
  );
}

