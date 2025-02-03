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

export type ServerRole = {
    env: string
    srv: string
    ip: string
    pshome: string
    os: string
    psuser: string
    domain: string
    typsrv: string
    status: true
}


export const columns: ColumnDef<ServerRole>[] = [
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
    accessorKey: 'srv',
    header: ({ column }) => {
      return (
        <Button
          variant='ghost'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Serveur
          <ArrowUpDown className='ml-2 h-4 w-4' />
        </Button>
      )
    }
  },
{
  accessorKey: 'env',
  header: 'env'
},
{
  accessorKey: 'ip',
  header: 'ip'
},
{
  accessorKey: 'pshome',
  header: 'pshome'
},
{
  accessorKey: 'os',
  header: 'os'
},
{
  accessorKey: 'psuser',
  header: 'psuser'
},
{
  accessorKey: 'domain',
  header: 'domain'
},
{
  accessorKey: 'psversion',
  header: 'psversion'
},
{
  accessorKey:  'typsrv',
  header: 'typsrv'
},
{
  accessorKey: 'status',
  header: 'status'
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
              onClick={() => navigator.clipboard.writeText(base.env)}
            >
              Copier Environnement
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>View customer</DropdownMenuItem>
            <DropdownMenuItem>Voir les details</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }
  }
]