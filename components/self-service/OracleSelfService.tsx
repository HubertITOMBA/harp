"use client";

import { useMemo, useState } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
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
import { Database, Loader2, Server, Search, Trash2 } from "lucide-react";
import { toast } from "react-toastify";
import type { SessionRow } from "@/lib/parse-sessions-log";
import { listOracleSessions } from "@/actions/list-oracle-sessions";

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

const formatLabel = (r: OracleRecord) => r.oracle_sid;

const sessionsColumns: ColumnDef<SessionRow>[] = [
  { accessorKey: "sid", header: "sid" },
  { accessorKey: "serial", header: "serial#" },
  { accessorKey: "username", header: "username" },
  { accessorKey: "schemaname", header: "schemaname" },
  { accessorKey: "osuser", header: "osuser" },
  { accessorKey: "machine", header: "machine" },
  { accessorKey: "module", header: "module" },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const s = row.original;
      const msg = `Kill de la session (${s.sid}, ${s.serial}) pour le schema (${s.schemaname})`;
      return (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
          onClick={() => toast.info(msg)}
          title={msg}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      );
    },
  },
];

function SessionsTableContent({
  data,
  columns,
}: {
  data: SessionRow[];
  columns: ColumnDef<SessionRow>[];
}) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });
  return (
    <div className="rounded-md border border-gray-200 overflow-hidden">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="border-b-2 border-orange-300 bg-orange-600 hover:bg-orange-600">
              {headerGroup.headers.map((header) => (
                <TableHead
                  key={header.id}
                  className="text-xs font-semibold text-white py-1.5 px-2 whitespace-nowrap"
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
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
                Aucune session.
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
  const [selectedSid, setSelectedSid] = useState<string | null>(
    records.length > 0 ? records[0].oracle_sid : null,
  );

  const filteredSessions = useMemo(() => {
    const q = sessionSearch.trim().toLowerCase();
    if (!q) return sessionsList;
    return sessionsList.filter(
      (s) =>
        s.sid.toLowerCase().includes(q) || s.serial.toLowerCase().includes(q),
    );
  }, [sessionsList, sessionSearch]);

  const handleListSessions = async () => {
    if (!current?.oracle_sid || !current?.ip) return;
    setSessionsLoading(true);
    try {
      const result = await listOracleSessions(current.oracle_sid, current.ip);
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

  // Liste sans doublon pour la combo : un seul enregistrement par oracle_sid
  const uniqueBySid = useMemo(() => {
    const map = new Map<string, OracleRecord>();
    for (const r of filtered) {
      if (!map.has(r.oracle_sid)) {
        map.set(r.oracle_sid, r);
      }
    }
    return Array.from(map.values());
  }, [filtered]);

  const current =
    uniqueBySid.find((r) => r.oracle_sid === selectedSid) ??
    uniqueBySid[0] ??
    null;

  const handleSelect = (value: string) => {
    const sid = value && value.trim() !== "" ? value : null;
    setSelectedSid(sid);
  };

  return (
    <div className="bg-gradient-to-br from-gray-100 via-gray-200 to-orange-50 p-2 sm:p-3 lg:p-4 pb-10">
      <div className="max-w-7xl mx-auto space-y-3 w-full">
        <div className="space-y-0.5">
          <h1 className="text-lg sm:text-xl font-bold text-gray-900">
            Self-service <span className="text-orange-600">Oracle</span>
          </h1>
          <p className="text-[11px] sm:text-xs text-gray-600">
            Recherchez un <code className="font-mono">oracle_sid</code> et
            consultez les informations associées (alias, schéma, serveur DB).
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[minmax(0,220px)_minmax(0,1fr)] gap-2 md:gap-3">
          {/* Colonne gauche : recherche + liste déroulante */}
          <Card className="shadow-sm border border-orange-100 bg-white/90 backdrop-blur-sm">
            <CardHeader className="pb-1.5 pt-2 px-2.5">
              <CardTitle className="text-xs font-semibold text-gray-800 flex items-center gap-1.5">
                <Search className="h-3.5 w-3.5 text-orange-600" />
                Sélection Oracle SID
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
                value={current ? current.oracle_sid : undefined}
                onValueChange={handleSelect}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Choisir un oracle_sid..." />
                </SelectTrigger>
                <SelectContent className="max-h-72 text-xs">
                  {uniqueBySid.map((r) => (
                    <SelectItem key={r.id} value={r.oracle_sid}>
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
                          sessionsLoading || !current?.ip || !current?.oracle_sid
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
                {current?.oracle_sid || "oracle_sid sélectionné"}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-2.5 pb-2.5 space-y-1.5">
            <Input
              placeholder="Rechercher sid ou serial#..."
              value={sessionSearch}
              onChange={(e) => setSessionSearch(e.target.value)}
              className="h-8 text-xs max-w-xs"
            />
            <SessionsTableContent data={filteredSessions} columns={sessionsColumns} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

