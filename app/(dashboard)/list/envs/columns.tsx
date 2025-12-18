'use client'

import { ColumnDef } from '@tanstack/react-table'
import { ArrowUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { EnvActions } from '@/components/env/EnvActions';

// Type basé sur le modèle Prisma envsharp avec données harpora
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
    harpora: {
        orarelease: string | null
        descr: string | null
    }
    server: string | null
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
    },
    enableHiding: false,
  },
  // 1. Base
  {
    id: 'env',
    accessorKey: 'env',
    header: ({ column }) => {
      return (
        <Button
          variant='ghost'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-6 text-xs"
        >
          Base
          <ArrowUpDown className='ml-1 h-3 w-3' />
        </Button>
      )
    },
    cell: ({ row }) => {
      return <div className="font-semibold text-xs">{row.getValue('env')}</div>
    }
  },
  // 2. Description
  {
    id: 'harpora.descr',
    accessorKey: 'harpora.descr',
    header: ({ column }) => {
      return (
        <Button
          variant='ghost'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-6 text-xs"
        >
          Description
          <ArrowUpDown className='ml-1 h-3 w-3' />
        </Button>
      )
    },
    cell: ({ row }) => {
      const descr = row.original.harpora?.descr;
      return <div className="text-xs">{descr || '-'}</div>
    }
  },
  // 3. Ora Release
  {
    id: 'harpora.orarelease',
    accessorKey: 'harpora.orarelease',
    header: ({ column }) => {
      return (
        <Button
          variant='ghost'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-6 text-xs"
        >
          Ora Release
          <ArrowUpDown className='ml-1 h-3 w-3' />
        </Button>
      )
    },
    cell: ({ row }) => {
      const orarelease = row.original.harpora?.orarelease;
      return <div className="text-xs">{orarelease || '-'}</div>
    }
  },
  // 4. Ptools
  {
    id: 'ptversion',
    accessorKey: 'ptversion',
    header: ({ column }) => {
      return (
        <Button
          variant='ghost'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-6 text-xs"
        >
          Ptools
          <ArrowUpDown className='ml-1 h-3 w-3' />
        </Button>
      )
    },
    cell: ({ row }) => {
      return <div className="text-xs">{row.getValue('ptversion') || '-'}</div>
    }
  },
  // 5. Release
  {
    id: 'harprelease',
    accessorKey: 'harprelease',
    header: ({ column }) => {
      return (
        <Button
          variant='ghost'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-6 text-xs"
        >
          Release
          <ArrowUpDown className='ml-1 h-3 w-3' />
        </Button>
      )
    },
    cell: ({ row }) => {
      return <div className="text-xs">{row.getValue('harprelease') || '-'}</div>
    }
  },
  // 6. Serveur
  {
    id: 'server',
    accessorKey: 'server',
    header: ({ column }) => {
      return (
        <Button
          variant='ghost'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-6 text-xs"
        >
          Serveur
          <ArrowUpDown className='ml-1 h-3 w-3' />
        </Button>
      )
    },
    cell: ({ row }) => {
      const server = row.original.server;
      return <div className="text-xs">{server || '-'}</div>
    }
  },
  // 7. Anonym
  {
    id: 'anonym',
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
  // 8. EDI
  {
    id: 'edi',
    accessorKey: 'edi',
    header: 'EDI',
    cell: ({ row }) => {
      return <div className="text-xs">{row.getValue('edi') || '-'}</div>
    }
  },
  // 9. Actions
  {
    id: 'actions',
    header: () => <div className="text-center">Actions</div>,
    cell: ({ row }) => {
      const env = row.original
      return (
        <div className="flex justify-center items-center">
          <EnvActions env={env} />
        </div>
      )
    },
    enableHiding: false,
  },
  // Colonnes masquées par défaut (peuvent être affichées via le menu "Colonnes")
  {
    accessorKey: 'aliasql',
    header: 'Alias',
    cell: ({ row }) => {
      return <div className="text-xs">{row.getValue('aliasql') || '-'}</div>
    }
  },
  {
    accessorKey: 'oraschema',
    header: 'Schema',
    cell: ({ row }) => {
      return <div className="text-xs">{row.getValue('oraschema') || '-'}</div>
    }
  },
  {
    accessorKey: 'psversion',
    header: 'PSoft',
    cell: ({ row }) => {
      return <div className="text-xs">{row.getValue('psversion') || '-'}</div>
    }
  },
]