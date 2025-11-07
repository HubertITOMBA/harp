"use client"

import { AddRolesModal } from './AddRolesModal';

interface AddRolesModalWrapperProps {
  netid: string;
  availableRoles: Array<{
    role: string;
    descr: string;
  }>;
  assignedRoles: string[];
}

export function AddRolesModalWrapper({ netid, availableRoles, assignedRoles }: AddRolesModalWrapperProps) {
  return (
    <AddRolesModal 
      netid={netid}
      availableRoles={availableRoles}
      assignedRoles={assignedRoles}
    />
  );
}

