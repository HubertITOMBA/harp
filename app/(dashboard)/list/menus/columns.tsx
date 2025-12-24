'use client'

import { ColumnDef } from '@tanstack/react-table'
import { ArrowUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { MenuActions } from '@/components/menu/MenuActions'
import Image from 'next/image'

export type MenuHarp = {
  id: number
  display: number
  level: number
  menu: string
  href: string | null
  icone: string | null
  active: number
  descr: string | null
  role: string | null
}


export const columns: ColumnDef<MenuHarp>[] = [
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
    accessorKey: 'menu',
    header: ({ column }) => {
      return (
        <Button
          variant='ghost'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Menu
          <ArrowUpDown className='ml-2 h-4 w-4' />
        </Button>
      )
    }
  },
  {
    accessorKey: 'descr',
    header: ({ column }) => {
      return (
        <Button
          variant='ghost'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Description
          <ArrowUpDown className='ml-2 h-4 w-4' />
        </Button>
      )
    }
  },
  {
    accessorKey: 'icone',
    header: ({ column }) => {
      return (
        <Button
          variant='ghost'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Icône
          <ArrowUpDown className='ml-2 h-4 w-4' />
        </Button>
      )
    },
    cell: ({ row }) => (
      row.original.icone && row.original.icone !== "" ? (
        <Image 
          src={`/ressources/${row.original.icone}`} 
          alt="" 
          width={20} 
          height={20} 
          className="items-end bg-transparent"
        />
      ) : (
        <Image 
          src={`/ressources/special.png`} 
          alt="" 
          width={20} 
          height={20} 
          className="items-end bg-transparent"
        />
      )
    )
  },
  {
    accessorKey: 'href',
    header: ({ column }) => {
      return (
        <Button
          variant='ghost'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          URL
          <ArrowUpDown className='ml-2 h-4 w-4' />
        </Button>
      )
    }
  },
  {
    accessorKey: 'role',
    header: ({ column }) => {
      return (
        <Button
          variant='ghost'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Rôle
          <ArrowUpDown className='ml-2 h-4 w-4' />
        </Button>
      )
    }
  },
  {
    accessorKey: 'display',
    header: ({ column }) => {
      return (
        <Button
          variant='ghost'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Ordre
          <ArrowUpDown className='ml-2 h-4 w-4' />
        </Button>
      )
    }
  },
  {
    accessorKey: 'level',
    header: ({ column }) => {
      return (
        <Button
          variant='ghost'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Niveau
          <ArrowUpDown className='ml-2 h-4 w-4' />
        </Button>
      )
    }
  },
  {
    accessorKey: 'active',
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
    cell: ({ row }) => (
      <span className={row.original.active === 1 ? "text-green-600" : "text-red-600"}>
        {row.original.active === 1 ? "Actif" : "Inactif"}
      </span>
    )
  },
  {
    id: 'actions',
    header: () => <div className="text-center">Actions</div>,
    cell: ({ row }) => {
      const menu = row.original

      return (
        <div className="flex justify-center">
          <MenuActions menu={menu} />
        </div>
      )
    }
  }
]