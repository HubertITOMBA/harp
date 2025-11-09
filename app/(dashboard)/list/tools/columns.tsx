'use client'

import { ColumnDef } from '@tanstack/react-table'
import { ArrowUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { ToolsActions } from '@/components/tools/ToolsActions'

export type ListTools = {
  id: number
  tool: string
  cmdpath: string
  cmd: string
  version: string
  descr: string
  tooltype: string
  cmdarg: string
  mode: string
  output: string
}

export const columns: ColumnDef<ListTools>[] = [
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
    accessorKey: 'tool',
    header: ({ column }) => {
      return (
        <Button
          variant='ghost'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Outil
          <ArrowUpDown className='ml-2 h-4 w-4' />
        </Button>
      )
    }
  },

{
  accessorKey: 'descr',
  header: ({ column }) => {
    return (
      <Button
        variant='ghost'
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Description
        <ArrowUpDown className='ml-2 h-4 w-4' />
      </Button>
    )
  },
},
{
  accessorKey: 'cmdpath',
  header: 'Chemin commande'
},
{
  accessorKey: 'cmd',
  header: 'Commande'  
},
{
  accessorKey: 'version',
  header: 'Version'
},
{
  accessorKey: 'cmdarg',
  header: 'Arguments',  
},
{
  accessorKey: 'tooltype',
  header: 'Type'  
},
{
  accessorKey: 'mode',
  header: 'Mode'  
},
{
  accessorKey: 'output',
  header: 'Output'  
},
{
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => {
      const tool = row.original

      return <ToolsActions tool={tool} />
    }
  }
]