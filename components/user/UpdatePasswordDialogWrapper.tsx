"use client"

import { UpdatePasswordDialog } from './UpdatePasswordDialog';

interface UpdatePasswordDialogWrapperProps {
  netid: string;
  userEmail?: string | null;
}

export function UpdatePasswordDialogWrapper({ netid, userEmail }: UpdatePasswordDialogWrapperProps) {
  return <UpdatePasswordDialog netid={netid} userEmail={userEmail} />;
}

