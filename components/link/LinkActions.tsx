"use client";

import { ViewLinkDialog } from './ViewLinkDialog';
import { EditLinkDialog } from './EditLinkDialog';

interface LinkActionsProps {
  link: {
    display: number;
    link: string;
    typlink: string;
    url: string;
    tab: string;
    logo: string;
    descr: string;
  };
}

export function LinkActions({ link }: LinkActionsProps) {
  return (
    <div className="flex items-center gap-1 sm:gap-2">
      <ViewLinkDialog linkName={link.link} typlink={link.typlink} tab={link.tab} />
      <EditLinkDialog link={link} />
    </div>
  );
}

