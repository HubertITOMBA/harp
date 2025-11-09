'use client'

import { ColumnDef } from '@tanstack/react-table'
import { ArrowUpDown, Eye, Pencil, ServerOff, Server } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import Link from 'next/link'
import { EnvActions } from '@/components/env/EnvActions';

// Type basé sur le modèle Prisma envsharp
export type Envs = {
    id: number
    env: string
    aliasql: string | null
    oraschema: string | null
    orarelease: string | null
    instanceId: number | null
    url: string | null
    appli: string | null
    versionId: number | null
    psversionId: number | null
    ptversionId: number | null
    psversion: string | null
    ptversion: string | null
    harprelease: string | null
    pshome: string | null
    volum: string | null
    datmaj: Date | null
    gassi: string | null
    rpg: string | null
    msg: string | null
    descr: string | null
    anonym: string | null
    edi: string | null
    typenvid: number | null
    statenvId: number | null
    releaseId: number | null
    createddt: Date
    statutenv: {
        id: number
        statenv: string
        descr: string | null
        icone: string | null
    } | null
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
    cell: ({ row }) => {
      const icon = row.original.statutenv?.icone;
      return (
        <img 
          src={icon ? `/ressources/${icon}` : '/ressources/special.png'} 
          alt="" 
          width={16} 
          height={16} 
          className="items-end bg-transparent"
        />
      );
    }
  },
  {
    accessorKey: 'env',
    header: ({ column }) => {
      return (
        <Button
          variant='ghost'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-8 text-xs sm:text-sm"
        >
          Base
          <ArrowUpDown className='ml-2 h-3 w-3' />
        </Button>
      )
    },
    cell: ({ row }) => {
      return <div className="font-semibold text-xs sm:text-sm">{row.getValue('env')}</div>
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
  accessorKey: 'aliasql',
  header: 'Alias',
  cell: ({ row }) => {
    return <div className="text-xs sm:text-sm">{row.getValue('aliasql') || '-'}</div>
  }
},
{
  accessorKey: 'oraschema',
  header: 'Schema',
  cell: ({ row }) => {
    return <div className="text-xs sm:text-sm">{row.getValue('oraschema') || '-'}</div>
  }
},
{
  accessorKey: 'psversion',
  header: 'PSoft',
  cell: ({ row }) => {
    return <div className="text-xs sm:text-sm">{row.getValue('psversion') || '-'}</div>
  }
},
{
  accessorKey: 'ptversion',
  header: 'Ptools',
  cell: ({ row }) => {
    return <div className="text-xs sm:text-sm">{row.getValue('ptversion') || '-'}</div>
  }
},
{
  accessorKey: 'harprelease',
  header: 'Release',
  cell: ({ row }) => {
    return <div className="text-xs sm:text-sm">{row.getValue('harprelease') || '-'}</div>
  }
},
{
  accessorKey: 'anonym',
  header: 'Anonym',
  cell: ({ row }) => {
    const anonym = row.getValue('anonym') as string | null;
    return anonym === "N" ? (
      <img 
        src="/ressources/anonym.png" 
        alt="Anonymisé" 
        width={16} 
        height={16} 
        className="items-end bg-transparent"
      />
    ) : null;
  }
},
{
  accessorKey: 'edi',
  header: 'EDI',
  cell: ({ row }) => {
    return <div className="text-xs sm:text-sm">{row.getValue('edi') || '-'}</div>
  }
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
    header: 'Actions',
    cell: ({ row }) => {
      const env = row.original

      return <EnvActions env={env} />
    }
  }
]