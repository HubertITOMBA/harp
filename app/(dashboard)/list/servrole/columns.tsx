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

export type ServRoleList = {
    srv: string
    ip: string
    env: string
    typsrv: string
    pshome: string
    os: string
    psuser: string
    domain: string
    descr: string
    status: number
}




// {
//   header: "Serveur",
//   accessor: "srv",
//   className: "hidden lg:table-cell",
// },
// {
//   header: "Environnement",
//   accessor: "env",
//   className: "hidden lg:table-cell",
// },

// {
//   header: "Type",
//   accessor: "typsrv",
//   className: "hidden lg:table-cell",
// },
// {
//   header: "Statut",
//   accessor: "status",
//   className: "hidden lg:table-cell",
// },



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
          alt="" 
          width={20} 
          height={20} 
          className="items-end bg-transparent"
        />
      ) : ( <img 
        src={`/ressources/KO.png`} 
        alt="" 
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
  header: 'Ip'
},
// {
//   accessorKey: 'psadm_srv.pshome',
//   header: 'PS Home'
// },
{
  accessorKey:  'psadm_srv.os',
  header: 'Os'
},
{
  accessorKey: 'psadm_srv.psuser',
  header: 'psuser'
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
  header: 'Dercription'
},
{
  accessorKey: 'env',
  header: ({ column }) => {
    return (
      <Button
        variant='ghost'
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Base
        <ArrowUpDown className='ml-2 h-4 w-4' />
      </Button>
    )
  }
},
{
  accessorKey: 'psadm_srv.domain',
  header: 'Domain'
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
              onClick={() => navigator.clipboard.writeText(base.srv)}
            >
              Copier Serveur
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>View customer</DropdownMenuItem>
            <DropdownMenuItem>
              <Link href={`/list/servrole/${base.srv}`}> 
               {/* <Link className="p-3 rounded-md bg-purple-300" href={`/list/students?teacherId=${"teacher2"}`}>Etudiants</Link> */}
                Voir les details {base.srv}</Link>
           </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }
  }
]