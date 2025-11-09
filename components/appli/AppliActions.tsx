"use client";

import { EditAppliDialog } from './EditAppliDialog';
import { ViewAppliDialog } from './ViewAppliDialog';

interface AppliActionsProps {
  appli: {
    appli: string;
    psversion: string;
    descr: string;
  };
}

export function AppliActions({ appli }: AppliActionsProps) {
  return (
    <div className="flex items-center gap-1 sm:gap-2">
      <ViewAppliDialog appli={appli.appli} psversion={appli.psversion} />
      <EditAppliDialog appli={appli} />
    </div>
  );
}

