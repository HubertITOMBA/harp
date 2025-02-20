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

export type Users = {
    id: number
    netid: string
    unxid: string
    oprid: string
    nom: string
    prenom: string
    mdp: string
    defpage: string
    pkeyfile: string
    expunx:	Date
    expora:	Date
    lastlogin: Date
    email: string
}

export const columns: ColumnDef<Users>[] = [
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
    accessorKey: 'netid',
    header: ({ column }) => {
      return (
        <Button
          variant='ghost'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Net ID
          <ArrowUpDown className='ml-2 h-4 w-4' />
        </Button>
      )
    }
  },
// {
//   accessorKey: 'unxid',
//   header: 'Unix ID'
// },
{
  accessorKey: 'id',
  header: 'id'
},
{
  accessorKey: 'nom',
  header: ({ column }) => {
    return (
      <Button
        variant='ghost'
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Nom
        <ArrowUpDown className='ml-2 h-4 w-4' />
      </Button>
    )
  }
},
{
  accessorKey: 'prenom',
  header: 'Prénom'
},
// {
//   accessorKey: 'pkeyfile',
//   header: 'Pkeyfile'
// },
// {
//   accessorKey: 'expunx',
//   header: 'Expunx',
//   cell: ({ row }) => {
//     const date = new Date(row.getValue('expunx'))
//     const formatted = Intl.DateTimeFormat("fr-FR", {dateStyle: 'short', timeStyle: 'short',}).format(date)
//     return <div className='font-medium'>{formatted}</div>
//   }
// },
{
  accessorKey: 'expora',
  header: 'expora'
},
{
  accessorKey:  'lastlogin',
  header: 'Dernière connexion',
  cell: ({ row }) => {
          const date = new Date(row.getValue('lastlogin'))
          // const formatted = date.toLocaleDateString()
          const formatted = Intl.DateTimeFormat("fr-FR", {dateStyle: 'short', timeStyle: 'short',}).format(date)
          return <div className='font-medium'>{formatted}</div>
        }
},
{
  accessorKey: 'email',
  header: 'email'
  
},

// {  <td>{new Intl.DateTimeFormat("fr-FR", {dateStyle: 'short', timeStyle: 'short',}).format(lastlogin)}</td>
//   accessorKey: 'typenvid',
//   header: 'Environnement'
// },
// {
//   accessorKey: 'statenvId',
//   header: 'Environnement',
// },  
//   {
//     accessorKey: 'lastSeen',
//     header: 'Last seen',
//     cell: ({ row }) => {
//       const date = new Date(row.getValue('lastSeen'))
//       const formatted = date.toLocaleDateString()
//       return <div className='font-medium'>{formatted}</div>
//     }
//   },
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
              onClick={() => navigator.clipboard.writeText(base.netid)}
            >
              Copier Environnement
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>View customer</DropdownMenuItem>
            <DropdownMenuItem>
                <Link href={`/list/utilisateur/${base.id}`} > Voir <h1 className='uppercase font-semibold'>{base.netid}</h1></Link>
              </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }
  }
]