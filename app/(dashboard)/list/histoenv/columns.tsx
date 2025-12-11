'use client'

import { ColumnDef } from '@tanstack/react-table'
import { ArrowUpDown, Eye, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { deleteHistoryEntry } from '@/actions/delete-history-entry'
import { useRouter } from 'next/navigation'
import { toast } from 'react-toastify'
import { ActionsDropdown, ActionItem } from '@/components/ui/actions-dropdown'

export type StatusEnv = {
  env: string
  statenvId: number
  statenv: string
  fromdate: Date
  msg: string | null
  icone: string | null
}



export const columns: ColumnDef<StatusEnv>[] = [
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
    id: 'icone',
    header: '',
    cell: ({ row }) => {
      const icone = row.original.icone
      return icone ? (
        <img 
          src={`/ressources/${icone}`} 
          alt="" 
          width={20} 
          height={20} 
          className="items-end bg-transparent" 
        />
      ) : (
        <img 
          src={`/ressources/special.png`} 
          alt="" 
          width={20} 
          height={20} 
          className="items-end bg-transparent" 
        />
      )
    }
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
 

// {
//   accessorKey: 'statenv',
//   header: 'statenv'
// },
// {
//   accessorKey: 'statenvId',
//   header: 'statenvId'
// },
// {
//   accessorKey:  'fromdate',
//   header: 'fromdate'
// },

{
  accessorKey: 'statenv',
  header: 'Statut',
  cell: ({ row }) => {
    return <div className="text-sm">{row.original.statenv}</div>
  }
},
{
  accessorKey: 'msg',
  header: 'Message'
},
{
  accessorKey: 'fromdate',
  header: ({ column }) => {
    return (
      <Button
        variant='ghost'
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Date
        <ArrowUpDown className='ml-2 h-4 w-4' />
      </Button>
    )
  },
  cell: ({ row }) => {
    const fromdate = row.getValue('fromdate') as Date
    return (
      <div className="">
        {new Intl.DateTimeFormat("fr-FR", {
          dateStyle: 'short',
          timeStyle: 'short',
        }).format(fromdate)}
      </div>
    )
  }
  
},
// {
//   accessorKey: 'statutenv.icone',
//   header: 'Icône'
// },
// ,
// {
//   accessorKey: 'statutenv.id',
//   header: 'Icône'
// },

 {
    id: 'actions',
    header: () => <div className="text-center">Actions</div>,
    cell: ({ row }) => {
      const entry = row.original

      return (
        <div className="flex justify-center">
          <HistoryActions entry={entry} />
        </div>
      )
    }
  }
]

function HistoryActions({ entry }: { entry: StatusEnv }) {
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer l'entrée d'historique pour ${entry.env} du ${new Intl.DateTimeFormat("fr-FR", {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(entry.fromdate)} ?`)) {
      return;
    }

    const result = await deleteHistoryEntry(entry.env, entry.fromdate);
    
    if (result.success) {
      toast.success(result.message);
      router.refresh();
    } else {
      toast.error(result.error || "Erreur lors de la suppression");
    }
  };

  const actions: ActionItem[] = [
    {
      label: "Voir",
      icon: <Eye className="h-4 w-4" />,
      onClick: () => router.push(`/list/histoenv/${encodeURIComponent(entry.env)}/${encodeURIComponent(entry.fromdate.toISOString())}`),
    },
    {
      label: "Supprimer",
      icon: <Trash2 className="h-4 w-4" />,
      onClick: handleDelete,
      variant: "destructive",
    },
  ];

  return <ActionsDropdown actions={actions} />;
}