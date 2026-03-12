"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  ColumnDef,
  Row,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import type { SortingState } from "@tanstack/react-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowDown, ArrowUp, ArrowUpDown, Search, Server, ExternalLink, FolderOpen, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "react-toastify";
import { PuttyLink } from "@/components/harp/PuttyLink";

export type RechercheRow = {
  typsrv: string | null;
  env: string;
  typenv: string | null;
  typenvIdForUrl: number | null;
  srv: string;
  site: string | null;
  url: string | null;
  oraschema: string | null;
  ip: string;
};

interface RechercheTableProps {
  data: RechercheRow[];
}

export function RechercheTable({ data }: RechercheTableProps) {
  const [globalFilter, setGlobalFilter] = useState("");
  const [columnFilters, setColumnFilters] = useState<{ id: string; value: string }[]>([]);
  const [sorting, setSorting] = useState<SortingState>([]);

  const handleEnvClick = (url: string | null, env: string) => {
    if (!url?.trim()) {
      toast.warning(`Aucune URL pour l'environnement ${env}.`);
      return;
    }
    window.open(url.trim(), "_blank", "noopener,noreferrer");
  };

  const typenvHref = (typenvIdForUrl: number | null) =>
    typenvIdForUrl != null ? `/harp/envs/${typenvIdForUrl}` : null;

  const columns = useMemo<ColumnDef<RechercheRow>[]>(
    () => [
      {
        accessorKey: "typsrv",
        header: "Type serveur",
        cell: ({ getValue }) => (
          <span className="font-mono text-xs">{getValue() as string ?? "—"}</span>
        ),
      },
      {
        accessorKey: "env",
        header: "Environnement",
        cell: ({ row }) => {
          const url = row.original.url;
          const env = row.original.env;
          return (
            <button
              type="button"
              className="text-orange-600 hover:text-orange-800 hover:underline font-medium text-xs inline-flex items-center gap-1"
              onClick={() => handleEnvClick(url, env)}
              title={url ? `Ouvrir : ${url}` : "Pas d'URL"}
            >
              {env}
              <ExternalLink className="h-3 w-3" />
            </button>
          );
        },
      },
      {
        accessorKey: "typenv",
        header: "Type d'environnement",
        cell: ({ row }) => {
          const typenv = row.original.typenv;
          const typenvIdForUrl = row.original.typenvIdForUrl;
          const href = typenvHref(typenvIdForUrl);
          if (href) {
            return (
              <Link
                href={href}
                className="text-orange-600 hover:text-orange-800 hover:underline font-medium text-xs inline-flex items-center gap-1"
                title={`Ouvrir /harp/envs/${typenvIdForUrl}`}
              >
                {typenv ?? "—"}
                <FolderOpen className="h-3 w-3" />
              </Link>
            );
          }
          return (
            <span
              className="text-gray-500 font-medium text-xs inline-flex items-center gap-1 cursor-default"
              title="Type d'environnement non lié (typenvid manquant)"
            >
              {typenv ?? "—"}
              <FolderOpen className="h-3 w-3 opacity-50" />
            </span>
          );
        },
      },
      {
        accessorKey: "srv",
        header: "Serveur",
        cell: ({ row }) => {
          const ip = row.original.ip;
          const srv = row.original.srv;
          return (
            <PuttyLink
              host={srv || ip}
              ip={ip}
              className="text-orange-600 hover:text-orange-800 hover:underline font-mono text-xs inline-flex items-center gap-1"
            >
              {srv}
              <Server className="h-3 w-3" />
            </PuttyLink>
          );
        },
      },
      {
        accessorKey: "site",
        header: "Site",
        cell: ({ getValue }) => (
          <span className="text-xs">{String(getValue() ?? "—")}</span>
        ),
      },
    ],
    []
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onColumnFiltersChange: (updater) => {
      const next = typeof updater === "function" ? updater(columnFilters) : columnFilters;
      setColumnFilters(next);
    },
    globalFilterFn: (row: Row<RechercheRow>, _columnId: string, filterValue: string) => {
      if (!filterValue || String(filterValue).trim() === "") return true;
      const q = String(filterValue).toLowerCase().trim();
      const r = row.original;
      return [r.typsrv, r.env, r.typenv, r.srv, r.site]
        .filter(Boolean)
        .some((val) => String(val).toLowerCase().includes(q));
    },
    state: { sorting, globalFilter, columnFilters },
  });

  return (
    <div className="max-w-6xl mx-auto space-y-3">
      <div className="space-y-0.5">
        <h1 className="text-lg sm:text-xl font-bold text-gray-900">
          Recherche <span className="text-orange-600">environnements / serveurs</span>
        </h1>
        <p className="text-[11px] sm:text-xs text-gray-600">
          Cliquez sur <strong>env</strong> pour ouvrir l&apos;URL, sur <strong>typenv</strong> pour la fiche type d&apos;environnement, sur <strong>srv</strong> pour la connexion SSH / Putty (IP).
        </p>
      </div>

      <Card className="shadow-sm border border-orange-100 bg-white/90 backdrop-blur-sm">
        <CardHeader className="pb-1.5 pt-2 px-2.5">
          <CardTitle className="text-xs font-semibold text-gray-800 flex items-center gap-1.5">
            <Search className="h-3.5 w-3.5 text-orange-600" />
            Recherche et filtres
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 px-2.5 pb-2.5">
          <div className="flex items-center gap-2 flex-wrap">
            <Input
              placeholder="Rechercher dans type serveur, environnement, type d'env, serveur, site..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="h-8 text-xs max-w-md flex-1 min-w-[200px]"
            />
            {(globalFilter || columnFilters.some((f) => f.value)) && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 text-xs shrink-0"
                onClick={() => {
                  setGlobalFilter("");
                  setColumnFilters([]);
                }}
                title="Effacer la recherche et les filtres"
              >
                <X className="h-3.5 w-3.5 mr-1" />
                Effacer
              </Button>
            )}
          </div>
          <p className="text-[10px] text-gray-500">
            {table.getFilteredRowModel().rows.length} ligne(s) trouvée(s)
            {data.length > 0 && ` sur ${data.length} au total`}.
          </p>
        </CardContent>
      </Card>

      <Card className="shadow-sm border border-orange-100 bg-white/90 backdrop-blur-sm overflow-hidden">
        <CardContent className="p-0">
          <div className="rounded-md border border-gray-200 overflow-x-auto">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow
                    key={headerGroup.id}
                    className="border-b-2 border-orange-300 bg-orange-600 hover:bg-orange-600"
                  >
                    {headerGroup.headers.map((header) => {
                      const canSort = header.column.getCanSort();
                      const sortDir = header.column.getIsSorted();
                      return (
                        <TableHead
                          key={header.id}
                          className="text-xs font-semibold text-white py-1.5 px-2 whitespace-nowrap"
                        >
                          <div
                            role={canSort ? "button" : undefined}
                            tabIndex={canSort ? 0 : undefined}
                            className={
                              canSort
                                ? "flex items-center gap-1 cursor-pointer select-none hover:opacity-90"
                                : ""
                            }
                            onClick={header.column.getToggleSortingHandler()}
                            onKeyDown={
                              canSort
                                ? (e) => {
                                    if (e.key === "Enter" || e.key === " ") {
                                      e.preventDefault();
                                      header.column.toggleSorting();
                                    }
                                  }
                                : undefined
                            }
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {canSort &&
                              (sortDir === "asc" ? (
                                <ArrowUp className="h-3 w-3" />
                              ) : sortDir === "desc" ? (
                                <ArrowDown className="h-3 w-3" />
                              ) : (
                                <ArrowUpDown className="h-3 w-3 opacity-70" />
                              ))}
                          </div>
                        </TableHead>
                      );
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getPaginationRowModel().rows?.length ? (
                  table.getPaginationRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      className="hover:bg-orange-50 h-8 transition-colors"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell
                          key={cell.id}
                          className="text-xs py-0.5 px-2"
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-12 text-center text-gray-500 text-xs py-2"
                    >
                      {globalFilter.trim()
                        ? "Aucun résultat pour cette recherche."
                        : "Aucune donnée."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      <div className="flex items-center justify-between gap-2 text-[10px] text-gray-600">
        <div className="flex items-center gap-2">
          <span>
            Page{" "}
            <strong>
              {table.getState().pagination.pageIndex + 1} / {table.getPageCount() || 1}
            </strong>
          </span>
          <span className="hidden sm:inline">
            ({table.getPaginationRowModel().rows.length} ligne(s) sur cette page)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <select
            className="h-7 text-[10px] border-gray-300 rounded px-1"
            value={table.getState().pagination.pageSize}
            onChange={(e) => table.setPageSize(Number(e.target.value))}
          >
            {[10, 25, 50, 100].map((size) => (
              <option key={size} value={size}>
                {size} / page
              </option>
            ))}
          </select>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 px-2 text-[10px]"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Préc.
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 px-2 text-[10px]"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Suiv.
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
