'use client'

import { ColumnDef } from '@tanstack/react-table'
import { ArrowUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, XCircle } from 'lucide-react'
import { UserNotificationActions } from './UserNotificationActions'

// Type pour le callback de marquage comme lue
type OnMarkAsReadCallback = () => void

export type UserNotification = {
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

export const columns: ColumnDef<UserNotification>[] = [
  {
    accessorKey: 'title',
    header: ({ column }) => {
      return (
        <Button
          variant='ghost'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-8"
        >
          Titre
          <ArrowUpDown className='ml-2 h-4 w-4' />
        </Button>
      )
    },
    cell: ({ row }) => {
      const notification = row.original
      const isUnread = notification.recipients?.some((r: any) => !r.read) || false
      return (
        <div className="flex items-center gap-2">
          {isUnread ? (
            <XCircle className="h-4 w-4 text-orange-600 flex-shrink-0" />
          ) : (
            <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
          )}
          <span className={isUnread ? "font-semibold text-orange-900" : "text-gray-700"}>
            {notification.title}
          </span>
        </div>
      )
    }
  },
  {
    accessorKey: 'message',
    header: ({ column }) => {
      return (
        <Button
          variant='ghost'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-8"
        >
          Message
          <ArrowUpDown className='ml-2 h-4 w-4' />
        </Button>
      )
    },
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
          className="h-8"
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
    },
    sortingFn: (rowA, rowB) => {
      const creatorA = rowA.original.creator.name || rowA.original.creator.netid || rowA.original.creator.email || ""
      const creatorB = rowB.original.creator.name || rowB.original.creator.netid || rowB.original.creator.email || ""
      return creatorA.localeCompare(creatorB)
    }
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) => {
      return (
        <Button
          variant='ghost'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-8"
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
    header: ({ column }) => {
      return (
        <Button
          variant='ghost'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-8"
        >
          Statut
          <ArrowUpDown className='ml-2 h-4 w-4' />
        </Button>
      )
    },
    cell: ({ row }) => {
      const recipients = row.original.recipients
      const readCount = recipients?.filter(r => r.read).length || 0
      const totalCount = recipients?.length || 0
      const allRead = readCount === totalCount
      
      return (
        <Badge variant={allRead ? "default" : "secondary"} className={allRead ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800"}>
          {readCount}/{totalCount} lu{readCount > 1 ? "s" : ""}
        </Badge>
      )
    },
    sortingFn: (rowA, rowB) => {
      const readCountA = rowA.original.recipients?.filter(r => r.read).length || 0
      const readCountB = rowB.original.recipients?.filter(r => r.read).length || 0
      return readCountA - readCountB
    }
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => {
      const notification = row.original as any
      // Extraire onMarkAsRead si présent dans les données
      const { onMarkAsRead, ...notificationData } = notification
      return (
        <div className="flex justify-center">
          <UserNotificationActions 
            notification={notificationData} 
            onMarkAsRead={onMarkAsRead}
          />
        </div>
      )
    },
    enableSorting: false,
  }
]

