'use client'

import { ColumnDef } from '@tanstack/react-table'
import { ArrowUpDown, Pencil, UserX, UserCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { UserActions } from '@/components/user/UserActions';

export type Users = {
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
          className="h-8 text-xs sm:text-sm"
        >
          Net ID
          <ArrowUpDown className='ml-2 h-3 w-3' />
        </Button>
      )
    },
    cell: ({ row }) => {
      return <div className="font-semibold text-xs sm:text-sm">{row.getValue('netid')}</div>
    }
  },
// {
//   accessorKey: 'unxid',
//   header: 'Unix ID'
// },
// {
//   accessorKey: 'oprid',
//   header: 'Oprid'
// },
{
  accessorKey: 'nom',
  header: ({ column }) => {
    return (
      <Button
        variant='ghost'
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="h-8 text-xs sm:text-sm"
      >
        Nom
        <ArrowUpDown className='ml-2 h-3 w-3' />
      </Button>
    )
  },
  cell: ({ row }) => {
    return <div className="text-xs sm:text-sm">{row.getValue('nom') || '-'}</div>
  }
},
{
  accessorKey: 'prenom',
  header: ({ column }) => (
    <Button
      variant='ghost'
      onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      className="h-8 text-xs sm:text-sm"
    >
      Prénom
      <ArrowUpDown className='ml-2 h-3 w-3' />
    </Button>
  ),
  cell: ({ row }) => {
    return <div className="text-xs sm:text-sm">{row.getValue('prenom') || '-'}</div>
  }
},
// {
//   accessorKey: 'pkeyfile',
//   header: 'Pkeyfile'
// },
{
  accessorKey:  'lastlogin',
  header: ({ column }) => (
    <Button
      variant='ghost'
      onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      className="h-8 text-xs sm:text-sm"
    >
      Dernière connexion
      <ArrowUpDown className='ml-2 h-3 w-3' />
    </Button>
  ),
  cell: ({ row }) => {
    const date = row.getValue('lastlogin') as Date | null;
    if (!date) return <div className="text-xs sm:text-sm text-gray-400">Jamais</div>;
    const formatted = Intl.DateTimeFormat("fr-FR", {dateStyle: 'short', timeStyle: 'short'}).format(new Date(date));
    return <div className='text-xs sm:text-sm'>{formatted}</div>
  }
},
{
  accessorKey: 'email',
  header: ({ column }) => (
    <Button
      variant='ghost'
      onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      className="h-8 text-xs sm:text-sm"
    >
      Email
      <ArrowUpDown className='ml-2 h-3 w-3' />
    </Button>
  ),
  cell: ({ row }) => {
    return <div className="text-xs sm:text-sm">{row.getValue('email') || '-'}</div>
  }
},
{
  id: 'statut',
  accessorFn: (row) => (row.mdp?.startsWith('DISABLED_') ? 'desactive' : 'actif'),
  header: ({ column }) => {
    return (
      <Button
        variant='ghost'
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="h-8 text-xs sm:text-sm"
      >
        Statut
        <ArrowUpDown className='ml-2 h-3 w-3' />
      </Button>
    )
  },
  cell: ({ row }) => {
    const isDisabled = row.original.mdp?.startsWith('DISABLED_') ?? false
    return (
      <div className="flex justify-center">
        {isDisabled ? (
          <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-800 border-amber-200">
            Désactivé
          </Badge>
        ) : (
          <Badge variant="secondary" className="text-xs bg-green-100 text-green-800 border-green-200">
            Actif
          </Badge>
        )}
      </div>
    )
  }
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
    header: () => <div className="text-center">Actions</div>,
    enableSorting: false,
    cell: ({ row }) => {
      const user = row.original

      return (
        <div className="flex justify-center">
          <UserActions user={user} />
        </div>
      )
    }
  }
]