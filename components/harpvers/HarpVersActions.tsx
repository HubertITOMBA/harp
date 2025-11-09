"use client";

import { EditHarpVersDialog } from './EditHarpVersDialog';
import { ViewHarpVersDialog } from './ViewHarpVersDialog';

interface HarpVersActionsProps {
  harpVers: {
    harprelease: string;
    descr: string;
  };
}

export function HarpVersActions({ harpVers }: HarpVersActionsProps) {
  return (
    <div className="flex items-center gap-1 sm:gap-2">
      <ViewHarpVersDialog harprelease={harpVers.harprelease} releaseName={harpVers.harprelease} />
      <EditHarpVersDialog harpVers={harpVers} />
    </div>
  );
}

