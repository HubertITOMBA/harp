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

export type Envs = {
    id: Number
    env: string
    site: string
    typenv: string
    url: string
    oracle_sid: string
    aliasql: string
    oraschema: string
    appli: string
    psversion: string
    ptversion: string
    harprelease: string
    volum: string
    anonym: string
    edi: string
    typenvid: number
    statenvId: number
    statenv: string
    descr: string
    icone: string
}

export const columns: ColumnDef<Envs>[] = [
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
    cell: ({ row }) => (
      row.original.icone !== "" ? (
        <img 
          src={`/ressources/${row.original.statutenv.icone}`} 
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
    accessorKey: 'env',
    header: ({ column }) => {
      return (
        <Button
          variant='ghost'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="font-semibold text-white"
        >
          Base
          <ArrowUpDown className='ml-2 h-4 w-4' />
        </Button>
      )
    }
  },
//   {
//     accessorKey: 'env',
//     header: 'Environnement'
//   },
//   {
//     accessorKey: 'site',
//     header: 'Site'
// },

// {
//   accessorKey: 'url',
//   header: 'Url'
// },
{
  accessorKey: 'oracle_sid',
  header: 'Sid'
  
},
// {
//   accessorKey: 'aliasql',
//   header: 'Alias'
// },
{
  accessorKey: 'oraschema',
  header: 'Schema'
},
// {
//   accessorKey: 'appli',
//   header: 'Appli'
// },
{
  accessorKey: 'psversion',
  header: 'PSoft'
},
{
  accessorKey:  'ptversion',
  header: 'Ptools'
},
{
  accessorKey: 'harprelease',
  header: 'Release'
},
{
  accessorKey: 'volum',
  header: 'Cobol'
},
{
  accessorKey: 'anonym',
  header: 'Anonym',
  cell: ({ row }) => (
    row.original.icone === "N" ? (
      <img 
        src={`/ressources/anonym.png`} 
        alt="" 
        width={20} 
        height={20} 
        className="items-end bg-transparent"
      />
    ) : null 
  )
},
{
  accessorKey: 'edi',
  header: 'Edi'
},
{
  accessorKey: 'typenv',
  header: 'Type'
},
// {
//   accessorKey: 'statutenv.descr',
//   header: 'descr'
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
        <DropdownMenu  >
          <DropdownMenuTrigger asChild >
            <Button variant='ghost' className='h-8 w-8 p-0'>
              <span className='sr-only'>Open menu</span>
              <MoreHorizontal className='h-4 w-4' />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end' className="rounded-xl bg-harpOrange">
            <DropdownMenuLabel className="rounded-md bg-harpSky border-none">Actions sur {base.env}</DropdownMenuLabel>
            {/* <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(base.env)}
            >
              Copier Environnement
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>View customer</DropdownMenuItem>*/}
            <DropdownMenuItem> 
            <Link className="hover:text-white hover:font-bold" href={`/list/envs/${base.env}`}>Voir</Link>
           </DropdownMenuItem>
           {/* <DropdownMenuSeparator /> */}
            <DropdownMenuItem>
            <Link className="hover:text-white hover:font-bold" href={`/list/envs/edit/${parseInt(base.id)}`}>Modifier  = {base.env} = {base.id}</Link> 
            </DropdownMenuItem>
         
            {/* <DropdownMenuSeparator /> */}
            <DropdownMenuItem >
            <Link className="hover:text-white hover:font-bold" href={`/list/envs/${base.env}`}>Supprimer</Link> 
            </DropdownMenuItem>
            <DropdownMenuItem></DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }
  }
]