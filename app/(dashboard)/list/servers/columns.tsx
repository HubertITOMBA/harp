'use client'

import { ColumnDef } from '@tanstack/react-table'
import { ArrowUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { ServerActions } from '@/components/server/ServerActions';

export type Servs = {
    id: number
    srv: string
    ip: string
    pshome: string
    os: string
    psuser: string | null
    domain: string | null
    statenvId: number | null
    statutenv: {
        id: number
        statenv: string
        descr: string | null
        icone: string | null
    } | null
}

export const columns: ColumnDef<Servs>[] = [
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
    accessorKey: 'icone',
    header: '',
    cell: ({ row }) => {
      const icon = row.original.statutenv?.icone;
      return (
        <img 
          src={icon ? `/ressources/${icon}` : '/ressources/special.png'} 
          alt="" 
          width={16} 
          height={16} 
          className="items-end bg-transparent"
        />
      );
    }
  },
  {
    accessorKey: 'srv',
    header: ({ column }) => {
      return (
        <Button
          variant='ghost'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-8 text-xs sm:text-sm"
        >
          Serveur
          <ArrowUpDown className='ml-2 h-3 w-3' />
        </Button>
      )
    },
    cell: ({ row }) => {
      return <div className="font-semibold text-xs sm:text-sm">{row.getValue('srv')}</div>
    }
  },
  {
    accessorKey: 'ip',
    header: ({ column }) => {
      return (
        <Button
          variant='ghost'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-8 text-xs sm:text-sm"
        >
          IP
          <ArrowUpDown className='ml-2 h-3 w-3' />
        </Button>
      )
    },
    cell: ({ row }) => {
      return <div className="text-xs sm:text-sm">{row.getValue('ip') || '-'}</div>
    }
  },
  {
    accessorKey: 'pshome',
    header: ({ column }) => {
      return (
        <Button
          variant='ghost'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-8 text-xs sm:text-sm"
        >
          PS Home
          <ArrowUpDown className='ml-2 h-3 w-3' />
        </Button>
      )
    },
    cell: ({ row }) => {
      return <div className="text-xs sm:text-sm">{row.getValue('pshome') || '-'}</div>
    }
  },
  {
    accessorKey: 'os',
    header: ({ column }) => {
      return (
        <Button
          variant='ghost'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-8 text-xs sm:text-sm"
        >
          OS
          <ArrowUpDown className='ml-2 h-3 w-3' />
        </Button>
      )
    },
    cell: ({ row }) => {
      return <div className="text-xs sm:text-sm">{row.getValue('os') || '-'}</div>
    }
  },
  {
    accessorKey: 'domain',
    header: ({ column }) => {
      return (
        <Button
          variant='ghost'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-8 text-xs sm:text-sm"
        >
          Domain
          <ArrowUpDown className='ml-2 h-3 w-3' />
        </Button>
      )
    },
    cell: ({ row }) => {
      return <div className="text-xs sm:text-sm">{row.getValue('domain') || '-'}</div>
    }
  },
  {
    accessorKey: 'psuser',
    header: ({ column }) => {
      return (
        <Button
          variant='ghost'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-8 text-xs sm:text-sm"
        >
          PS User
          <ArrowUpDown className='ml-2 h-3 w-3' />
        </Button>
      )
    },
    cell: ({ row }) => {
      return <div className="text-xs sm:text-sm">{row.getValue('psuser') || '-'}</div>
    }
  },
  {
    id: 'actions',
    header: () => <div className="text-center">Actions</div>,
    cell: ({ row }) => {
      const server = row.original

      return (
        <div className="flex justify-center">
          <ServerActions server={server} />
        </div>
      )
    }
  }
]