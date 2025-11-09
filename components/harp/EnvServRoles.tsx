'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import Image from 'next/image'
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Server, Network, Monitor, User, Globe, Tag, FileText, Activity, ArrowUpDown, Columns, Terminal } from 'lucide-react'
import { ExternalToolLauncher } from '@/components/ui/external-tool-launcher'

interface HarpPageProps {
  id: number
}

interface ServerDataItem {
  harpserve: {
    srv: string;
    ip: string;
    pshome: string;
    os: string;
    psuser: string | null;
    domain: string | null;
  } | null;
  typsrv: string | null;
  status: number | null;
  psadm_typsrv?: {
    descr: string;
  } | null;
  statutenv?: {
    statenv: string;
    descr: string | null;
    icone: string | null;
  } | null;
}

export default function HarpPage({ id }: HarpPageProps) {
  const [serverData, setServerData] = useState<ServerDataItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`/api/envserv/${id}`);
        const data = await response.json();
        setServerData(data);
      } catch (error) {
        console.error('Erreur lors de la récupération des données:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // Mémoriser les données filtrées pour éviter les recalculs
  const filteredData = useMemo(() => {
    return serverData.filter(item => item.harpserve !== null);
  }, [serverData]);

  // Mémoriser les colonnes pour éviter les recréations
  const columns: ColumnDef<ServerDataItem>[] = useMemo(() => [
    {
      id: 'srv',
      accessorFn: (row) => row.harpserve?.srv || '',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-6 text-xs sm:text-sm text-white hover:bg-white/20 p-0"
          >
            <Server className="h-3 w-3 mr-1" />
            Serveur
            <ArrowUpDown className="ml-1 h-3 w-3" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const srv = row.original.harpserve?.srv || '-';
        return (
          <div className="text-xs sm:text-sm font-medium text-gray-900">
            {srv}
          </div>
        );
      },
    },
    {
      id: 'ip',
      accessorFn: (row) => row.harpserve?.ip || '',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-6 text-xs sm:text-sm text-white hover:bg-white/20 p-0"
          >
            <Network className="h-3 w-3 mr-1" />
            IP
            <ArrowUpDown className="ml-1 h-3 w-3" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const ip = row.original.harpserve?.ip || '-';
        return (
          <div className="text-xs sm:text-sm text-gray-900 font-mono">
            {ip}
          </div>
        );
      },
    },
    {
      id: 'os',
      accessorFn: (row) => row.harpserve?.os || '',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-6 text-xs sm:text-sm text-white hover:bg-white/20 p-0"
          >
            <Monitor className="h-3 w-3 mr-1" />
            OS
            <ArrowUpDown className="ml-1 h-3 w-3" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const os = row.original.harpserve?.os || '-';
        return (
          <Badge variant="outline" className="text-[10px] py-0 px-1.5">
            {os}
          </Badge>
        );
      },
    },
    {
      id: 'psuser',
      accessorFn: (row) => row.harpserve?.psuser || '',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-6 text-xs sm:text-sm text-white hover:bg-white/20 p-0"
          >
            <User className="h-3 w-3 mr-1" />
            <span className="hidden sm:inline">PS User</span>
            <span className="sm:hidden">User</span>
            <ArrowUpDown className="ml-1 h-3 w-3" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const psuser = row.original.harpserve?.psuser || '-';
        return (
          <div className="text-xs sm:text-sm text-gray-900">
            {psuser}
          </div>
        );
      },
    },
    {
      id: 'domain',
      accessorFn: (row) => row.harpserve?.domain || '',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-6 text-xs sm:text-sm text-white hover:bg-white/20 p-0"
          >
            <Globe className="h-3 w-3 mr-1" />
            Domain
            <ArrowUpDown className="ml-1 h-3 w-3" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const domain = row.original.harpserve?.domain || '-';
        return (
          <div className="text-xs sm:text-sm text-gray-900">
            {domain}
          </div>
        );
      },
    },
    {
      id: 'typsrv',
      accessorKey: 'typsrv',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-6 text-xs sm:text-sm text-white hover:bg-white/20 p-0"
          >
            <Tag className="h-3 w-3 mr-1" />
            Type
            <ArrowUpDown className="ml-1 h-3 w-3" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const typsrv = row.original.typsrv || '-';
        return (
          <Badge className="bg-orange-500 text-white text-[10px] py-0 px-1.5">
            {typsrv}
          </Badge>
        );
      },
    },
    {
      id: 'descType',
      accessorFn: (row) => row.psadm_typsrv?.descr || '',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-6 text-xs sm:text-sm text-white hover:bg-white/20 p-0"
          >
            <FileText className="h-3 w-3 mr-1" />
            <span className="hidden sm:inline">Description Type</span>
            <span className="sm:hidden">Desc. Type</span>
            <ArrowUpDown className="ml-1 h-3 w-3" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const descr = row.original.psadm_typsrv?.descr || '-';
        return (
          <div 
            className="text-xs sm:text-sm text-gray-600 max-w-[150px] sm:max-w-[180px] truncate" 
            title={descr}
          >
            {descr}
          </div>
        );
      },
    },
    {
      id: 'descr',
      accessorFn: (row) => row.statutenv?.descr || '',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-6 text-xs sm:text-sm text-white hover:bg-white/20 p-0"
          >
            <FileText className="h-3 w-3 mr-1" />
            Description
            <ArrowUpDown className="ml-1 h-3 w-3" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const descr = row.original.statutenv?.descr || '-';
        return (
          <div 
            className="text-xs sm:text-sm text-gray-600 max-w-[150px] sm:max-w-[180px] truncate" 
            title={descr}
          >
            {descr}
          </div>
        );
      },
    },
    {
      id: 'status',
      accessorKey: 'status',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-6 text-xs sm:text-sm text-white hover:bg-white/20 p-0"
          >
            <Activity className="h-3 w-3 mr-1" />
            Status
            <ArrowUpDown className="ml-1 h-3 w-3" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const status = row.original.status;
        return (
          <div className="flex items-center gap-1">
            {status === 1 ? (
              <>
                <Image src="/ressources/OK.png" alt="Actif" width={14} height={14} className="bg-transparent" />
                <span className="text-[10px] text-green-600 hidden sm:inline">Actif</span>
              </>
            ) : (
              <>
                <Image src="/ressources/KO.png" alt="Inactif" width={14} height={14} className="bg-transparent" />
                <span className="text-[10px] text-red-600 hidden sm:inline">Inactif</span>
              </>
            )}
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: () => (
        <div className="flex items-center gap-1">
          <Terminal className="h-3 w-3" />
          Action
        </div>
      ),
      cell: ({ row }) => {
        const item = row.original;
        if (!item.harpserve) return null;
        
        return (
          <ExternalToolLauncher
            tool="putty"
            params={{
              host: item.harpserve.ip || item.harpserve.srv,
              port: 22,
            }}
            variant="outline"
            size="sm"
            className="h-6 w-6 p-0"
          >
            <Server className="h-4 w-4" />
          </ExternalToolLauncher>
        );
      },
      enableSorting: false,
    },
  ], []);

  // Callback pour gérer la visibilité des colonnes
  const handleColumnVisibilityChange = useCallback((updater: VisibilityState | ((old: VisibilityState) => VisibilityState)) => {
    setColumnVisibility(updater);
  }, []);

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: handleColumnVisibilityChange,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
    },
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="flex flex-col items-center gap-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          <p className="text-xs text-gray-500">Chargement des serveurs...</p>
        </div>
      </div>
    );
  }

  if (serverData.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 text-sm">
        Aucun serveur associé à cet environnement
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Barre d'outils */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-7 text-xs">
                <Columns className="h-3 w-3 mr-1" />
                Colonnes
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-white">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize text-xs"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id === 'srv' && 'Serveur'}
                      {column.id === 'ip' && 'IP'}
                      {column.id === 'os' && 'OS'}
                      {column.id === 'psuser' && 'PS User'}
                      {column.id === 'domain' && 'Domain'}
                      {column.id === 'typsrv' && 'Type'}
                      {column.id === 'descType' && 'Description Type'}
                      {column.id === 'descr' && 'Description'}
                      {column.id === 'status' && 'Status'}
                      {column.id === 'actions' && 'Action'}
                    </DropdownMenuCheckboxItem>
                  )
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="text-xs text-gray-500">
          {table.getFilteredRowModel().rows.length} serveur{table.getFilteredRowModel().rows.length > 1 ? 's' : ''}
        </div>
      </div>

      {/* Table */}
      <div className="w-full overflow-x-auto">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="bg-harpOrange hover:bg-harpOrange h-7">
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id} className="text-white bg-harpOrange text-center py-1 px-2">
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    )
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody className="divide-y divide-gray-200 bg-white">
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className="hover:bg-harpSkyLight transition-colors duration-200 h-7"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="py-1 px-2">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    Aucun résultat.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <p className="text-xs text-gray-500">
            Page {table.getState().pagination.pageIndex + 1} sur{' '}
            {table.getPageCount()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Précédent
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Suivant
          </Button>
        </div>
      </div>
    </div>
  )
}
