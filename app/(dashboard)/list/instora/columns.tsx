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

export type OraIns = {
  id: number
  envid: string
  oracle_sid: string
  aliasql: string
  oraschema: string
  descr: string
  orarelease: string
  statenvid: number
  createdAt: Date;
  env: string,
  anonym: string,
  edi: string,
  url: string,
  icone: string
  }
 
  //  envsharp: statutenv

export const columns: ColumnDef<OraIns>[] = [
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
    accessorKey: 'oracle_sid',
    header: ({ column }) => {
      return (
        <Button
          variant='ghost'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Oracle SID
          <ArrowUpDown className='ml-2 h-4 w-4' />
        </Button>
      )
    }
  },
  // {
  //   accessorKey: 'id',
  //   header: 'id'
  // },
  {
    accessorKey: 'envsharp.env',
    header: ({ column }) => {
      return (
        <Button
          variant='ghost'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Env
          <ArrowUpDown className='ml-2 h-4 w-4' />
        </Button>
      )
    }
  },
{
  accessorKey: 'oracle_sid',
  header: ({ column }) => {
    return (
      <Button
        variant='ghost'
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Instance
        <ArrowUpDown className='ml-2 h-4 w-4' />
      </Button>
    )
  }
},
{
  accessorKey: 'aliasql',
  header: ({ column }) => {
    return (
      <Button
        variant='ghost'
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Alisa SQL*Net
        <ArrowUpDown className='ml-2 h-4 w-4' />
      </Button>
    )
  }
},
{
  accessorKey: 'oraschema',
  header: 'Schema'
},
{
  accessorKey:  'descr',
  header: 'Description'
},
{
  accessorKey: 'orarelease',
  header: 'Release'
},
{
  accessorKey: 'envsharp.anonym',
  header: 'Anonym'
},
{
  accessorKey: 'envsharp.edi',
  header: 'Edi'
},
{
  accessorKey: 'envsharp.url',
  header: 'Url'
},
{
  accessorKey: 'statutenv.icone',
  header: 'Edi'
},
{
  accessorKey: 'statenvid',
  header: 'Icone Statut'
},
{
  accessorKey: 'id',
  header: 'id'
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
              onClick={() => navigator.clipboard.writeText(base.oracle_sid)}
            >
              Copier Instance
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>View customer</DropdownMenuItem>
            <DropdownMenuItem>
              <Link href={`/list/instora/${base.oracle_sid}`}> 
               {/* <Link className="p-3 rounded-md bg-purple-300" href={`/list/students?teacherId=${"teacher2"}`}>Etudiants</Link> */}
                Voir les details {base.oracle_sid}</Link>
           </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }
  }
]