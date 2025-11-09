"use client";

import { ViewJournalDialog } from './ViewJournalDialog';

interface JournalActionsProps {
  journal: {
    num: number;
    netid: string | null;
    event: string | null;
    log: string;
    datmaj: Date;
  };
}

export function JournalActions({ journal }: JournalActionsProps) {
  return (
    <div className="flex items-center gap-1 sm:gap-2">
      <ViewJournalDialog journalNum={journal.num} journalNetId={journal.netid || ''} />
    </div>
  );
}

