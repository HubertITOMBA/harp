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

export type MenuHarp = {
  id: number
  display: number
  level: number
  tab: string
  newhref: string
  href: string
  icone: string
  active: number
  descr : string
  role: string
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
          Etiquette
          <ArrowUpDown className='ml-2 h-4 w-4' />
        </Button>
      )
    }
  },
 {
  accessorKey:  'href',
  header: 'Url'
},
{
  accessorKey: 'icone',
  header: 'Icône',
  cell: ({ row }) => (
    row.original.icone !== "" ? (
      <img 
        src={`/ressources/${row.original.icone}`} 
        alt="" 
        width={20} 
        height={20} 
        className="items-end bg-transparent"
      />
    ) : ( <img 
      src={`/ressources/special.png`} 
      alt="" 
      width={20} 
      height={20} 
      className="items-end bg-transparent"
    />)
  )
},
{
  accessorKey: 'descr',
  header: 'Description'
 },
{
  accessorKey: 'role',
  header: 'Autosiation'
},
{
  accessorKey: 'display',
  header: 'Ordre'
},
{
  accessorKey: 'level',
  header: 'Niveau'
},
{
  accessorKey: 'active',
  header: 'Statut'
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
             // onClick={() => navigator.clipboard.writeText(base.id)}
            >
              Copier Serveur
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>View customer</DropdownMenuItem>
            <DropdownMenuItem>
              <Link href={`/list/menus/${base.id}`}> 
               {/* <Link className="p-3 rounded-md bg-purple-300" href={`/list/students?teacherId=${"teacher2"}`}>Etudiants</Link> */}
                Voir les details {base.id}</Link>
           </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }
  }
]