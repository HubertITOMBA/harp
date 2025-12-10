'use client'

import { ColumnDef } from '@tanstack/react-table'
import { ArrowUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { UserRolesActions } from '@/components/useroles/UserRolesActions'

export type StatusEnv = {
  netid: string
  role: string
  rolep: string
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
        Rôle
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
    const datmaj = row.getValue('datmaj') as Date
    return (
      <div className="">
        {new Intl.DateTimeFormat("fr-FR", {
          dateStyle: 'short',
          timeStyle: 'short',
        }).format(new Date(datmaj))}
      </div>
    )
  }
},

  {
    id: 'actions',
    header: () => <div className="text-center">Actions</div>,
    cell: ({ row }) => {
      const userRole = row.original

      return (
        <div className="flex justify-center">
          <UserRolesActions userRole={userRole} />
        </div>
      )
    }
  }
]