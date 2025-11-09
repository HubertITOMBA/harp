"use client";

import { EditTypeServDialog } from './EditTypeServDialog';
import { ViewTypeServDialog } from './ViewTypeServDialog';

interface TypeServActionsProps {
  typeServ: {
    typsrv: string;
    descr: string;
  };
}

export function TypeServActions({ typeServ }: TypeServActionsProps) {
  return (
    <div className="flex items-center gap-1 sm:gap-2">
      <ViewTypeServDialog typsrv={typeServ.typsrv} typeServName={typeServ.typsrv} />
      <EditTypeServDialog typeServ={typeServ} />
    </div>
  );
}

