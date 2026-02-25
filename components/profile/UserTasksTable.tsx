"use client";

import { useState, useMemo } from 'react';
import {
  ColumnDef,
  SortingState,
  ColumnSizingState,
  ColumnFiltersState,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  useReactTable,
  flexRender,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Pencil, ArrowUpDown, Maximize2, Minimize2, Search, Filter, FileText, Eye } from "lucide-react";
import { EditUserTaskDialog } from "./EditUserTaskDialog";
import { TaskDescriptionDialog } from "./TaskDescriptionDialog";
import { ViewUserTaskDialog } from "./ViewUserTaskDialog";
import { toast } from 'react-toastify';

interface Task {
  id: number;
  order: number;
  startDate: Date | string | null;
  endDate: Date | string | null;
  status: "EN_ATTENTE" | "EN_COURS" | "BLOQUE" | "TERMINE" | "SUCCES" | "ECHEC";
  comment: string | null;
  task: {
    id: number;
    title: string;
    status: string;
  };
  harpitem: {
    id: number;
    descr: string;
  } | null;
  predecessor: {
    id: number;
    order: number;
    harpitem: {
      descr: string;
    } | null;
  } | null;
}

interface UserTasksTableProps {
  tasks: Task[];
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

const formatDateTime = (date: Date | string | null | undefined): string => {
  if (!date) return "N/A";
  return new Date(date).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatElapsedTime = (startDate: Date | string | null | undefined, endDate: Date | string | null | undefined): string => {
  if (!startDate || !endDate) return "N/A";
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffMs = end.getTime() - start.getTime();
  if (diffMs < 0) return "N/A";
  const diffMinutes = Math.round(diffMs / (1000 * 60));
  if (diffMinutes < 60) {
    return `${diffMinutes} min`;
  }
  const hours = Math.floor(diffMinutes / 60);
  const minutes = diffMinutes % 60;
  if (minutes === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${minutes}min`;
};

/**
 * Tableau affichant les tâches de l'utilisateur avec possibilité de modification et tri
 */
const truncate = (str: string | null | undefined, maxLen: number): string => {
  if (!str) return "—";
  return str.length <= maxLen ? str : str.slice(0, maxLen) + "…";
};

export function UserTasksTable({ tasks }: UserTasksTableProps) {
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [viewTaskId, setViewTaskId] = useState<number | null>(null);
  const [descriptionTaskId, setDescriptionTaskId] = useState<number | null>(null);
  const [tasksList, setTasksList] = useState(tasks);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>({});
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState<string>("");
  const [rowHeight, setRowHeight] = useState<number>(28); // Hauteur par défaut en px (h-7 = 28px)

  const handleTaskUpdated = (updatedTask: Task) => {
    setTasksList(prevTasks => 
      prevTasks.map(task => task.id === updatedTask.id ? updatedTask : task)
    );
    setEditingTaskId(null);
    toast.success("Tâche mise à jour avec succès");
  };

  // Définir les colonnes avec tri et redimensionnement
  const columns = useMemo<ColumnDef<Task>[]>(() => [
    {
      id: 'order',
      accessorKey: 'order',
      size: 60,
      minSize: 50,
      maxSize: 100,
      enableResizing: true,
      header: ({ column }) => {
        return (
          <Button
            variant='ghost'
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-6 text-white hover:bg-orange-600/80 text-xs sm:text-sm font-semibold"
          >
            Ordre
            <ArrowUpDown className='ml-1 h-3 w-3' />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="font-medium text-xs sm:text-sm">{row.getValue('order')}</div>
      ),
    },
    {
      id: 'taskTitle',
      accessorFn: (row) => `${row.task.title} ${row.task.id}`,
      size: 200,
      minSize: 150,
      maxSize: 400,
      enableResizing: true,
      header: ({ column }) => {
        return (
          <Button
            variant='ghost'
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-6 text-white hover:bg-orange-600/80 text-xs sm:text-sm font-semibold"
          >
            Chrono-tâche
            <ArrowUpDown className='ml-1 h-3 w-3' />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="text-xs sm:text-sm">
          <div className="font-medium text-gray-900">{row.original.task.title}</div>
          <div className="text-xs text-gray-500">ID: {row.original.task.id}</div>
        </div>
      ),
    },
    {
      id: 'taskDescr',
      accessorFn: (row) => row.harpitem?.descr || '',
      size: 250,
      minSize: 150,
      maxSize: 500,
      enableResizing: true,
      header: ({ column }) => {
        return (
          <Button
            variant='ghost'
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-6 text-white hover:bg-orange-600/80 text-xs sm:text-sm font-semibold"
          >
            Tâche
            <ArrowUpDown className='ml-1 h-3 w-3' />
          </Button>
        );
      },
      cell: ({ row }) => {
        const descr = row.original.harpitem?.descr;
        return (
          <div className="flex items-center gap-1">
            <span className="text-xs sm:text-sm flex-1 min-w-0">{truncate(descr, 60) || "N/A"}</span>
            {descr && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDescriptionTaskId(row.original.id)}
                className="h-6 w-6 p-0 shrink-0 text-orange-600 hover:bg-orange-100"
                title="Lire la description complète"
              >
                <FileText className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        );
      },
    },
    {
      id: 'startDate',
      accessorKey: 'startDate',
      size: 150,
      minSize: 120,
      maxSize: 250,
      enableResizing: true,
      header: ({ column }) => {
        return (
          <Button
            variant='ghost'
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-6 text-white hover:bg-orange-600/80 text-xs sm:text-sm font-semibold"
          >
            Date début
            <ArrowUpDown className='ml-1 h-3 w-3' />
          </Button>
        );
      },
      cell: ({ row }) => {
        const date = row.getValue('startDate') as Date | string | null;
        return <div className="text-xs sm:text-sm">{formatDateTime(date)}</div>;
      },
      sortingFn: (rowA, rowB) => {
        const dateA = rowA.original.startDate ? new Date(rowA.original.startDate).getTime() : 0;
        const dateB = rowB.original.startDate ? new Date(rowB.original.startDate).getTime() : 0;
        return dateA - dateB;
      },
    },
    {
      id: 'endDate',
      accessorKey: 'endDate',
      size: 150,
      minSize: 120,
      maxSize: 250,
      enableResizing: true,
      header: ({ column }) => {
        return (
          <Button
            variant='ghost'
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-6 text-white hover:bg-orange-600/80 text-xs sm:text-sm font-semibold"
          >
            Date fin
            <ArrowUpDown className='ml-1 h-3 w-3' />
          </Button>
        );
      },
      cell: ({ row }) => {
        const date = row.getValue('endDate') as Date | string | null;
        return <div className="text-xs sm:text-sm">{formatDateTime(date)}</div>;
      },
      sortingFn: (rowA, rowB) => {
        const dateA = rowA.original.endDate ? new Date(rowA.original.endDate).getTime() : 0;
        const dateB = rowB.original.endDate ? new Date(rowB.original.endDate).getTime() : 0;
        return dateA - dateB;
      },
    },
    {
      id: 'elapsedTime',
      accessorFn: (row) => {
        if (!row.startDate || !row.endDate) return 0;
        const start = new Date(row.startDate).getTime();
        const end = new Date(row.endDate).getTime();
        return end - start;
      },
      size: 120,
      minSize: 100,
      maxSize: 200,
      enableResizing: true,
      header: ({ column }) => {
        return (
          <Button
            variant='ghost'
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-6 text-white hover:bg-orange-600/80 text-xs sm:text-sm font-semibold"
          >
            Temps écoulé
            <ArrowUpDown className='ml-1 h-3 w-3' />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="text-xs sm:text-sm">
          {formatElapsedTime(row.original.startDate, row.original.endDate)}
        </div>
      ),
    },
    {
      id: 'status',
      accessorKey: 'status',
      size: 120,
      minSize: 100,
      maxSize: 180,
      enableResizing: true,
      filterFn: (row, id, value) => {
        return value === "all" || row.getValue(id) === value;
      },
      header: ({ column }) => {
        return (
          <Button
            variant='ghost'
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-6 text-white hover:bg-orange-600/80 text-xs sm:text-sm font-semibold"
          >
            Statut
            <ArrowUpDown className='ml-1 h-3 w-3' />
          </Button>
        );
      },
      cell: ({ row }) => {
        const status = row.getValue('status') as Task["status"];
        return (
          <Badge className={`${statusColors[status]} text-white text-xs`}>
            {statusLabels[status]}
          </Badge>
        );
      },
    },
    {
      id: 'actions',
      size: 100,
      minSize: 90,
      maxSize: 120,
      enableResizing: false,
      header: () => <div className="text-center text-xs sm:text-sm font-semibold text-white">Actions</div>,
      cell: ({ row }) => (
        <div className="flex items-center justify-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewTaskId(row.original.id)}
            className="h-7 w-7 p-0 hover:bg-orange-100"
            title="Voir les détails"
          >
            <Eye className="h-3.5 w-3.5 text-orange-600" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setEditingTaskId(row.original.id)}
            className="h-7 w-7 p-0 hover:bg-orange-100"
            title="Modifier la tâche"
          >
            <Pencil className="h-3.5 w-3.5 text-orange-600" />
          </Button>
        </div>
      ),
      enableSorting: false,
    },
  ], []);

  // Fonction de filtrage globale personnalisée
  const globalFilterFn = (row: any, columnId: string, filterValue: string) => {
    const searchValue = filterValue.toLowerCase();
    if (!searchValue) return true;

    const task = row.original;
    const searchableText = [
      task.order?.toString() || '',
      task.task?.title || '',
      task.task?.id?.toString() || '',
      task.harpitem?.descr || '',
      formatDateTime(task.startDate).toLowerCase(),
      formatDateTime(task.endDate).toLowerCase(),
      formatElapsedTime(task.startDate, task.endDate).toLowerCase(),
      statusLabels[task.status]?.toLowerCase() || '',
      task.comment?.toLowerCase() || '',
    ].join(' ').toLowerCase();

    return searchableText.includes(searchValue);
  };

  const table = useReactTable({
    data: tasksList,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnSizingChange: setColumnSizing,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: globalFilterFn,
    columnResizeMode: 'onChange',
    enableColumnResizing: true,
    state: {
      sorting,
      columnSizing,
      columnFilters,
      globalFilter,
    },
    defaultColumn: {
      minSize: 50,
      maxSize: 500,
      size: 150,
    },
  });

  return (
    <div className="space-y-2">
      {/* Barre de recherche et filtres */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 bg-gray-50 rounded-md border border-gray-200">
        {/* Recherche globale */}
        <div className="flex-1 w-full sm:w-auto">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Rechercher dans toutes les colonnes..."
              value={globalFilter ?? ""}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="pl-8 w-full sm:w-auto max-w-sm border-gray-300 focus:border-orange-500 focus:ring-orange-500"
            />
          </div>
        </div>

        {/* Filtre par statut */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <Select
            value={(table.getColumn("status")?.getFilterValue() as string) ?? "all"}
            onValueChange={(value) => {
              if (value === "all") {
                table.getColumn("status")?.setFilterValue(undefined);
              } else {
                table.getColumn("status")?.setFilterValue(value);
              }
            }}
          >
            <SelectTrigger className="w-[180px] border-gray-300 focus:border-orange-500 focus:ring-orange-500">
              <SelectValue placeholder="Filtrer par statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              {Object.entries(statusLabels).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Bouton pour réinitialiser les filtres */}
        {(globalFilter || table.getColumn("status")?.getFilterValue()) && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setGlobalFilter("");
              table.getColumn("status")?.setFilterValue(undefined);
            }}
            className="text-xs"
          >
            Réinitialiser
          </Button>
        )}

        {/* Compteur de résultats */}
        <div className="text-xs text-gray-600 whitespace-nowrap">
          {table.getFilteredRowModel().rows.length} / {tasks.length} tâche{table.getFilteredRowModel().rows.length > 1 ? "s" : ""}
        </div>
      </div>

      {/* Contrôles de redimensionnement */}
      <div className="flex items-center justify-between gap-4 p-2 bg-gray-50 rounded-md border border-gray-200">
        <div className="flex items-center gap-2">
          <Label className="text-xs font-semibold text-gray-700 whitespace-nowrap">
            Hauteur des lignes:
          </Label>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRowHeight(Math.max(20, rowHeight - 4))}
              className="h-7 w-7 p-0"
              title="Réduire la hauteur"
            >
              <Minimize2 className="h-3 w-3" />
            </Button>
            <input
              type="range"
              min="20"
              max="60"
              value={rowHeight}
              onChange={(e) => setRowHeight(Number(e.target.value))}
              className="w-24 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRowHeight(Math.min(60, rowHeight + 4))}
              className="h-7 w-7 p-0"
              title="Augmenter la hauteur"
            >
              <Maximize2 className="h-3 w-3" />
            </Button>
            <span className="text-xs text-gray-600 min-w-[3rem]">
              {rowHeight}px
            </span>
          </div>
        </div>
        <div className="text-xs text-gray-500">
          Glissez les bordures des colonnes pour les redimensionner
        </div>
      </div>

      <div className="rounded-md border border-gray-200 overflow-hidden">
        <Table>
        <TableHeader className="bg-gradient-to-r from-orange-500 to-orange-600">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow 
              key={headerGroup.id} 
              className="hover:bg-transparent"
              style={{ height: `${rowHeight}px` }}
            >
              {headerGroup.headers.map((header) => (
                <TableHead 
                  key={header.id} 
                  className="text-white px-2 relative"
                  style={{ 
                    width: header.getSize(),
                    height: `${rowHeight}px`,
                    paddingTop: `${Math.max(2, rowHeight / 8)}px`,
                    paddingBottom: `${Math.max(2, rowHeight / 8)}px`,
                  }}
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                  {header.column.getCanResize() && (
                    <div
                      onMouseDown={header.getResizeHandler()}
                      onTouchStart={header.getResizeHandler()}
                      className={`absolute right-0 top-0 h-full w-1 bg-orange-400/50 cursor-col-resize select-none touch-none hover:bg-orange-300 ${
                        header.column.getIsResizing() ? 'bg-orange-300' : ''
                      }`}
                    />
                  )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                className="hover:bg-orange-50/50 transition-colors"
                style={{ height: `${rowHeight}px` }}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell 
                    key={cell.id} 
                    className="px-2 text-xs sm:text-sm"
                    style={{ 
                      width: cell.column.getSize(),
                      height: `${rowHeight}px`,
                      paddingTop: `${Math.max(2, rowHeight / 8)}px`,
                      paddingBottom: `${Math.max(2, rowHeight / 8)}px`,
                    }}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={8} className="h-24 text-center">
                Aucune tâche trouvée.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
        </Table>
      </div>

      {/* Dialog description complète (depuis le bouton dans la colonne Tâche) */}
      {descriptionTaskId && (
        <TaskDescriptionDialog
          task={tasksList.find(t => t.id === descriptionTaskId)!}
          open={descriptionTaskId !== null}
          onOpenChange={(open) => {
            if (!open) setDescriptionTaskId(null);
          }}
        />
      )}

      {/* Dialog Voir (détails complets) */}
      {viewTaskId && (
        <ViewUserTaskDialog
          task={tasksList.find(t => t.id === viewTaskId)!}
          open={viewTaskId !== null}
          onOpenChange={(open) => {
            if (!open) setViewTaskId(null);
          }}
        />
      )}

      {/* Dialog de modification */}
      {editingTaskId && (
        <EditUserTaskDialog
          task={tasksList.find(t => t.id === editingTaskId)!}
          open={editingTaskId !== null}
          onOpenChange={(open) => {
            if (!open) setEditingTaskId(null);
          }}
          onTaskUpdated={handleTaskUpdated}
        />
      )}
    </div>
  );
}

