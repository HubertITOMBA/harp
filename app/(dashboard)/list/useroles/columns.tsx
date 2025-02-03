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
  netid: string
  role: string
  datmaj: Date
  
}

// model psadm_role {
//   role           String           @id @db.VarChar(32)
//   descr          String           @db.VarChar(50)
//   psadm_roleperm psadm_roleperm[]
//   psadm_roleuser psadm_roleuser[]

//   netid      String     @default("") @db.VarChar(32)
//   role       String     @db.VarChar(32)
//   rolep      String     @db.Char(1)
//   datmaj     DateTime   @default(now()) @db.Timestamp(0)
// }


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
    accessorKey: 'netid',
    header: ({ column }) => {
      return (
        <Button
          variant='ghost'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          NetId
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
        Rôle principal
        <ArrowUpDown className='ml-2 h-4 w-4' />
      </Button>
    )
  },
},
{
  accessorKey: 'datmaj',
  header: ({ column }) => {
    return (
      <Button
        variant='ghost'
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Mis à jour
        <ArrowUpDown className='ml-2 h-4 w-4' />
      </Button>
    )
  },
  cell: ({ row }) => {
    const datmaj = row.getValue('datmaj')
    return (
      <div className="">
        {new Intl.DateTimeFormat("fr-FR", {
          dateStyle: 'short',
          timeStyle: 'short',
        }).format(datmaj)}
      </div>
    )
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
              onClick={() => navigator.clipboard.writeText(base.netid)}
            >
              Copier Serveur
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>View customer</DropdownMenuItem>
            <DropdownMenuItem>
              <Link href={`/list/useroles/${base.netid}`}> 
               {/* <Link className="p-3 rounded-md bg-purple-300" href={`/list/students?teacherId=${"teacher2"}`}>Etudiants</Link> */}
                Voir les details {base.netid}</Link>
           </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }
  }
]