'use client'

import { ColumnDef } from '@tanstack/react-table'
import { ArrowUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { EmailActions } from '@/components/notification/EmailActions'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, XCircle } from 'lucide-react'

export type ListEmails = {
  id: number
  subject: string
  message: string
  sentAt: Date
  sender: {
    id: number
    name: string | null
    email: string | null
    netid: string | null
  }
  recipients: Array<{
    id: number
    recipientType: string
    recipientId: number
    email: string
    name: string | null
    sent: boolean
    sentAt: Date | null
    error: string | null
  }>
}

export const columns: ColumnDef<ListEmails>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'subject',
    header: ({ column }) => {
      return (
        <Button
          variant='ghost'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Sujet
          <ArrowUpDown className='ml-2 h-4 w-4' />
        </Button>
      )
    },
    cell: ({ row }) => {
      const email = row.original
      const allSent = email.recipients.every(r => r.sent)
      const hasErrors = email.recipients.some(r => !r.sent && r.error)
      return (
        <div className="flex items-center gap-2">
          {allSent ? (
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          ) : hasErrors ? (
            <XCircle className="h-4 w-4 text-red-600" />
          ) : (
            <XCircle className="h-4 w-4 text-gray-400" />
          )}
          <span className={!allSent ? "font-semibold" : ""}>{email.subject}</span>
        </div>
      )
    }
  },
  {
    accessorKey: 'message',
    header: 'Message',
    cell: ({ row }) => {
      const message = row.getValue('message') as string
      return (
        <div className="max-w-md truncate text-sm text-gray-600">
          {message}
        </div>
      )
    }
  },
  {
    accessorKey: 'sender',
    header: ({ column }) => {
      return (
        <Button
          variant='ghost'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Envoyé par
          <ArrowUpDown className='ml-2 h-4 w-4' />
        </Button>
      )
    },
    cell: ({ row }) => {
      const sender = row.original.sender
      return (
        <div className="text-sm">
          {sender.name || sender.netid || sender.email || "Inconnu"}
        </div>
      )
    }
  },
  {
    accessorKey: 'sentAt',
    header: ({ column }) => {
      return (
        <Button
          variant='ghost'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Date d'envoi
          <ArrowUpDown className='ml-2 h-4 w-4' />
        </Button>
      )
    },
    cell: ({ row }) => {
      const date = row.getValue('sentAt') as Date
      return (
        <div className="text-sm">
          {new Intl.DateTimeFormat("fr-FR", {
            dateStyle: "short",
            timeStyle: "short",
          }).format(new Date(date))}
        </div>
      )
    }
  },
  {
    accessorKey: 'recipients',
    header: 'Statut',
    cell: ({ row }) => {
      const recipients = row.original.recipients
      const sentCount = recipients.filter(r => r.sent).length
      const totalCount = recipients.length
      const allSent = sentCount === totalCount
      
      return (
        <Badge variant={allSent ? "default" : "secondary"} className={allSent ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800"}>
          {sentCount}/{totalCount} envoyé{sentCount > 1 ? "s" : ""}
        </Badge>
      )
    }
  },
  {
    id: 'actions',
    header: () => <div className="text-center">Actions</div>,
    cell: ({ row }) => {
      const email = row.original
      return (
        <div className="flex justify-center">
          <EmailActions email={email} />
        </div>
      )
    }
  }
]

