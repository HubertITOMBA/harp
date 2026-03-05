"use client";

import { useMemo } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import type { SortingState } from "@tanstack/react-table";
import { useState } from "react";
import { BadgeCheck, AlertTriangle, PauseCircle, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ApplicationStatusRow } from "@/actions/app-status";

type LocalStatus = ApplicationStatusRow & {
  statusLabel: string;
  statusType: "ok" | "running" | "error" | "stopped" | "unknown";
};

function mapStatus(status: string): { label: string; type: LocalStatus["statusType"] } {
  const s = status.trim().toLowerCase();
  if (!s) return { label: "Inconnu", type: "unknown" };
  if (["ok", "actif", "active", "running"].includes(s)) return { label: "Actif", type: "ok" };
  if (["en cours", "processing", "booting"].includes(s)) return { label: "En cours", type: "running" };
  if (["erreur", "error", "ko", "failed"].includes(s)) return { label: "En erreur", type: "error" };
  if (["stop", "stopped", "arrêté", "arreté"].includes(s)) return { label: "Stoppé", type: "stopped" };
  return { label: status, type: "unknown" };
}

export function AppStatusTable({ data }: { data: ApplicationStatusRow[] }) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const mappedData: LocalStatus[] = useMemo(
    () =>
      data.map((row) => {
        const mapped = mapStatus(row.status);
        return { ...row, statusLabel: mapped.label, statusType: mapped.type };
      }),
    [data]
  );

  const columns = useMemo<ColumnDef<LocalStatus>[]>(
    () => [
      {
        accessorKey: "application",
        header: "Application",
        cell: ({ getValue }) => (
          <span className="font-mono text-xs">{String(getValue() ?? "")}</span>
        ),
      },
      {
        accessorKey: "env",
        header: "Environnement",
        cell: ({ getValue }) => (
          <span className="font-mono text-xs">{String(getValue() ?? "")}</span>
        ),
      },
      {
        accessorKey: "server",
        header: "Serveur",
        cell: ({ getValue }) => (
          <span className="font-mono text-xs">{String(getValue() ?? "")}</span>
        ),
      },
      {
        accessorKey: "statusLabel",
        header: "Statut",
        cell: ({ row }) => {
          const type = row.original.statusType;
          const label = row.original.statusLabel;
          const common = "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium";
          if (type === "ok") {
            return (
              <span className={`${common} bg-emerald-50 text-emerald-700 border border-emerald-200`}>
                <BadgeCheck className="h-3 w-3" />
                {label}
              </span>
            );
          }
          if (type === "running") {
            return (
              <span className={`${common} bg-sky-50 text-sky-700 border border-sky-200`}>
                <PlayCircle className="h-3 w-3" />
                {label}
              </span>
            );
          }
          if (type === "error") {
            return (
              <span className={`${common} bg-red-50 text-red-700 border border-red-200`}>
                <AlertTriangle className="h-3 w-3" />
                {label}
              </span>
            );
          }
          if (type === "stopped") {
            return (
              <span className={`${common} bg-amber-50 text-amber-700 border border-amber-200`}>
                <PauseCircle className="h-3 w-3" />
                {label}
              </span>
            );
          }
          return (
            <span className={`${common} bg-gray-50 text-gray-700 border border-gray-200`}>
              {label}
            </span>
          );
        },
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const app = row.original;
          // Les actions start/stop/restart appellent aujourd'hui des scripts côté Unix
          // via la page, mais ici on se contente d'afficher les boutons (hooks à ajouter plus tard).
          return (
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" className="h-6 w-6" disabled>
                <PlayCircle className="h-3 w-3 text-emerald-600" />
              </Button>
              <Button variant="outline" size="icon" className="h-6 w-6" disabled>
                <PauseCircle className="h-3 w-3 text-amber-600" />
              </Button>
              <Button variant="outline" size="icon" className="h-6 w-6" disabled>
                <AlertTriangle className="h-3 w-3 text-sky-600" />
              </Button>
            </div>
          );
        },
      },
    ],
    []
  );

  const table = useReactTable({
    data: mappedData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: { sorting },
  });

  return (
    <div className="space-y-2">
      <div className="text-[11px] text-gray-500">
        {table.getRowModel().rows.length} application(s) affichée(s)
        {mappedData.length > 0 && ` sur ${mappedData.length} au total`}.
      </div>
      <div className="rounded-md border border-gray-200 overflow-x-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="bg-orange-600 hover:bg-orange-600">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="text-xs font-semibold text-white py-1.5 px-2 whitespace-nowrap"
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className="hover:bg-orange-50 h-8">
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="text-xs py-0.5 px-2">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-10 text-center text-xs text-gray-500">
                  Aucune donnée de statut disponible.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

