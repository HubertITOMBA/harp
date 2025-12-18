'use client'

import { ColumnDef } from '@tanstack/react-table'
import { ArrowUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { MessageActions } from '@/components/message/MessageActions'

export type MessageList = {
  num: number
  msg: string
  fromdate: Date
  todate: Date
  statut: string
}

export const columns: ColumnDef<MessageList>[] = [
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
    accessorKey: 'msg',
    header: ({ column }) => {
      return (
        <Button
          variant='ghost'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Message
          <ArrowUpDown className='ml-2 h-4 w-4' />
        </Button>
      )
    }
  },
  {
    accessorKey: 'statut',
    header: ({ column }) => {
      return (
        <Button
          variant='ghost'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Statut
          <ArrowUpDown className='ml-2 h-4 w-4' />
        </Button>
      )
    },
    cell: ({ row }) => {
      const statut = row.getValue('statut') as string
      return (
        <Badge 
          variant={statut === 'ACTIF' ? 'default' : 'secondary'}
          className={statut === 'ACTIF' 
            ? 'bg-green-100 text-green-800 border-green-300' 
            : 'bg-gray-100 text-gray-800 border-gray-300'
          }
        >
          {statut}
        </Badge>
      )
    }
  },
  {
    accessorKey: 'fromdate',
    header: ({ column }) => {
      return (
        <Button
          variant='ghost'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Début
          <ArrowUpDown className='ml-2 h-4 w-4' />
        </Button>
      )
    },
    cell: ({ row }) => {
      const date = new Date(row.getValue('fromdate'))
      const fromdate = Intl.DateTimeFormat("fr-FR", {dateStyle: 'short', timeStyle: 'short',}).format(date)
      return <div className='font-medium'>{fromdate}</div>
    }
  },
{
  accessorKey: 'todate',
  header: ({ column }) => {
    return (
      <Button
        variant='ghost'
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Fin
        <ArrowUpDown className='ml-2 h-4 w-4' />
      </Button>
    )
  },
  cell: ({ row }) => {
    const date = new Date(row.getValue('todate'))
    const todate = Intl.DateTimeFormat("fr-FR", {dateStyle: 'short', timeStyle: 'short',}).format(date)
    return <div className='font-medium'>{todate}</div>
  }
},
  {
    id: 'actions',
    header: () => <div className="text-center">Actions</div>,
    cell: ({ row }) => {
      const message = row.original;
      return (
        <div className="flex justify-center">
          <MessageActions message={message} />
        </div>
      );
    }
  }
]