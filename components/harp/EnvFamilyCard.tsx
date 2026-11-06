import Image from "next/image";
import type { Prisma } from "@prisma/client";
import { Label } from "@/components/ui/label";
import { PuttyLink } from "./PuttyLink";
import { SQLDeveloperLink } from "./SQLDeveloperLink";
import { SQLPlusLink } from "./SQLPlusLink";
import { PSDMTLink } from "./PSDMTLink";
import { FileZillaLink } from "./FileZillaLink";
import { PSIDELink } from "./PSIDELink";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { ServersDialogButton } from "./ServersDialogButton";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Database,
  ExternalLink,
  Globe,
} from "lucide-react";
import { CopyPasswordButton } from "./CopyPasswordButton";
import { HarpUrlLink } from "./HarpUrlLink";

export type EnvFamilyEnvironment = Prisma.envsharpGetPayload<{
  select: {
    id: true;
    env: true;
    descr: true;
    url: true;
    appli: true;
    harprelease: true;
    psversion: true;
    ptversion: true;
    volum: true;
    aliasql: true;
    oraschema: true;
    instanceId: true;
    orarelease: true;
    anonym: true;
    edi: true;
    statutenv: {
      select: {
        id: true;
        statenv: true;
        icone: true;
      };
    };
    harpenvinfo: {
      select: {
        datmaj: true;
        refreshdt: true;
        pswd_ft_exploit: true;
        pswd_oraquery: true;
        datadt: true;
        modedt: true;
        userunx: true;
      };
    };
  };
}> & {
  serverInfo: {
    id: number;
    ip: string;
    psuser: string | null;
    srv: string;
    pshome: string;
    domain: string | null;
  } | null;
};

interface EnvFamilyCardProps {
  envsharp: EnvFamilyEnvironment;
  "data-env-id": number;
  hideHeader?: boolean;
}

/**
 * Fiche complète d'un environnement de famille.
 * Même rendu que la carte historique de la liste : liens, tooltips,
 * dialogue des serveurs et copie des mots de passe.
 *
 * @param envsharp - Environnement déjà chargé, avec son serveur principal
 * @param data-env-id - Identifiant lu par la recherche de la liste
 * @param hideHeader - Masque l'en-tête déjà affiché par la ligne compacte
 */
export function EnvFamilyCard({
  envsharp,
  "data-env-id": dataEnvId,
  hideHeader = false,
}: EnvFamilyCardProps) {
  return (
    <Card
      data-env-id={dataEnvId}
      className="w-full shadow-lg hover:shadow-xl transition-all duration-300 border-2 hover:border-harpOrange/30"
    >
      {hideHeader ? null : (
      <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 border-b border-orange-200 pb-2 pt-3 px-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {/* Icône de statut */}
            {envsharp.statutenv?.icone && (
              <div className="flex-shrink-0">
                <Image
                  src={`/ressources/${envsharp.statutenv.icone}`}
                  alt={envsharp.statutenv.statenv || "Statut"}
                  width={32}
                  height={32}
                  className="rounded"
                />
              </div>
            )}

            {/* Nom de l'environnement */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <HarpUrlLink
                  href={envsharp.url || "#"}
                  className="text-lg sm:text-xl font-bold text-harpOrange hover:underline flex items-center gap-1.5"
                >
                  {envsharp.env}
                  {envsharp.url && (
                    <ExternalLink className="w-3 h-3 text-muted-foreground" />
                  )}
                </HarpUrlLink>
                {envsharp.anonym === "N" ? null : (
                  <Badge
                    variant="outline"
                    className="text-xs border-orange-400 text-orange-800 bg-orange-50"
                  >
                     <Image
                      src="/ressources/anonym.png"
                      alt="ANO"
                      width={16}
                      height={16}
                      className="object-contain align-middle"
                    />
                    {/* <Lock className="w-3 h-3 mr-1" /> */}
                    Anonymisée
                  </Badge>
                )}
                {envsharp.edi === "N" ? null : (
                  <div className="flex items-center gap-1">
                    <Badge
                      variant="outline"
                      className="text-xs border-sky-400 text-sky-800 bg-sky-50"
                    >
                      <Globe className="w-3 h-3 mr-1" />
                      EDI
                    </Badge>
                    <Image
                      src="/ressources/edi.png"
                      alt="EDI"
                      width={96}
                      height={58}
                      className="object-contain align-middle"
                    />
                  </div>
                )}
              </div>
              {envsharp.descr && (
                <p className="text-sm text-muted-foreground mt-1">
                  {envsharp.descr}
                </p>
              )}
            </div>
          </div>

          {/* Informations rapides */}
          <div className="flex flex-col gap-1 text-right">
            {envsharp.statutenv && (
              <Badge variant="outline" className="w-fit ml-auto">
                {envsharp.statutenv.statenv}
              </Badge>
            )}
            {envsharp.serverInfo && (
              <p className="text-xs text-muted-foreground">
                {envsharp.serverInfo.srv || envsharp.serverInfo.ip}
              </p>
            )}
          </div>
        </div>
      </CardHeader>
      )}

      {/* Contenu (onglets supprimés) */}
      <TooltipProvider delayDuration={1000}>
      <CardContent className="pt-2 px-3 pb-3">
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-700 flex items-center gap-2">
              <Database className="h-4 w-4 text-orange-600" />
              Environnement &amp; Oracle
            </div>
            <ServersDialogButton envId={envsharp.id} envName={envsharp.env} />
          </div>

          {/* Bloc principal (Environnement + Oracle fusionnés) */}
          <div className="rounded-md border border-orange-200 bg-white shadow-sm overflow-hidden">
            <div className="px-3 py-2 border-b border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50">
              <div className="text-xs font-semibold text-slate-800">Fiche environnement</div>
            </div>

            <div className="px-3 py-2">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-6">
                <div className="divide-y divide-orange-100">
                  <div className="py-2 grid grid-cols-[165px_1fr] items-center gap-3">
                    <Label className="text-[11px] font-semibold text-slate-800">Version HARP</Label>
                    <div className="text-xs font-mono text-slate-900 text-right flex flex-wrap items-center justify-end gap-2">
                      {envsharp.harprelease ? (
                        <HarpUrlLink href={envsharp.url || "#"} className="font-semibold text-harpOrange hover:underline">
                          {envsharp.harprelease}
                        </HarpUrlLink>
                      ) : null}
                    </div>
                  </div>

                  <div className="py-2 grid grid-cols-[165px_1fr] items-center gap-3">
                    <Label className="text-[11px] font-semibold text-slate-800">Version PSoft (Designer)</Label>
                    <div className="text-xs font-mono text-slate-900 text-right">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="inline-flex">
                            <PSIDELink className="font-semibold text-harpOrange hover:underline cursor-pointer" ptversion={envsharp.ptversion} aliasql={envsharp.aliasql} envId={envsharp.id}>
                              {envsharp.psversion || "N/A"}
                            </PSIDELink>
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>Application Designer</TooltipContent>
                      </Tooltip>
                    </div>
                  </div>

                  <div className="py-2 grid grid-cols-[165px_1fr] items-center gap-3">
                    <Label className="text-[11px] font-semibold text-slate-800">Version PTools</Label>
                    <div className="text-xs font-mono text-slate-900 text-right">
                      <HarpUrlLink href={envsharp.url || "#"} className="font-semibold text-harpOrange hover:underline">
                        {envsharp.ptversion || "N/A"}
                      </HarpUrlLink>
                    </div>
                  </div>

                  <div className="py-2 grid grid-cols-[165px_1fr] items-center gap-3">
                    <Label className="text-[11px] font-semibold text-slate-800">COBOL</Label>
                    <div className="text-xs font-mono text-slate-900 text-right">{envsharp.volum || "N/A"}</div>
                  </div>

                  {envsharp.harpenvinfo?.[0]?.datmaj ? (
                    <div className="py-2 grid grid-cols-[165px_1fr] items-center gap-3">
                      <Label className="text-[11px] font-semibold text-slate-800">Date maj</Label>
                      <div className="text-xs font-mono text-slate-900 text-right">
                        {new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short" }).format(envsharp.harpenvinfo[0].datmaj!)}
                      </div>
                    </div>
                  ) : null}

                  {envsharp.harpenvinfo?.[0]?.refreshdt ? (
                    <div className="py-2 grid grid-cols-[165px_1fr] items-center gap-3">
                      <Label className="text-[11px] font-semibold text-slate-800">Dernier refresh</Label>
                      <div className="text-xs font-mono text-slate-900 text-right">
                        {new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "medium" }).format(envsharp.harpenvinfo[0].refreshdt!)}
                      </div>
                    </div>
                  ) : null}

                  {envsharp.harpenvinfo?.[0]?.pswd_ft_exploit ? (
                    <div className="py-2 grid min-w-0 grid-cols-1 items-start gap-2 sm:grid-cols-[165px_1fr] sm:items-center sm:gap-3">
                      <Label className="text-[11px] font-semibold text-slate-800">Password FT_EXPLOIT</Label>
                      <div className="min-w-0 max-w-full sm:text-right [&_button]:h-auto [&_button]:max-w-full [&_button]:whitespace-normal">
                        <CopyPasswordButton password={envsharp.harpenvinfo[0].pswd_ft_exploit!} label="Copier le mot de passe" />
                      </div>
                    </div>
                  ) : null}

                  {envsharp.harpenvinfo?.[0]?.pswd_oraquery ? (
                    <div className="py-2 grid min-w-0 grid-cols-1 items-start gap-2 sm:grid-cols-[165px_1fr] sm:items-center sm:gap-3">
                      <Label className="text-[11px] font-semibold text-slate-800">Password ORAQUERY</Label>
                      <div className="min-w-0 max-w-full sm:text-right [&_button]:h-auto [&_button]:max-w-full [&_button]:whitespace-normal">
                        <CopyPasswordButton password={envsharp.harpenvinfo[0].pswd_oraquery} label="Copier le mot de passe" />
                      </div>
                    </div>
                  ) : null}

                  {envsharp.harpenvinfo?.[0]?.userunx ? (
                    <div className="py-2 grid grid-cols-[165px_1fr] items-center gap-3">
                      <Label className="text-[11px] font-semibold text-slate-800">Sudo Sudoer</Label>
                      <div className="text-xs font-mono text-slate-900 text-right">
                        <span className="inline-flex items-center rounded bg-harpOrange px-2 py-1 text-white text-[10px]">
                          {envsharp.harpenvinfo[0].userunx}
                        </span>
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="divide-y divide-orange-100">
                  {envsharp.harpenvinfo?.[0]?.datadt ? (
                    <div className="py-2 grid grid-cols-[165px_1fr] items-center gap-3">
                      <Label className="text-[11px] font-semibold text-slate-800">Image production</Label>
                      <div className="text-xs font-mono text-slate-900 text-right">
                        {new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "medium" }).format(envsharp.harpenvinfo[0].datadt!)}
                      </div>
                    </div>
                  ) : null}

                  <div className="py-2 grid grid-cols-[165px_1fr] items-center gap-3">
                    <Label className="text-[11px] font-semibold text-slate-800">Schéma Oracle (DataMover)</Label>
                    <div className="text-xs font-mono text-slate-900 text-right">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="inline-flex">
                            <PSDMTLink className="font-semibold text-harpOrange hover:underline cursor-pointer" ptversion={envsharp.ptversion} aliasql={envsharp.aliasql} envId={envsharp.id}>
                              {envsharp.oraschema || "N/A"}
                            </PSDMTLink>
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>Datamover</TooltipContent>
                      </Tooltip>
                    </div>
                  </div>

                  <div className="py-2 grid grid-cols-[165px_1fr] items-center gap-3">
                    <Label className="text-[11px] font-semibold text-slate-800">Instance Oracle</Label>
                    <div className="text-xs font-mono text-slate-900 text-right">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="inline-flex">
                            <SQLDeveloperLink className="font-semibold text-harpOrange hover:underline cursor-pointer">
                              {envsharp.aliasql || "N/A"} - {envsharp.orarelease || "N/A"}
                            </SQLDeveloperLink>
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>SqlDeveloper</TooltipContent>
                      </Tooltip>
                    </div>
                  </div>

                  <div className="py-2 grid grid-cols-[165px_1fr] items-center gap-3">
                    <Label className="text-[11px] font-semibold text-slate-800">Alias SQL*Net / Schéma</Label>
                    <div className="text-xs font-mono text-slate-900 text-right">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="inline-flex">
                            <SQLPlusLink className="font-semibold text-harpOrange hover:underline cursor-pointer" aliasql={envsharp.aliasql} envId={envsharp.id}>
                              {envsharp.aliasql || "N/A"} / {envsharp.oraschema || "N/A"}
                            </SQLPlusLink>
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>SqlPlus</TooltipContent>
                      </Tooltip>
                    </div>
                  </div>

                  {envsharp.serverInfo ? (
                    <>
                      <div className="py-2 grid grid-cols-[165px_1fr] items-center gap-3">
                        <Label className="text-[11px] font-semibold text-slate-800">Serveur</Label>
                        <div className="text-xs font-mono text-slate-900 text-right">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="inline-flex">
                                <PuttyLink
                                  host={envsharp.serverInfo.srv || envsharp.serverInfo.ip || ""}
                                  ip={envsharp.serverInfo.ip || ""}
                                  envId={envsharp.id}
                                  serverId={envsharp.serverInfo.id}
                                  className="font-semibold text-harpOrange hover:underline cursor-pointer"
                                >
                                  {envsharp.serverInfo.srv || "N/A"} {envsharp.serverInfo.ip ? `(${envsharp.serverInfo.ip})` : ""}
                                </PuttyLink>
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>Putty</TooltipContent>
                          </Tooltip>
                        </div>
                      </div>

                      <div className="py-2 grid grid-cols-[165px_1fr] items-center gap-3">
                        <Label className="text-[11px] font-semibold text-slate-800">PS Home</Label>
                        <div className="text-xs font-mono text-slate-900 text-right">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="inline-flex">
                                <FileZillaLink
                                  host={envsharp.serverInfo.ip || envsharp.serverInfo.srv}
                                  ip={envsharp.serverInfo.ip || undefined}
                                  pshome={envsharp.serverInfo.pshome}
                                  envId={envsharp.id}
                                  serverId={envsharp.serverInfo.id}
                                  className="font-semibold text-harpOrange hover:underline cursor-pointer"
                                >
                                  {envsharp.serverInfo.pshome ? `${envsharp.serverInfo.pshome}/HARP_FILES` : "N/A"}
                                </FileZillaLink>
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>FileZilla</TooltipContent>
                          </Tooltip>
                        </div>
                      </div>

                      <div className="py-2 grid grid-cols-[165px_1fr] items-center gap-3">
                        <Label className="text-[11px] font-semibold text-slate-800">Psoft User</Label>
                        <div className="text-xs font-mono text-slate-900 text-right">
                          {envsharp.serverInfo.psuser || "N/A"}
                        </div>
                      </div>

                      {envsharp.serverInfo.domain ? (
                        <div className="py-2 grid grid-cols-[165px_1fr] items-center gap-3">
                          <Label className="text-[11px] font-semibold text-slate-800">Domaine</Label>
                          <div className="text-xs font-mono text-slate-900 text-right">
                            {envsharp.serverInfo.domain}
                          </div>
                        </div>
                      ) : null}
                    </>
                  ) : null}

                  {envsharp.harpenvinfo?.[0]?.modedt ? (
                    <div className="py-2 grid grid-cols-[165px_1fr] items-center gap-3">
                      <Label className="text-[11px] font-semibold text-slate-800">Dernier mis à jour</Label>
                      <div className="text-xs font-mono text-slate-900 text-right">
                        {new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short" }).format(envsharp.harpenvinfo[0].modedt!)}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          {/* Bloc EnvInfos (doublon) supprimé */}


        </div>
      </CardContent>
      </TooltipProvider>
    </Card>
  );
}
