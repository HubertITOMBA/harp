"use client";

import { EditHarParamDialog } from './EditHarParamDialog';
import { ViewHarParamDialog } from './ViewHarParamDialog';

interface HarParamActionsProps {
  harParam: {
    param: string;
    valeur: string;
    descr: string;
  };
}

export function HarParamActions({ harParam }: HarParamActionsProps) {
  return (
    <div className="flex items-center gap-1 sm:gap-2">
      <ViewHarParamDialog param={harParam.param} paramName={harParam.param} />
      <EditHarParamDialog harParam={harParam} />
    </div>
  );
}

