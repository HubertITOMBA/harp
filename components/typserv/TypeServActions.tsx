"use client";

import { useState } from 'react';
import { EditTypeServDialog } from './EditTypeServDialog';
import { ViewTypeServDialog } from './ViewTypeServDialog';
import { ActionsDropdown, type ActionItem } from '@/components/ui/actions-dropdown';

interface TypeServActionsProps {
  typeServ: {
    typsrv: string;
    descr: string;
  };
}

export function TypeServActions({ typeServ }: TypeServActionsProps) {
  const [viewOpen, setViewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const actions: ActionItem[] = [
    {
      label: "Voir",
      onClick: () => setViewOpen(true),
    },
    {
      label: "Modifier",
      onClick: () => setEditOpen(true),
    },
  ];

  return (
    <>
      <ActionsDropdown actions={actions} />
      <ViewTypeServDialog
        typsrv={typeServ.typsrv}
        typeServName={typeServ.typsrv}
        open={viewOpen}
        onOpenChange={setViewOpen}
      />
      <EditTypeServDialog
        typeServ={typeServ}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
    </>
  );
}

