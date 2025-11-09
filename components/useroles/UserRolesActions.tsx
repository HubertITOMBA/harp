"use client";

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
  return (
    <div className="flex items-center gap-1 sm:gap-2">
      <ViewUserRolesDialog 
        netid={userRole.netid} 
        role={userRole.role}
        userName={userRole.netid}
        roleName={userRole.role}
      />
      <EditUserRolesDialog userRole={userRole} />
    </div>
  );
}

