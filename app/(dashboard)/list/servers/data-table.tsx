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
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Search } from "lucide-react"
import { useState } from "react"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
}

export function DataTable<TData, TValue>({
  columns,
  data,
}: DataTableProps<TData, TValue>) {

    const [sorting, setSorting] = useState<SortingState>([]) 
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]) ;
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
    const [rowSelection, setRowSelection] = useState({});
    const [globalFilter, setGlobalFilter] = useState("");

  const table = useReactTable({
    data,
    columns,
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

  return (
    <>
     <div className="flex items-center justify-between text-gray-500 font-semibold py-2">
     <div className="flex items-center gap-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Rechercher par serveur, IP, PS Home, OS, Domain, PS User..."
            value={globalFilter}
            onChange={(event) => {
              const value = event.target.value;
              setGlobalFilter(value);
              // Filtrer sur toutes les colonnes pertinentes
              table.getColumn("srv")?.setFilterValue(value);
              table.getColumn("ip")?.setFilterValue(value);
              table.getColumn("pshome")?.setFilterValue(value);
              table.getColumn("os")?.setFilterValue(value);
              table.getColumn("domain")?.setFilterValue(value);
              table.getColumn("psuser")?.setFilterValue(value);
            }}
            className="pl-10 rounded-lg max-w-sm h-8 text-xs"
          />
        </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="rounded-lg ml-auto p-2 h-8 text-xs">
              Colonnes
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-harpSkyLight">
            {table
              .getAllColumns()
              .filter(
                (column) => column.getCanHide()
              )
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
                    {column.id}
                  </DropdownMenuCheckboxItem>
                )
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <Table className="min-w-full divide-y divide-gray-200">
        <TableHeader className="bg-harpOrange text-white text-center text-xs font-bold">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="h-7">
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead key={header.id} className="text-white bg-harpOrange text-center py-1">
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
                  <TableCell key={cell.id} className="py-1 text-xs">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-16 text-center text-xs">
                Aucun resultat.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>

    {/* <div className="flex items-center justify-end space-x-2 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Précédent
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Suivant
        </Button>
    </div> */}

<div className="bg-white mt-2 flex items-center justify-between py-2 font-semibold rounded-lg shadow-md">
          <div className="ml-3 flex-1 text-xs text-muted-foreground">
            {table.getFilteredSelectedRowModel().rows.length} sur {" "}
            {table.getFilteredRowModel().rows.length} ligne(s) selectionée(s).
          </div>

      <div className="flex items-center space-x-6 lg:space-x-8 ">
            <div className="flex items-center space-x-2">
              <p className="text-xs font-medium">Lignes par page</p>
              <Select
                value={`${table.getState().pagination.pageSize}`}
                onValueChange={(value) => {
                  table.setPageSize(Number(value))
                }}
              >
                <SelectTrigger className="h-7 w-[70px] text-xs">
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
     
        <div className="flex w-[100px] items-center justify-center text-xs font-medium">
          Page {table.getState().pagination.pageIndex + 1} sur {" "}
          {table.getPageCount()}
        </div>
          <div className="flex items-center space-x-1">
            <Button
                variant="outline"
                className="hidden h-7 w-7 p-0 lg:flex"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
            >
                <span className="sr-only">Go to first page</span>
                <ChevronsLeft className="h-3 w-3" />
            </Button>
            <Button
                variant="outline"
                className="h-7 w-7 p-0"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
            >
                <span className="sr-only">Go to previous page</span>
                <ChevronLeft className="h-3 w-3" />
            </Button>
            <Button
                variant="outline"
                className="h-7 w-7 p-0"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
            >
                <span className="sr-only">Go to next page</span>
                <ChevronRight className="h-3 w-3" />
            </Button>
            <Button
                variant="outline"
                className="hidden h-7 w-7 p-0 lg:flex"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
            >
                <span className="sr-only">Go to last page</span>
                <ChevronsRight className="h-3 w-3" />
            </Button>
          </div>
 <div> 

      </div>
    </div> 
    </div> 

    </>
  )
}
