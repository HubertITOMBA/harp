"use client";

import { EditTypeStatusDialog } from './EditTypeStatusDialog';
import { ViewTypeStatusDialog } from './ViewTypeStatusDialog';

interface TypeStatusActionsProps {
  typeStatus: {
    id: number;
    statenv: string;
    descr: string | null;
    icone: string | null;
  };
}

export function TypeStatusActions({ typeStatus }: TypeStatusActionsProps) {
  return (
    <div className="flex items-center gap-1 sm:gap-2">
      <ViewTypeStatusDialog statusId={typeStatus.id} statusName={typeStatus.statenv} />
      <EditTypeStatusDialog typeStatus={typeStatus} />
    </div>
  );
}

