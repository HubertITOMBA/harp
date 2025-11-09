"use client";

import { EditPtVersDialog } from './EditPtVersDialog';
import { ViewPtVersDialog } from './ViewPtVersDialog';

interface PtVersActionsProps {
  ptVers: {
    ptversion: string;
    descr: string;
  };
}

export function PtVersActions({ ptVers }: PtVersActionsProps) {
  return (
    <div className="flex items-center gap-1 sm:gap-2">
      <ViewPtVersDialog ptversion={ptVers.ptversion} versionName={ptVers.ptversion} />
      <EditPtVersDialog ptVers={ptVers} />
    </div>
  );
}

