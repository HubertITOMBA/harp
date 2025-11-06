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
import { buildMyLaunchUrl } from '@/lib/mylaunch'
import { PuttyLauncher, PeopleSoftIDELauncher } from '@/components/ui/external-tool-launcher'

export type Servs = {
    srv: string
    ip: string
    pshome: string
    os: string
    psuser: string
    domain: string
    statenvId: number
    statutenv: { icone: string }
    descr: string
    icone: string
}

export const columns: ColumnDef<Servs>[] = [
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
  accessorKey: 'ip',
  header: 'Ip'
},
{
  accessorKey: 'pshome',
  header: 'PS Home'
},
{
  accessorKey:  'os',
  header: 'Os'
},
{
  accessorKey: 'domain',
  header: 'Domain'
},
{
  accessorKey: 'psuser',
  header: 'psuser'
},
{
  id: 'quickActions',
  header: 'Connexion',
  cell: ({ row }) => {
    const base = row.original
    return (
      <div className="flex gap-2">
        <PuttyLauncher
          host={base.ip}
          user={base.psuser}
          size="sm"
          variant="outline"
        />
        <PeopleSoftIDELauncher
          server={base.srv}
          size="sm"
          variant="outline"
        />
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
              onClick={() => navigator.clipboard.writeText(base.srv)}
            >
              Copier Serveur
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                const url = buildMyLaunchUrl('putty', {
                  host: base.ip,
                  user: base.psuser || undefined,
                })
                window.location.href = url
              }}
            >
              Ouvrir PuTTY (SSH)
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                const url = buildMyLaunchUrl('pside', {
                  server: base.srv,
                })
                window.location.href = url
              }}
            >
              Ouvrir PeopleSoft IDE
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>View customer</DropdownMenuItem>
            <DropdownMenuItem>
              <Link href={`/list/servers/${base.srv}`}> 
               {/* <Link className="p-3 rounded-md bg-purple-300" href={`/list/students?teacherId=${"teacher2"}`}>Etudiants</Link> */}
                Voir les details {base.srv}</Link>
           </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }
  }
]