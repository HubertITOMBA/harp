"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Database, Server, Search } from "lucide-react";

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
}

const formatLabel = (r: OracleRecord) => r.oracle_sid;

export function OracleSelfService({ records }: OracleSelfServiceProps) {
  const [search, setSearch] = useState("");
  const [selectedSid, setSelectedSid] = useState<string | null>(
    records.length > 0 ? records[0].oracle_sid : null,
  );

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
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-200 to-orange-50 p-3 sm:p-4 lg:p-6">
      <div className="max-w-6xl mx-auto space-y-4">
        <div className="space-y-0.5">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            Self-service <span className="text-orange-600">Oracle</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-600">
            Recherchez un <code className="font-mono">oracle_sid</code> et
            consultez les informations associées (alias, schéma, serveur DB).
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[minmax(0,240px)_minmax(0,1fr)] gap-3 md:gap-4">
          {/* Colonne gauche : recherche + liste déroulante */}
          <Card className="shadow-md border border-orange-100 bg-white/90 backdrop-blur-sm">
            <CardHeader className="pb-2 pt-3 px-3">
              <CardTitle className="text-xs sm:text-sm font-semibold text-gray-800 flex items-center gap-2">
                <Search className="h-4 w-4 text-orange-600" />
                Sélection Oracle SID
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 px-3 pb-3">
              <Input
                placeholder="Rechercher (SID, alias, schéma, serveur, IP)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 text-sm"
              />

              <Select
                value={current ? current.oracle_sid : undefined}
                onValueChange={handleSelect}
              >
                <SelectTrigger className="h-9 text-xs sm:text-sm">
                  <SelectValue placeholder="Choisir un oracle_sid..." />
                </SelectTrigger>
                <SelectContent className="max-h-80 text-xs sm:text-sm">
                  {uniqueBySid.map((r) => (
                    <SelectItem key={r.id} value={r.oracle_sid}>
                      {formatLabel(r)}
                    </SelectItem>
                  ))}
                  {filtered.length === 0 && (
                    <div className="px-3 py-2 text-xs text-gray-500">
                      Aucun résultat pour cette recherche.
                    </div>
                  )}
                </SelectContent>
              </Select>

              <p className="text-[11px] text-gray-500">
                Total :{" "}
                <span className="font-semibold text-gray-700">
                  {filtered.length}
                </span>{" "}
                enregistrement
                {filtered.length > 1 ? "s" : ""} sur{" "}
                <span className="font-semibold text-gray-700">
                  {records.length}
                </span>
                .
              </p>
            </CardContent>
          </Card>

          {/* Colonne droite : détails */}
          <Card className="shadow-md border border-orange-100 bg-white/90 backdrop-blur-sm">
            <CardHeader className="pb-2 pt-3 px-3">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                <Database className="h-4 w-4 text-orange-600" />
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
                        disabled
                      >
                        Lister les sessions Oracle (à venir)
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

        {/* Zone réservée pour la liste des sessions Oracle (implémentation future) */}
        <Card className="shadow-sm border border-dashed border-orange-200 bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-2 pt-3 px-3">
            <CardTitle className="text-xs sm:text-sm font-semibold text-gray-800 flex items-center gap-2">
              <Database className="h-4 w-4 text-orange-600" />
              Sessions Oracle pour{" "}
              <span className="font-mono text-orange-700">
                {current?.oracle_sid || "oracle_sid sélectionné"}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <p className="text-xs sm:text-sm text-gray-600">
              La liste détaillée des sessions Oracle pour cet{" "}
              <code className="font-mono">oracle_sid</code> sera affichée
              ici ultérieurement.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

