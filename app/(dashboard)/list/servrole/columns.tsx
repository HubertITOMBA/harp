'use client'

import { ColumnDef } from '@tanstack/react-table'
import { ArrowUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { ServRoleActions } from '@/components/servrole/ServRoleActions'

export type ServRoleList = {
    srv: string
    env: string
    typsrv: string
    status: number | null
    psadm_srv?: {
      srv: string
      ip: string
      os: string
      psuser: string | null
      domain: string | null
    }
    psadm_typsrv?: {
      typsrv: string
      descr: string
    }
}

export const columns: ColumnDef<ServRoleList>[] = [
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
    accessorKey: 'status',
    header: 'Statut',
    cell: ({ row }) => (
      row.original.status === 1 ? (
        <img 
          src={`/ressources/OK.png`} 
          alt="Actif" 
          width={20} 
          height={20} 
          className="items-end bg-transparent"
        />
      ) : ( <img 
        src={`/ressources/KO.png`} 
        alt="Inactif" 
        width={20} 
        height={20} 
        className="items-end bg-transparent"
      />)
    )
  },

//  cell: ({ row }) => (
//       row.original.status === 1 ? (
//         <img 
//           src={`/ressources/${row.original.status}`} 
//           alt="" 
//           width={20} 
//           height={20} 
//           className="items-end bg-transparent"
//         />
//       ) : ( <img 
//         src={`/ressources/special.png`} 
//         alt="" 
//         width={20} 
//         height={20} 
//         className="items-end bg-transparent"
//       />)
//     )
//  { item.status === 1 ? 
//                    <Image src="/ressources/OK.png" alt="" width={20} height={20} className="items-end bg-transparent" /> : 
//                    <Image src="/ressources/KO.png" alt="" width={20} height={20} className="items-end bg-transparent" />}




{
  accessorKey: 'psadm_srv.ip',
  header: 'IP'
},
{
  accessorKey: 'psadm_srv.os',
  header: 'OS'
},
{
  accessorKey: 'typsrv',
  header: ({ column }) => {
    return (
      <Button
        variant='ghost'
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Type
        <ArrowUpDown className='ml-2 h-4 w-4' />
      </Button>
    )
  }
},
{
  accessorKey: 'psadm_typsrv.descr',
  header: 'Description'
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
{
    id: 'actions',
    header: () => <div className="text-center">Actions</div>,
    cell: ({ row }) => {
      const servRole = row.original

      return (
        <div className="flex justify-center">
          <ServRoleActions servRole={servRole} />
        </div>
      )
    }
  }
]