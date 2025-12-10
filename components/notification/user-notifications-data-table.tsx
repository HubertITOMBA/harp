"use client"

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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Search, Filter } from "lucide-react"
import { useState, useMemo } from "react"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  onMarkAsRead?: () => void
}

export function UserNotificationsDataTable<TData, TValue>({
  columns,
  data,
  onMarkAsRead,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})
  const [searchValue, setSearchValue] = useState("")
  const [statusFilter, setStatusFilter] = useState<'all' | 'read' | 'unread'>('all')

  // Enrichir les colonnes avec le callback onMarkAsRead pour la colonne actions
  const enrichedColumns = useMemo(() => {
    if (!onMarkAsRead) return columns
    return columns.map((col) => {
      if (col.id === 'actions') {
        return {
          ...col,
          cell: (context: any) => {
            const originalCell = col.cell
            if (typeof originalCell === 'function') {
              // Créer un nouveau contexte avec onMarkAsRead dans row.original
              const enrichedContext = {
                ...context,
                row: {
                  ...context.row,
                  original: {
                    ...context.row.original,
                    onMarkAsRead,
                  },
                },
              }
              return originalCell(enrichedContext)
            }
            return originalCell
          },
        }
      }
      return col
    })
  }, [columns, onMarkAsRead])

  // Filtrer les données par statut avant de les passer à la table
  const filteredData = useMemo(() => {
    if (statusFilter === 'all') {
      return data
    }
    return (data as any[]).filter((item) => {
      const recipients = item.recipients || []
      if (statusFilter === 'read') {
        const readCount = recipients.filter((r: any) => r.read).length
        const totalCount = recipients.length
        return readCount === totalCount && totalCount > 0
      } else if (statusFilter === 'unread') {
        return recipients.some((r: any) => !r.read)
      }
      return true
    })
  }, [data, statusFilter])

  const table = useReactTable({
    data: filteredData,
    columns: enrichedColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  })

  // Fonction pour filtrer par statut (lue/non lue)
  const filterByStatus = (status: 'all' | 'read' | 'unread') => {
    setStatusFilter(status)
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 py-2">
        {/* Barre de recherche */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Rechercher par titre ou message..."
              value={searchValue}
              onChange={(event) => {
                setSearchValue(event.target.value)
                // Filtrer sur titre et message
                const value = event.target.value
                table.getColumn("title")?.setFilterValue(value)
                table.getColumn("message")?.setFilterValue(value)
              }}
              className="pl-10 rounded-lg max-w-sm"
            />
          </div>
        </div>

        {/* Filtres et colonnes */}
        <div className="flex items-center gap-2">
          {/* Filtre par statut */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="rounded-lg p-2.5">
                <Filter className="h-4 w-4 mr-2" />
                Filtrer
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-white">
              <DropdownMenuCheckboxItem
                checked={statusFilter === 'all'}
                onCheckedChange={() => filterByStatus('all')}
              >
                Toutes
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={statusFilter === 'unread'}
                onCheckedChange={() => filterByStatus('unread')}
              >
                Non lues
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={statusFilter === 'read'}
                onCheckedChange={() => filterByStatus('read')}
              >
                Lues
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Sélection des colonnes */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="rounded-lg p-2.5">
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
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id === 'title' ? 'Titre' :
                       column.id === 'message' ? 'Message' :
                       column.id === 'creator' ? 'Créé par' :
                       column.id === 'createdAt' ? 'Date de création' :
                       column.id === 'recipients' ? 'Statut' :
                       column.id === 'actions' ? 'Actions' :
                       column.id}
                    </DropdownMenuCheckboxItem>
                  )
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-xl shadow-xl overflow-hidden">
        <Table className="min-w-full divide-y divide-gray-200">
          <TableHeader className="bg-gradient-to-r from-orange-500 to-orange-600">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead 
                      key={header.id} 
                      className="text-white bg-gradient-to-r from-orange-500 to-orange-600 text-center"
                    >
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
                  className="hover:bg-orange-50/50 transition-colors duration-200"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell 
                      key={cell.id}
                      className={cell.column.id === 'actions' ? 'text-center' : ''}
                    >
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

      {/* Pagination */}
      <div className="bg-white mt-3 flex flex-col sm:flex-row items-center justify-between py-3 font-semibold rounded-xl shadow-xl gap-3">
        <div className="ml-3 flex-1 text-xs text-muted-foreground">
          {table.getFilteredRowModel().rows.length} notification{table.getFilteredRowModel().rows.length > 1 ? "s" : ""} affichée{table.getFilteredRowModel().rows.length > 1 ? "s" : ""}
        </div>

        <div className="flex items-center space-x-6 lg:space-x-8">
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium">Lignes par page</p>
            <Select
              value={`${table.getState().pagination.pageSize}`}
              onValueChange={(value) => {
                table.setPageSize(Number(value))
              }}
            >
              <SelectTrigger className="h-8 w-[70px] rounded-lg">
                <SelectValue placeholder={table.getState().pagination.pageSize} />
              </SelectTrigger>
              <SelectContent side="top">
                {[10, 20, 30, 40, 50].map((pageSize) => (
                  <SelectItem key={pageSize} value={`${pageSize}`}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex w-[100px] items-center justify-center text-sm font-medium">
            Page {table.getState().pagination.pageIndex + 1} sur{" "}
            {table.getPageCount()}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Aller à la première page</span>
              <ChevronsLeft />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Page précédente</span>
              <ChevronLeft />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Page suivante</span>
              <ChevronRight />
            </Button>
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Aller à la dernière page</span>
              <ChevronsRight />
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}

