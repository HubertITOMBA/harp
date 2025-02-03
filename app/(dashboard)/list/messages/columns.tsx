'use client'

import { ColumnDef } from '@tanstack/react-table'
import { MoreHorizontal, ArrowUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Checkbox } from '@/components/ui/checkbox'
import Link from 'next/link'

export type MessageList = {
  num: number
  msg: string
  fromdate: Date
  todate: Date
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
    cell: ({ row }) => {
      const base = row.original

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant='ghost' className='h-8 w-8 p-0'>
              <span className='sr-only'>Open menu</span>
              <MoreHorizontal className='h-4 w-4' />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end' className="bg-harpSkyLight">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(base.num)}
            >
              Copier Instance
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>View customer</DropdownMenuItem>
            <DropdownMenuItem>
              <Link href={`/list/messages/${base.num}`}> 
               {/* <Link className="p-3 rounded-md bg-purple-300" href={`/list/students?teacherId=${"teacher2"}`}>Etudiants</Link> */}
                Voir les details {base.num}</Link>
           </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }
  }
]