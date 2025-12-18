'use client'

import { ColumnDef } from '@tanstack/react-table'
import { ArrowUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { TaskActions } from '@/components/task/TaskActions'
import { Badge } from '@/components/ui/badge'

export type ListTask = {
  id: number
  title: string
  descr: string | null
  status: "EN_ATTENTE" | "EN_COURS" | "BLOQUE" | "TERMINE" | "SUCCES" | "ECHEC"
  date: Date | null
  estimatedDuration: number | null
  effectiveDuration: number | null
  createdAt: Date
  updatedAt: Date
  _count: {
    items: number
  }
}

const statusColors = {
  EN_ATTENTE: "bg-gray-500",
  EN_COURS: "bg-blue-500",
  BLOQUE: "bg-red-500",
  TERMINE: "bg-yellow-500",
  SUCCES: "bg-green-500",
  ECHEC: "bg-red-600",
};

const statusLabels = {
  EN_ATTENTE: "En attente",
  EN_COURS: "En cours",
  BLOQUE: "Bloqué",
  TERMINE: "Terminé",
  SUCCES: "Succès",
  ECHEC: "Échec",
};

const formatDuration = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${mins}min`;
};

export const columns: ColumnDef<ListTask>[] = [
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
    id: 'title',
    accessorKey: 'title',
    header: ({ column }) => {
      return (
        <Button
          variant='ghost'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-8 text-xs sm:text-sm"
        >
          Titre
          <ArrowUpDown className='ml-2 h-3 w-3' />
        </Button>
      )
    },
    cell: ({ row }) => {
      return <div className="font-semibold text-xs sm:text-sm">{row.getValue('title')}</div>
    }
  },
  {
    id: 'status',
    accessorKey: 'status',
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
      const status = row.getValue("status") as keyof typeof statusLabels;
      return (
        <Badge className={`${statusColors[status]} text-xs`}>
          {statusLabels[status]}
        </Badge>
      );
    },
  },
  {
    id: '_count.items',
    accessorKey: '_count.items',
    header: "Nb tâches",
    cell: ({ row }) => {
      const count = row.original._count.items;
      return <div className="text-xs sm:text-sm">{count}</div>;
    },
  },
  {
    id: 'date',
    accessorKey: 'date',
    header: ({ column }) => {
      return (
        <Button
          variant='ghost'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-8 text-xs sm:text-sm"
        >
          Date prévue
          <ArrowUpDown className='ml-2 h-3 w-3' />
        </Button>
      )
    },
    cell: ({ row }) => {
      const date = row.getValue("date") as Date | null;
      if (!date) return <div className="text-xs sm:text-sm text-gray-400">-</div>;
      return (
        <div className="text-xs sm:text-sm">
          {new Date(date).toLocaleDateString("fr-FR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })}
        </div>
      );
    },
  },
  {
    id: 'estimatedDuration',
    accessorKey: 'estimatedDuration',
    header: ({ column }) => {
      return (
        <Button
          variant='ghost'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-8 text-xs sm:text-sm"
        >
          Durée estimée
          <ArrowUpDown className='ml-2 h-3 w-3' />
        </Button>
      )
    },
    cell: ({ row }) => {
      const duration = row.getValue("estimatedDuration") as number | null;
      if (!duration) return <div className="text-xs sm:text-sm text-gray-400">-</div>;
      return <div className="text-xs sm:text-sm">{formatDuration(duration)}</div>;
    },
  },
  {
    id: 'effectiveDuration',
    accessorKey: 'effectiveDuration',
    header: ({ column }) => {
      return (
        <Button
          variant='ghost'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-8 text-xs sm:text-sm"
        >
          Durée effective
          <ArrowUpDown className='ml-2 h-3 w-3' />
        </Button>
      )
    },
    cell: ({ row }) => {
      const duration = row.getValue("effectiveDuration") as number | null;
      if (!duration) return <div className="text-xs sm:text-sm text-gray-400">-</div>;
      return <div className="text-xs sm:text-sm font-medium">{formatDuration(duration)}</div>;
    },
  },
  {
    id: 'actions',
    header: () => <div className="text-center">Actions</div>,
    cell: ({ row }) => {
      const task = row.original
      return <TaskActions task={task} />
    },
  },
]
