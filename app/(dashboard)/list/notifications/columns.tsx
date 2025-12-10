'use client'

import { ColumnDef } from '@tanstack/react-table'
import { ArrowUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { NotificationActions } from '@/components/notification/NotificationActions'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, XCircle } from 'lucide-react'

export type ListNotifications = {
  id: number
  title: string
  message: string
  createdAt: Date
  creator: {
    id: number
    name: string | null
    email: string | null
    netid: string | null
  }
  recipients: Array<{
    id: number
    recipientType: string
    recipientId: number
    read: boolean
    readAt: Date | null
  }>
}

export const columns: ColumnDef<ListNotifications>[] = [
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
    accessorKey: 'title',
    header: ({ column }) => {
      return (
        <Button
          variant='ghost'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Titre
          <ArrowUpDown className='ml-2 h-4 w-4' />
        </Button>
      )
    },
    cell: ({ row }) => {
      const notification = row.original
      const hasUnread = notification.recipients.some(r => !r.read)
      return (
        <div className="flex items-center gap-2">
          {hasUnread ? (
            <XCircle className="h-4 w-4 text-gray-400" />
          ) : (
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          )}
          <span className={hasUnread ? "font-semibold" : ""}>{notification.title}</span>
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
    accessorKey: 'creator',
    header: ({ column }) => {
      return (
        <Button
          variant='ghost'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Créé par
          <ArrowUpDown className='ml-2 h-4 w-4' />
        </Button>
      )
    },
    cell: ({ row }) => {
      const creator = row.original.creator
      return (
        <div className="text-sm">
          {creator.name || creator.netid || creator.email || "Inconnu"}
        </div>
      )
    }
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) => {
      return (
        <Button
          variant='ghost'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Date de création
          <ArrowUpDown className='ml-2 h-4 w-4' />
        </Button>
      )
    },
    cell: ({ row }) => {
      const date = row.getValue('createdAt') as Date
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
      const readCount = recipients.filter(r => r.read).length
      const totalCount = recipients.length
      const allRead = readCount === totalCount
      
      return (
        <Badge variant={allRead ? "default" : "secondary"} className={allRead ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800"}>
          {readCount}/{totalCount} lu{readCount > 1 ? "s" : ""}
        </Badge>
      )
    }
  },
  {
    id: 'actions',
    header: () => <div className="text-center">Actions</div>,
    cell: ({ row }) => {
      const notification = row.original
      return (
        <div className="flex justify-center">
          <NotificationActions notification={notification} />
        </div>
      )
    }
  }
]

