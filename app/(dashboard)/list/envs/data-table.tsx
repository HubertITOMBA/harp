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
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
DropdownMenu,
DropdownMenuCheckboxItem,
DropdownMenuContent,
DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";  
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Search } from "lucide-react"
import { useState, useMemo, useEffect } from "react"
import React from "react"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  onVisibleColumnsChange?: (visibleColumns: string[]) => void;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  onVisibleColumnsChange,
}: DataTableProps<TData, TValue>) {

    const [sorting, setSorting] = useState<SortingState>([]) 
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]) ;
    // Masquer par défaut les colonnes non demandées (aliasql, oraschema, psversion)
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
      aliasql: false,
      oraschema: false,
      psversion: false,
    });

    const [rowSelection, setRowSelection] = useState({});
    const [globalFilter, setGlobalFilter] = useState("");

  // Filtrer les données avec recherche globale (OU logique)
  const filteredData = useMemo(() => {
    if (!globalFilter.trim()) return data;
    
    const searchValue = globalFilter.toLowerCase();
    return data.filter((row: any) => {
      const env = String(row.env || '').toLowerCase();
      const server = String(row.server || '').toLowerCase();
      const harprelease = String(row.harprelease || '').toLowerCase();
      const ptversion = String(row.ptversion || '').toLowerCase();
      const descr = String(row.harpora?.descr || '').toLowerCase();
      const orarelease = String(row.harpora?.orarelease || '').toLowerCase();
      
      return (
        env.includes(searchValue) ||
        server.includes(searchValue) ||
        harprelease.includes(searchValue) ||
        ptversion.includes(searchValue) ||
        descr.includes(searchValue) ||
        orarelease.includes(searchValue)
      );
    });
  }, [data, globalFilter]);

  const table = useReactTable({
    data: filteredData,
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

  // Notifier les colonnes visibles quand elles changent
  React.useEffect(() => {
    if (onVisibleColumnsChange) {
      const allColumns = table.getVisibleLeafColumns();
      
      // Debug: afficher toutes les colonnes visibles avec leurs IDs et accessorKeys
      const allColumnsDebug = allColumns.map(col => ({
        id: col.id,
        accessorKey: (col.columnDef as any).accessorKey,
        header: typeof (col.columnDef as any).header === 'function' ? 'function' : (col.columnDef as any).header
      }));
      console.log('Toutes les colonnes visibles (détaillé):', JSON.stringify(allColumnsDebug, null, 2));
      
      const visibleColumns = allColumns
        .map(col => {
          // Utiliser l'ID explicite s'il existe, sinon utiliser l'accessorKey
          const columnId = col.id || (col.columnDef as any).accessorKey;
          return columnId;
        })
        .filter((id): id is string => {
          // Filtrer les colonnes système et les valeurs nulles/undefined
          return !!id && id !== 'select' && id !== 'icone' && id !== 'actions';
        });
      
      // Debug: afficher les colonnes visibles filtrées avec détails
      console.log('Colonnes visibles filtrées (IDs):', visibleColumns);
      console.log('Mapping disponible:', Object.keys({
        'env': true,
        'harpora.descr': true,
        'harpora.orarelease': true,
        'ptversion': true,
        'harprelease': true,
        'server': true,
        'anonym': true,
        'edi': true,
        'aliasql': true,
        'oraschema': true,
        'psversion': true,
      }));
      
      onVisibleColumnsChange(visibleColumns);
    }
  }, [columnVisibility, onVisibleColumnsChange, table]);

  return (
    <>
     <div className="flex items-center justify-between text-gray-500 font-semibold">
     <div className="flex items-center py-4 ">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Rechercher par Base, Description, Serveur, Release, Ptools, Ora Release..."
            value={globalFilter}
            onChange={(event) => {
              setGlobalFilter(event.target.value);
            }}
            className="pl-10 rounded-lg max-w-sm h-8 text-xs"
          />
        </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="rounded-lg ml-auto p-2.5">
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

    <div className=" bg-white rounded-xl shadow-xl overflow-hidden">
      <Table className="min-w-full divide-y divide-gray-200">
        <TableHeader className="bg-harpOrange text-white text-center text-xs sm:text-sm font-bold">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="h-7">
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead key={header.id} className="text-white bg-harpOrange text-center py-0.5">
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
                  <TableCell key={cell.id} className="py-0.5">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
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

<div className="bg-white mt-5 flex items-center justify-between py-5 font-semibold rounded-xl shadow-xl">
          <div className="ml-5 mt-2 flex-1 text-sm text-muted-foreground">
            {table.getFilteredSelectedRowModel().rows.length} sur {" "}
            {table.getFilteredRowModel().rows.length} ligne(s) selectionée(s).
          </div>

      <div className="flex items-center space-x-6 lg:space-x-8 ">
            <div className="flex items-center space-x-2">
              <p className="text-sm font-medium ">Lignes par page</p>
              <Select
                value={`${table.getState().pagination.pageSize}`}
                onValueChange={(value) => {
                  table.setPageSize(Number(value))
                }}
              >
                <SelectTrigger className="h-8 w-[70px] rounded-">
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
          Page {table.getState().pagination.pageIndex + 1} sur {" "}
          {table.getPageCount()}
        </div>
          <div className="flex items-center space-x-2 ">
            <Button
                variant="outline"
                className="hidden h-8 w-8 p-0 lg:flex"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
            >
                <span className="sr-only">Go to first page</span>
                <ChevronsLeft />
            </Button>
            <Button
                variant="outline"
                className="h-8 w-8 p-0"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
            >
                <span className="sr-only">Go to previous page</span>
                <ChevronLeft />
            </Button>
            <Button
                variant="outline"
                className="h-8 w-8 p-0"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
            >
                <span className="sr-only">Go to next page</span>
                <ChevronRight />
            </Button>
            <Button
                variant="outline"
                className="hidden h-8 w-8 p-0 lg:flex"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
            >
                <span className="sr-only">Go to last page</span>
                <ChevronsRight />
            </Button>
          </div>
 <div> 

      </div>
    </div> 
    </div> 

    </>
  )
}
