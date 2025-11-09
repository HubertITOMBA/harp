"use client";

import { EditServRoleDialog } from './EditServRoleDialog';
import { ViewServRoleDialog } from './ViewServRoleDialog';

interface ServRoleActionsProps {
  servRole: {
    srv: string;
    env: string;
    typsrv: string;
    status: number | null;
    psadm_srv?: {
      srv: string;
      ip: string;
      os: string;
    };
    psadm_typsrv?: {
      typsrv: string;
      descr: string;
    };
  };
}

export function ServRoleActions({ servRole }: ServRoleActionsProps) {
  return (
    <div className="flex items-center gap-1 sm:gap-2">
      <ViewServRoleDialog
        srv={servRole.srv}
        env={servRole.env}
        typsrv={servRole.typsrv}
        serverName={servRole.srv}
        envName={servRole.env}
        typsrvName={servRole.psadm_typsrv?.descr || servRole.typsrv}
      />
      <EditServRoleDialog servRole={servRole} />
    </div>
  );
}

