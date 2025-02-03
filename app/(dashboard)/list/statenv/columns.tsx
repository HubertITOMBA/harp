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

export type StatusEnv = {
  env: string
  statenvId: number
  statenv: string
  fromdate: Date
  msg: string
  descr: string
  icone: string
}



export const columns: ColumnDef<StatusEnv>[] = [
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
    accessorKey: 'statutenv.icone',
    header: 'Statut',
    cell: ({ row }) => (
      <img src={`/ressources/${row.original.icone}`}  alt="" width={20} height={20} className="items-end bg-transparent" />
    //  <img src={`/ressources/${row.original.statutenv.icone}`}  alt="" width={20} height={20} className="items-end bg-transparent" /> 
    )

  },
  
  {
    accessorKey: 'env',
    header: ({ column }) => {
      return (
        <Button
          variant='ghost'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Environnement
          <ArrowUpDown className='ml-2 h-4 w-4' />
        </Button>
      )
    }
  },
 

// {
//   accessorKey: 'statenv',
//   header: 'statenv'
// },
// {
//   accessorKey: 'statenvId',
//   header: 'statenvId'
// },
// {
//   accessorKey:  'fromdate',
//   header: 'fromdate'
// },

{
  accessorKey:  'statutenv.descr',
  header: 'Description'
},
{
  accessorKey: 'msg',
  header: 'Message'
},
{
  accessorKey: 'fromdate',
  header: ({ column }) => {
    return (
      <Button
        variant='ghost'
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Date
        <ArrowUpDown className='ml-2 h-4 w-4' />
      </Button>
    )
  },
  cell: ({ row }) => {
    const fromdate = row.getValue('fromdate')
    return (
      <div className="">
        {new Intl.DateTimeFormat("fr-FR", {
          dateStyle: 'short',
          timeStyle: 'short',
        }).format(fromdate)}
      </div>
    )
  }
  
},
// {
//   accessorKey: 'statutenv.icone',
//   header: 'Icône'
// },
// ,
// {
//   accessorKey: 'statutenv.id',
//   header: 'Icône'
// },

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
              Copier Serveur
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>View customer</DropdownMenuItem>
            <DropdownMenuItem>
              <Link href={`/list/statenv/${base.env}`}> 
               {/* <Link className="p-3 rounded-md bg-purple-300" href={`/list/students?teacherId=${"teacher2"}`}>Etudiants</Link> */}
                Voir les details {base.env}</Link>
           </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }
  }
]