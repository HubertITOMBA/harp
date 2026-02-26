"use client";

import { useMemo, useState } from "react";
import {
  ColumnDef,
  Row,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import type { SortingState } from "@tanstack/react-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowDown, ArrowUp, ArrowUpDown, Database, Loader2, Server, Search, Trash2 } from "lucide-react";
import { toast } from "react-toastify";
import type { SessionRow } from "@/lib/parse-sessions-log";
import {
  killOracleSession,
  listOracleSessions,
} from "@/actions/list-oracle-sessions";

type OracleRecord = {
  id: number;
  oracle_sid: string;
  aliasql: string;
  oraschema: string;
  descr: string | null;
  orarelease: string | null;
  envId: number;
  srv: string | null;
  site: string | null;
  ip: string | null;
  typsrv: string | null;
};

interface OracleSelfServiceProps {
  records: OracleRecord[];
  sessions?: SessionRow[];
}

const formatLabel = (r: OracleRecord) => r.aliasql;

const sessionsBaseColumns: ColumnDef<SessionRow>[] = [
  { accessorKey: "sid", header: "sid" },
  { accessorKey: "serial", header: "serial#" },
  { accessorKey: "username", header: "username" },
  { accessorKey: "schemaname", header: "schemaname" },
  { accessorKey: "osuser", header: "osuser" },
  { accessorKey: "machine", header: "machine" },
  { accessorKey: "module", header: "module" },
];

function SessionsTableContent({
  data,
  columns,
  globalFilter,
  onGlobalFilterChange,
}: {
  data: SessionRow[];
  columns: ColumnDef<SessionRow>[];
  globalFilter: string;
  onGlobalFilterChange: (value: string) => void;
}) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onGlobalFilterChange: (updater) => {
      const v = typeof updater === "function" ? updater(globalFilter) : globalFilter;
      onGlobalFilterChange(v);
    },
    globalFilterFn: (row: Row<SessionRow>, _columnId: string, filterValue: string) => {
      if (!filterValue || String(filterValue).trim() === "") return true;
      const q = String(filterValue).toLowerCase().trim();
      const s = row.original;
      return [
        s.sid,
        s.serial,
        s.username,
        s.schemaname,
        s.osuser,
        s.machine,
        s.module,
      ].some((val) => String(val).toLowerCase().includes(q));
    },
    state: { sorting, globalFilter },
  });

  return (
    <div className="rounded-md border border-gray-200 overflow-hidden">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="border-b-2 border-orange-300 bg-orange-600 hover:bg-orange-600">
              {headerGroup.headers.map((header) => {
                const canSort = header.column.getCanSort();
                const sortDir = header.column.getIsSorted();
                return (
                  <TableHead
                    key={header.id}
                    className="text-xs font-semibold text-white py-1.5 px-2 whitespace-nowrap"
                  >
                    {header.isPlaceholder ? null : (
                      <div
                        role={canSort ? "button" : undefined}
                        tabIndex={canSort ? 0 : undefined}
                        className={canSort ? "flex items-center gap-1 cursor-pointer select-none hover:opacity-90" : ""}
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
                        {canSort && (
                          <span className="inline-flex">
                            {sortDir === "asc" ? (
                              <ArrowUp className="h-3 w-3" />
                            ) : sortDir === "desc" ? (
                              <ArrowDown className="h-3 w-3" />
                            ) : (
                              <ArrowUpDown className="h-3 w-3 opacity-70" />
                            )}
                          </span>
                        )}
                      </div>
                    )}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id} className="hover:bg-orange-100 h-8 transition-colors">
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} className="text-xs py-0.5 px-2">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-12 text-center text-gray-500 text-xs py-2">
                {globalFilter.trim() ? "Aucun résultat pour cette recherche." : "Aucune session."}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

export function OracleSelfService({ records, sessions = [] }: OracleSelfServiceProps) {
  const [search, setSearch] = useState("");
  const [sessionSearch, setSessionSearch] = useState("");
  const [sessionsList, setSessionsList] = useState<SessionRow[]>(sessions);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [killingSessionKey, setKillingSessionKey] = useState<string | null>(null);
  const [selectedAliasql, setSelectedAliasql] = useState<string | null>(
    records.length > 0 ? records[0].aliasql : null,
  );

  const handleListSessions = async () => {
    if (!current?.aliasql || !current?.ip) return;
    setSessionsLoading(true);
    try {
      const result = await listOracleSessions(current.aliasql, current.ip);
      if (result.success) {
        setSessionsList(result.sessions);
        toast.success(
          result.sessions.length > 0
            ? `${result.sessions.length} session(s) récupérée(s).`
            : "Aucune session trouvée.",
        );
      } else {
        toast.error(result.error || "Erreur lors du listage des sessions.");
        if (result.sessions?.length) setSessionsList(result.sessions);
      }
    } catch {
      toast.error("Erreur lors du listage des sessions.");
    } finally {
      setSessionsLoading(false);
    }
  };

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return records;
    return records.filter((r) => {
      const text = [
        r.oracle_sid,
        r.aliasql,
        r.oraschema,
        r.descr ?? "",
        r.srv ?? "",
        r.ip ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return text.includes(s);
    });
  }, [records, search]);

  // Liste sans doublon pour la combo : un seul enregistrement par aliasql
  const uniqueByAliasql = useMemo(() => {
    const map = new Map<string, OracleRecord>();
    for (const r of filtered) {
      if (!map.has(r.aliasql)) {
        map.set(r.aliasql, r);
      }
    }
    return Array.from(map.values());
  }, [filtered]);

  const current =
    uniqueByAliasql.find((r) => r.aliasql === selectedAliasql) ??
    uniqueByAliasql[0] ??
    null;

  const handleSelect = (value: string) => {
    const v = value && value.trim() !== "" ? value : null;
    setSelectedAliasql(v);
  };

  const handleKillSession = async (session: SessionRow) => {
    if (!current?.aliasql || !current?.ip) return;
    const key = `${session.sid},${session.serial}`;
    setKillingSessionKey(key);
    try {
      const result = await killOracleSession(
        current.aliasql,
        current.ip,
        session.sid,
        session.serial,
      );
      if (result.success) {
        toast.success(
          `Session (${session.sid}, ${session.serial}) pour le schema ${session.schemaname} terminée.`,
        );
        setSessionsList((prev) =>
          prev.filter(
            (s) => !(s.sid === session.sid && s.serial === session.serial),
          ),
        );
        listOracleSessions(current.aliasql, current.ip).then((listResult) => {
          if (listResult.success) setSessionsList(listResult.sessions);
        });
      } else {
        toast.error(result.error ?? "Erreur lors du kill de la session.");
      }
    } catch {
      toast.error("Erreur lors du kill de la session.");
    } finally {
      setKillingSessionKey(null);
    }
  };

  const sessionsColumns = useMemo<ColumnDef<SessionRow>[]>(() => {
    return [
      ...sessionsBaseColumns,
      {
        id: "actions",
        header: "Actions",
        enableSorting: false,
        cell: ({ row }: { row: { original: SessionRow } }) => {
          const s = row.original;
          const key = `${s.sid},${s.serial}`;
          const isKilling = killingSessionKey === key;
          const msg = `Kill de la session (${s.sid}, ${s.serial}) pour le schema (${s.schemaname})`;
          return (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
              disabled={isKilling || !current?.aliasql || !current?.ip}
              onClick={() => handleKillSession(s)}
              title={msg}
            >
              {isKilling ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash2 className="h-3.5 w-3.5" />
              )}
            </Button>
          );
        },
      },
    ];
  }, [current, killingSessionKey]);

  return (
    <div className="bg-gradient-to-br from-gray-100 via-gray-200 to-orange-50 p-2 sm:p-3 lg:p-4 pb-10">
      <div className="max-w-7xl mx-auto space-y-3 w-full">
        <div className="space-y-0.5">
          <h1 className="text-lg sm:text-xl font-bold text-gray-900">
            Self-service <span className="text-orange-600">Oracle</span>
          </h1>
          <p className="text-[11px] sm:text-xs text-gray-600">
            Recherchez un <code className="font-mono">aliasql</code> et
            consultez les informations associées (alias, schéma, serveur DB).
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[minmax(0,220px)_minmax(0,1fr)] gap-2 md:gap-3">
          {/* Colonne gauche : recherche + liste déroulante */}
          <Card className="shadow-sm border border-orange-100 bg-white/90 backdrop-blur-sm">
            <CardHeader className="pb-1.5 pt-2 px-2.5">
              <CardTitle className="text-xs font-semibold text-gray-800 flex items-center gap-1.5">
                <Search className="h-3.5 w-3.5 text-orange-600" />
                Sélection aliasql
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5 px-2.5 pb-2.5">
              <Input
                placeholder="Rechercher (SID, alias, schéma, serveur, IP)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 text-xs"
              />

              <Select
                value={current ? current.aliasql : undefined}
                onValueChange={handleSelect}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Choisir un aliasql..." />
                </SelectTrigger>
                <SelectContent className="max-h-72 text-xs">
                  {uniqueByAliasql.map((r) => (
                    <SelectItem key={r.id} value={r.aliasql}>
                      {formatLabel(r)}
                    </SelectItem>
                  ))}
                  {filtered.length === 0 && (
                    <div className="px-2 py-1.5 text-[11px] text-gray-500">
                      Aucun résultat pour cette recherche.
                    </div>
                  )}
                </SelectContent>
              </Select>

              <p className="text-[10px] text-gray-500">
                Total :{" "}
                <span className="font-semibold text-gray-700">{filtered.length}</span>{" "}
                enregistrement{filtered.length > 1 ? "s" : ""} sur{" "}
                <span className="font-semibold text-gray-700">{records.length}</span>.
              </p>
            </CardContent>
          </Card>

          {/* Colonne droite : détails */}
          <Card className="shadow-sm border border-orange-100 bg-white/90 backdrop-blur-sm">
            <CardHeader className="pb-1.5 pt-2 px-2.5">
              <CardTitle className="flex items-center gap-1.5 text-xs font-semibold text-gray-800">
                <Database className="h-3.5 w-3.5 text-orange-600" />
                Informations Oracle
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-3 pt-2">
              {current ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="space-y-1">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        Oracle SID
                      </p>
                      <p className="font-mono text-sm text-slate-900">
                        {current.oracle_sid}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        Alias SQL*Net
                      </p>
                      <p className="font-mono text-sm text-slate-900">
                        {current.aliasql}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        Schéma Oracle
                      </p>
                      <p className="font-mono text-sm text-slate-900">
                        {current.oraschema}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        Release Oracle
                      </p>
                      <p className="text-sm text-slate-900">
                        {current.orarelease || "N/A"}
                      </p>
                    </div>
                  </div>

                  {current.descr && (
                    <div className="space-y-1">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        Description
                      </p>
                      <p className="text-sm text-slate-800 whitespace-pre-wrap">
                        {current.descr}
                      </p>
                    </div>
                  )}

                  <div className="border-t pt-2 mt-1.5 space-y-2">
                    <div className="flex items-center gap-2">
                      <Server className="h-4 w-4 text-orange-600" />
                      <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                        Serveur de base de données
                      </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div className="space-y-1">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                          Nom du serveur
                        </p>
                        <p className="font-mono text-sm text-slate-900">
                          {current.srv || "N/A"}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                          Adresse IP
                        </p>
                        <p className="font-mono text-sm text-slate-900">
                          {current.ip || "N/A"}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                          Site / Type serveur
                        </p>
                        <div className="flex flex-wrap items-center gap-1">
                          {current.site && (
                            <Badge
                              variant="outline"
                              className="text-[11px] px-1.5 py-0.5 border-slate-300"
                            >
                              {current.site}
                            </Badge>
                          )}
                          {current.typsrv && (
                            <Badge
                              variant="outline"
                              className="text-[11px] px-1.5 py-0.5 border-slate-300"
                            >
                              {current.typsrv}
                            </Badge>
                          )}
                          {!current.site && !current.typsrv && (
                            <span className="text-xs text-slate-400">N/A</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end mt-1">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-[11px] sm:text-xs border-orange-200 text-orange-700 hover:bg-orange-50"
                        disabled={
                          sessionsLoading || !current?.ip || !current?.aliasql
                        }
                        onClick={handleListSessions}
                      >
                        {sessionsLoading ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                            Chargement...
                          </>
                        ) : (
                          "Lister les sessions Oracle"
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-500">
                  Aucun enregistrement sélectionné.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Liste des sessions Oracle (TanStack Table) */}
        <Card className="shadow-sm border border-dashed border-orange-200 bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-1.5 pt-2 px-2.5">
            <CardTitle className="text-xs font-semibold text-gray-800 flex items-center gap-1.5">
              <Database className="h-3.5 w-3.5 text-orange-600" />
              Sessions Oracle pour{" "}
              <span className="font-mono text-orange-700">
                {current?.aliasql || "aliasql sélectionné"}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-2.5 pb-2.5 space-y-1.5">
            <Input
              placeholder="Rechercher dans toutes les colonnes..."
              value={sessionSearch}
              onChange={(e) => setSessionSearch(e.target.value)}
              className="h-8 text-xs max-w-xs"
            />
            <SessionsTableContent
              data={sessionsList}
              columns={sessionsColumns}
              globalFilter={sessionSearch}
              onGlobalFilterChange={setSessionSearch}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

