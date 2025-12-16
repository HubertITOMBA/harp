'use client'

import { ColumnDef } from '@tanstack/react-table'
import { ArrowUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { ItemActions } from '@/components/item/ItemActions'

export type ListItem = {
  id: number
  descr: string
  createdAt: Date
  updatedAt: Date
  _count: {
    taskItems: number
  }
}

export const columns: ColumnDef<ListItem>[] = [
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
    accessorKey: 'descr',
    header: ({ column }) => {
      return (
        <Button
          variant='ghost'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-8 text-xs sm:text-sm"
        >
          Description
          <ArrowUpDown className='ml-2 h-3 w-3' />
        </Button>
      )
    },
    cell: ({ row }) => {
      return <div className="font-semibold text-xs sm:text-sm">{row.getValue('descr')}</div>
    }
  },
  {
    accessorKey: '_count.taskItems',
    header: "Nb utilisations",
    cell: ({ row }) => {
      const count = row.original._count.taskItems;
      return <div className="text-xs sm:text-sm">{count}</div>;
    },
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) => {
      return (
        <Button
          variant='ghost'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-8 text-xs sm:text-sm"
        >
          Date de création
          <ArrowUpDown className='ml-2 h-3 w-3' />
        </Button>
      )
    },
    cell: ({ row }) => {
      const date = row.getValue("createdAt") as Date
      return (
        <div className="text-xs sm:text-sm">
          {new Intl.DateTimeFormat("fr-FR", {
            dateStyle: "short",
            timeStyle: "short",
          }).format(new Date(date))}
        </div>
      )
    }
  },
  {
    accessorKey: 'updatedAt',
    header: ({ column }) => {
      return (
        <Button
          variant='ghost'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-8 text-xs sm:text-sm"
        >
          Dernière modification
          <ArrowUpDown className='ml-2 h-3 w-3' />
        </Button>
      )
    },
    cell: ({ row }) => {
      const date = row.getValue("updatedAt") as Date
      return (
        <div className="text-xs sm:text-sm">
          {new Intl.DateTimeFormat("fr-FR", {
            dateStyle: "short",
            timeStyle: "short",
          }).format(new Date(date))}
        </div>
      )
    }
  },
  {
    id: 'actions',
    header: () => <div className="text-center">Actions</div>,
    cell: ({ row }) => {
      const item = row.original
      return (
        <div className="flex justify-center">
          <ItemActions item={item} />
        </div>
      )
    },
  },
]

