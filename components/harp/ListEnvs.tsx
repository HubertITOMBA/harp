import prisma from "@/lib/prisma";
import Image from "next/image";
import Link from "next/link";
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
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import EnvServRoles from "./EnvServRoles";
import { Badge } from "@/components/ui/badge";
import { EnvSearchAndNavigation } from "./EnvSearchAndNavigation";
import { 
  Database, 
  Server, 
  Info, 
  ExternalLink,
  Lock,
  Globe,
  Activity
} from "lucide-react";
import { CopyPasswordButton } from "./CopyPasswordButton";

interface EnvInfoProps {
  typenvid: number;
}

const HarpEnvPage = async ({ typenvid }: EnvInfoProps) => {
  // Optimisation : Une seule requête avec tous les includes nécessaires
  const DescEnvs = await prisma.envsharp.findMany({
    where: {
      typenvid: typenvid,
    },
    include: {
      statutenv: {
        select: {
          id: true,
          statenv: true,
          icone: true,
        },
      },
      harpenvinfo: true,
      harpenvdispo: {
        orderBy: {
          fromdate: "desc",
        },
        take: 1,
      },
      harptypenv: true,
      releaseenv: true,
      psoftversion: true,
      ptoolsversion: true,
    },
    orderBy: {
      env: "asc",
    },
  });

  // Récupérer les serveurs pour chaque environnement
  const envsWithServers = await Promise.all(
    DescEnvs.map(async (env) => {
      // Essayer d'abord de récupérer un serveur DB
      let serverInfo = null;
      const dbServer = await prisma.harpenvserv.findFirst({
        where: {
          envId: env.id,
          typsrv: "DB",
        },
        select: {
          harpserve: {
            select: {
              ip: true,
              psuser: true,
              srv: true,
              pshome: true,
              os: true,
              domain: true,
            },
          },
        },
      });
      serverInfo = dbServer?.harpserve || null;

      // Si pas de serveur DB, récupérer le premier serveur disponible
      if (!serverInfo) {
        const fallbackServer = await prisma.harpenvserv.findFirst({
          where: {
            envId: env.id,
          },
          select: {
            harpserve: {
              select: {
                ip: true,
                psuser: true,
                srv: true,
                pshome: true,
                os: true,
                domain: true,
              },
            },
          },
        });
        serverInfo = fallbackServer?.harpserve || null;
      }

      return {
        ...env,
        serverInfo,
      };
    })
  );

  const envCount = await prisma.envsharp.count({
    where: {
      typenvid: typenvid,
    },
  });

  // Récupérer le nom du menu depuis harpmenus
  const menu = await prisma.harpmenus.findFirst({
    where: { display: typenvid },
    select: { menu: true },
  });

  const menuName = menu?.menu || `Menu ${typenvid}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-200 to-orange-50 p-2 sm:p-3 text-[75%]">
      <div className="max-w-7xl mx-auto space-y-2">
      {/* Header avec statistiques */}
      <div className="flex flex-row p-2 justify-between items-center bg-gradient-to-r from-orange-500/10 to-orange-600/10 rounded-lg mb-2 border border-orange-300/30 shadow-md">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-harpOrange">
            {menuName} : {envCount} Environnement{envCount > 1 ? "s" : ""}
          </h1>
        </div>
      </div>

      {/* Liste des environnements avec recherche et navigation */}
      <EnvSearchAndNavigation 
        envCount={envCount}
        envsData={envsWithServers.map((env) => ({
          id: env.id,
          env: env.env,
          descr: env.descr,
          aliasql: env.aliasql,
          oraschema: env.oraschema,
          psversion: env.psversion,
          ptversion: env.ptversion,
          harprelease: env.harprelease,
          statutenv: env.statutenv,
          serverInfo: env.serverInfo,
        }))}
      >
        {envsWithServers.map((envsharp) => (
          <Card
            key={envsharp.id}
            data-env-id={envsharp.id}
            className="w-full shadow-lg hover:shadow-xl transition-all duration-300 border-2 hover:border-harpOrange/30"
          >
            {/* En-tête de l'environnement */}
            <CardHeader className="bg-gradient-to-r from-white to-harpSkyLight/5 pb-2 pt-3 px-3">
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
                      <Link
                        href={envsharp.url || "#"}
                        className="text-lg sm:text-xl font-bold text-harpOrange hover:underline flex items-center gap-1.5"
                      >
                        {envsharp.env}
                        {envsharp.url && (
                          <ExternalLink className="w-3 h-3 text-muted-foreground" />
                        )}
                      </Link>
                      {envsharp.anonym === "N" ? null : (
                        <Badge variant="outline" className="text-xs">
                          <Lock className="w-3 h-3 mr-1" />
                          Anonyme
                        </Badge>
                      )}
                      {envsharp.edi === "N" ? null : (
                        <Badge variant="secondary" className="text-xs">
                          <Globe className="w-3 h-3 mr-1" />
                          EDI
                        </Badge>
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

            {/* Contenu avec onglets */}
            <CardContent className="pt-2 px-3 pb-3">
              <Tabs defaultValue="environment" className="w-full">
                <TabsList className="grid w-full grid-cols-4 bg-slate-100 border border-slate-300 shadow-sm text-xs py-1">
                  <TabsTrigger
                    value="environment"
                    className="flex items-center gap-1 px-2 py-1.5 text-xs data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-orange-600 data-[state=active]:text-white data-[state=active]:shadow-md border-r border-slate-300 transition-all"
                  >
                    <Info className="w-3 h-3" />
                    Environnement
                  </TabsTrigger>
                  <TabsTrigger
                    value="bases"
                    className="flex items-center gap-1 px-2 py-1.5 text-xs data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-orange-600 data-[state=active]:text-white data-[state=active]:shadow-md border-r border-slate-300 transition-all"
                  >
                    <Database className="w-3 h-3" />
                    Oracle
                  </TabsTrigger>
                  <TabsTrigger
                    value="serveurs"
                    className="flex items-center gap-1 px-2 py-1.5 text-xs data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-orange-600 data-[state=active]:text-white data-[state=active]:shadow-md border-r border-slate-300 transition-all"
                  >
                    <Server className="w-3 h-3" />
                    Serveurs
                  </TabsTrigger>
                  <TabsTrigger
                    value="statut"
                    className="flex items-center gap-1 px-2 py-1.5 text-xs data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-orange-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all"
                  >
                    <Activity className="w-3 h-3" />
                    Statut
                  </TabsTrigger>
                </TabsList>

                {/* Onglet Environnement */}
                <TabsContent value="environment" className="mt-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <div className="space-y-1">
                        <Label className="text-[9px] sm:text-[10px] font-semibold text-slate-700 uppercase tracking-wide flex items-center gap-1 sm:gap-2 bg-slate-100 px-2 py-1 rounded-t-md">
                          <Info className="h-3 w-3 sm:h-4 sm:w-4 text-orange-600" />
                          Version Harp
                        </Label>
                        <div className="p-2 sm:p-2.5 bg-orange-50 rounded-md rounded-tl-none border border-orange-200 border-t-0 text-xs font-medium text-slate-900 font-mono shadow-sm">
                          <div className="flex items-center gap-2">
                            <span>{envsharp.appli}</span>
                            {envsharp.harprelease && (
                              <Link
                                href={envsharp.url || "#"}
                                className="text-sm font-bold text-harpOrange hover:underline"
                              >
                                {envsharp.harprelease}
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-[9px] sm:text-[10px] font-semibold text-slate-700 uppercase tracking-wide flex items-center gap-1 sm:gap-2 bg-slate-100 px-2 py-1 rounded-t-md">
                          <Database className="h-3 w-3 sm:h-4 sm:w-4 text-orange-600" />
                          Instance Oracle
                        </Label>
                        <div className="p-2 sm:p-2.5 bg-orange-50 rounded-md rounded-tl-none border border-orange-200 border-t-0 text-xs font-medium text-slate-900 font-mono shadow-sm">
                          <span>{envsharp.instanceId || "N/A"}</span>
                          <SQLDeveloperLink className="ml-2 font-semibold text-harpOrange hover:underline cursor-pointer">
                            {envsharp.aliasql || "N/A"} - {envsharp.orarelease || "N/A"}
                          </SQLDeveloperLink>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-[9px] sm:text-[10px] font-semibold text-slate-700 uppercase tracking-wide flex items-center gap-1 sm:gap-2 bg-slate-100 px-2 py-1 rounded-t-md">
                          <Database className="h-3 w-3 sm:h-4 sm:w-4 text-orange-600" />
                          Alias SQL*Net / Schema
                        </Label>
                        <div className="p-2 sm:p-2.5 bg-orange-50 rounded-md rounded-tl-none border border-orange-200 border-t-0 text-xs font-medium text-slate-900 font-mono shadow-sm">
                          <SQLPlusLink className="font-semibold text-sm text-harpOrange hover:underline cursor-pointer">
                            {envsharp.aliasql || "N/A"} / {envsharp.oraschema || "N/A"}
                          </SQLPlusLink>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="space-y-1">
                        <Label className="text-[9px] sm:text-[10px] font-semibold text-slate-700 uppercase tracking-wide flex items-center gap-1 sm:gap-2 bg-slate-100 px-2 py-1 rounded-t-md">
                          <Database className="h-3 w-3 sm:h-4 sm:w-4 text-orange-600" />
                          Schéma Oracle
                        </Label>
                        <div className="p-2 sm:p-2.5 bg-orange-50 rounded-md rounded-tl-none border border-orange-200 border-t-0 text-xs font-medium text-slate-900 font-mono shadow-sm">
                          <PSDMTLink className="font-semibold text-harpOrange hover:underline cursor-pointer">
                            {envsharp.oraschema || "N/A"}
                          </PSDMTLink>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-[9px] sm:text-[10px] font-semibold text-slate-700 uppercase tracking-wide flex items-center gap-1 sm:gap-2 bg-slate-100 px-2 py-1 rounded-t-md">
                          <Info className="h-3 w-3 sm:h-4 sm:w-4 text-orange-600" />
                          Version PSoft
                        </Label>
                        <div className="p-2 sm:p-2.5 bg-orange-50 rounded-md rounded-tl-none border border-orange-200 border-t-0 text-xs font-medium text-slate-900 font-mono shadow-sm">
                          <PSIDELink className="font-semibold text-harpOrange hover:underline cursor-pointer">
                            {envsharp.psversion || "N/A"}
                          </PSIDELink>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-[9px] sm:text-[10px] font-semibold text-slate-700 uppercase tracking-wide flex items-center gap-1 sm:gap-2 bg-slate-100 px-2 py-1 rounded-t-md">
                          <Info className="h-3 w-3 sm:h-4 sm:w-4 text-orange-600" />
                          Version PTools
                        </Label>
                        <div className="p-2 sm:p-2.5 bg-orange-50 rounded-md rounded-tl-none border border-orange-200 border-t-0 text-xs font-medium text-slate-900 font-mono shadow-sm">
                          <Link
                            href={envsharp.url || "#"}
                            className="font-semibold text-harpOrange hover:underline"
                          >
                            {envsharp.ptversion || "N/A"}
                          </Link>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-[9px] sm:text-[10px] font-semibold text-slate-700 uppercase tracking-wide flex items-center gap-1 sm:gap-2 bg-slate-100 px-2 py-1 rounded-t-md">
                          <Info className="h-3 w-3 sm:h-4 sm:w-4 text-orange-600" />
                          Version Cobol
                        </Label>
                        <div className="p-2 sm:p-2.5 bg-orange-50 rounded-md rounded-tl-none border border-orange-200 border-t-0 text-xs font-medium text-slate-900 font-mono shadow-sm">
                          {envsharp.volum || "N/A"}
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Onglet Oracle - Lazy loading */}
                <TabsContent value="bases" className="mt-2">
                  {/* Informations harpenvinfo - Style EnvInfos */}
                  {envsharp.harpenvinfo && envsharp.harpenvinfo.length > 0 && (
                    <Card className="mt-2">
                      <CardHeader className="pb-2 pt-3 px-3">
                        <CardTitle className="text-sm">Informations Environnement</CardTitle>
                      </CardHeader>
                      <CardContent className="px-3 pb-3">
                        {(() => {
                          const envInfo = envsharp.harpenvinfo[0];
                          return (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {envInfo.datadt && (
                                <div className="space-y-1">
                                  <Label className="text-[9px] sm:text-[10px] font-semibold text-slate-700 uppercase tracking-wide flex items-center gap-1 sm:gap-2 bg-slate-100 px-2 py-1 rounded-t-md">
                                    <Info className="h-3 w-3 sm:h-4 sm:w-4 text-orange-600" />
                                    Image production
                                  </Label>
                                  <div className="p-2 sm:p-2.5 bg-orange-50 rounded-md rounded-tl-none border border-orange-200 border-t-0 text-xs font-medium text-slate-900 font-mono shadow-sm">
                                    {new Intl.DateTimeFormat("fr-FR", {
                                      dateStyle: "short",
                                      timeStyle: "medium",
                                    }).format(envInfo.datadt)}
                                  </div>
                                </div>
                              )}
                              {envInfo.refreshdt && (
                                <div className="space-y-1">
                                  <Label className="text-[9px] sm:text-[10px] font-semibold text-slate-700 uppercase tracking-wide flex items-center gap-1 sm:gap-2 bg-slate-100 px-2 py-1 rounded-t-md">
                                    <Info className="h-3 w-3 sm:h-4 sm:w-4 text-orange-600" />
                                    Dernier refresh
                                  </Label>
                                  <div className="p-2 sm:p-2.5 bg-orange-50 rounded-md rounded-tl-none border border-orange-200 border-t-0 text-xs font-medium text-slate-900 font-mono shadow-sm">
                                    {new Intl.DateTimeFormat("fr-FR", {
                                      dateStyle: "short",
                                      timeStyle: "medium",
                                    }).format(envInfo.refreshdt)}
                                  </div>
                                </div>
                              )}
                              {envInfo.modedt && (
                                <div className="space-y-1">
                                  <Label className="text-[9px] sm:text-[10px] font-semibold text-slate-700 uppercase tracking-wide flex items-center gap-1 sm:gap-2 bg-slate-100 px-2 py-1 rounded-t-md">
                                    <Info className="h-3 w-3 sm:h-4 sm:w-4 text-orange-600" />
                                    Dernier mis à jour
                                  </Label>
                                  <div className="p-2 sm:p-2.5 bg-orange-50 rounded-md rounded-tl-none border border-orange-200 border-t-0 text-xs font-medium text-slate-900 font-mono shadow-sm">
                                    {new Intl.DateTimeFormat("fr-FR", {
                                      dateStyle: "short",
                                      timeStyle: "short",
                                    }).format(envInfo.modedt)}
                                  </div>
                                </div>
                              )}
                              {envInfo.datmaj && (
                                <div className="space-y-1">
                                  <Label className="text-[9px] sm:text-[10px] font-semibold text-slate-700 uppercase tracking-wide flex items-center gap-1 sm:gap-2 bg-slate-100 px-2 py-1 rounded-t-md">
                                    <Info className="h-3 w-3 sm:h-4 sm:w-4 text-orange-600" />
                                    Date maj
                                  </Label>
                                  <div className="p-2 sm:p-2.5 bg-orange-50 rounded-md rounded-tl-none border border-orange-200 border-t-0 text-xs font-medium text-slate-900 font-mono shadow-sm">
                                    {new Intl.DateTimeFormat("fr-FR", {
                                      dateStyle: "short",
                                      timeStyle: "short",
                                    }).format(envInfo.datmaj)}
                                  </div>
                                </div>
                              )}
                              {envInfo.userunx && (
                                <div className="space-y-1">
                                  <Label className="text-[9px] sm:text-[10px] font-semibold text-slate-700 uppercase tracking-wide flex items-center gap-1 sm:gap-2 bg-slate-100 px-2 py-1 rounded-t-md">
                                    <Info className="h-3 w-3 sm:h-4 sm:w-4 text-orange-600" />
                                    Sudo Sudoer
                                  </Label>
                                  <div className="p-2 sm:p-2.5 bg-orange-50 rounded-md rounded-tl-none border border-orange-200 border-t-0 text-xs font-medium text-slate-900 font-mono shadow-sm">
                                    <span className="bg-harpOrange text-white px-2 py-1 rounded text-xs">
                                      {envInfo.userunx}
                                    </span>
                                  </div>
                                </div>
                              )}
                              {envInfo.pswd_ft_exploit && (
                                <div className="space-y-1">
                                  <Label className="text-[9px] sm:text-[10px] font-semibold text-slate-700 uppercase tracking-wide flex items-center gap-1 sm:gap-2 bg-slate-100 px-2 py-1 rounded-t-md">
                                    <Info className="h-3 w-3 sm:h-4 sm:w-4 text-orange-600" />
                                    Password FT_EXPLOIT
                                  </Label>
                                  <CopyPasswordButton password={envInfo.pswd_ft_exploit} />
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </CardContent>
                    </Card>
                  )}

                  {/* Informations du serveur - Style EnvInfos */}
                  {envsharp.serverInfo && (
                    <Card className="mt-2">
                      <CardHeader className="pb-2 pt-3 px-3">
                        <CardTitle className="text-sm">Informations Serveur</CardTitle>
                      </CardHeader>
                      <CardContent className="px-3 pb-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <Label className="text-[9px] sm:text-[10px] font-semibold text-slate-700 uppercase tracking-wide flex items-center gap-1 sm:gap-2 bg-slate-100 px-2 py-1 rounded-t-md">
                              <Server className="h-3 w-3 sm:h-4 sm:w-4 text-orange-600" />
                              Serveur
                            </Label>
                            <div className="p-2 sm:p-2.5 bg-orange-50 rounded-md rounded-tl-none border border-orange-200 border-t-0 text-xs font-medium text-slate-900 font-mono shadow-sm">
                              <PuttyLink
                                host={envsharp.serverInfo.srv || envsharp.serverInfo.ip || ""}
                                ip={envsharp.serverInfo.ip || ""}
                                className="font-semibold text-sm text-harpOrange hover:underline cursor-pointer"
                              >
                                {envsharp.serverInfo.srv || "N/A"} {envsharp.serverInfo.ip ? `(${envsharp.serverInfo.ip})` : ""}
                              </PuttyLink>
                            </div>
                          </div>






                          
                          {/* <div className="flex gap-4 items-center p-2 rounded-lg hover:bg-muted/50 transition-colors">
                            <Label className="w-32 text-muted-foreground">
                              IP :
                            </Label>
                            <Label className="font-semibold text-sm">
                              {envsharp.serverInfo.ip || "N/A"}
                            </Label>
                          </div> */}
                          <div className="space-y-1">
                            <Label className="text-[9px] sm:text-[10px] font-semibold text-slate-700 uppercase tracking-wide flex items-center gap-1 sm:gap-2 bg-slate-100 px-2 py-1 rounded-t-md">
                              <Server className="h-3 w-3 sm:h-4 sm:w-4 text-orange-600" />
                              PS Home
                            </Label>
                            <div className="p-2 sm:p-2.5 bg-orange-50 rounded-md rounded-tl-none border border-orange-200 border-t-0 text-xs font-medium text-slate-900 font-mono shadow-sm">
                              <FileZillaLink
                                host={envsharp.serverInfo.ip || envsharp.serverInfo.srv}
                                pshome={envsharp.serverInfo.pshome}
                                className="font-semibold text-sm text-harpOrange hover:underline cursor-pointer"
                              >
                                {envsharp.serverInfo.pshome
                                  ? `${envsharp.serverInfo.pshome}/HARP_FILES`
                                  : "N/A"}
                              </FileZillaLink>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[9px] sm:text-[10px] font-semibold text-slate-700 uppercase tracking-wide flex items-center gap-1 sm:gap-2 bg-slate-100 px-2 py-1 rounded-t-md">
                              <Info className="h-3 w-3 sm:h-4 sm:w-4 text-orange-600" />
                              Psoft User
                            </Label>
                            <div className="p-2 sm:p-2.5 bg-orange-50 rounded-md rounded-tl-none border border-orange-200 border-t-0 text-xs font-medium text-slate-900 font-mono shadow-sm">
                              {envsharp.serverInfo.psuser || "N/A"}
                            </div>
                          </div>
                          {/* {envsharp.serverInfo.os && (
                            <div className="flex gap-4 items-center p-2 rounded-lg hover:bg-muted/50 transition-colors">
                              <Label className="w-32 text-muted-foreground">
                                OS :
                              </Label>
                              <Label className="font-semibold text-sm">
                                {envsharp.serverInfo.os}
                              </Label>
                            </div>
                          )} */}
                          {envsharp.serverInfo.domain && (
                            <div className="space-y-1">
                              <Label className="text-[9px] sm:text-[10px] font-semibold text-slate-700 uppercase tracking-wide flex items-center gap-1 sm:gap-2 bg-slate-100 px-2 py-1 rounded-t-md">
                                <Info className="h-3 w-3 sm:h-4 sm:w-4 text-orange-600" />
                                Domaine
                              </Label>
                              <div className="p-2 sm:p-2.5 bg-orange-50 rounded-md rounded-tl-none border border-orange-200 border-t-0 text-xs font-medium text-slate-900 font-mono shadow-sm">
                                {envsharp.serverInfo.domain}
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                {/* Onglet Serveurs - Lazy loading */}
                <TabsContent value="serveurs" className="mt-2">
                  <EnvServRoles id={envsharp.id} />
                </TabsContent>

                {/* Onglet Statut */}
                <TabsContent value="statut" className="mt-2">
                  <div className="p-2 text-center text-muted-foreground">
                    <p className="text-xs">Les données de statut seront implémentées prochainement.</p>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        ))}
      </EnvSearchAndNavigation>

      {/* Message si aucun environnement */}
      {envsWithServers.length === 0 && (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">
            Aucun environnement trouvé pour ce type.
          </p>
        </Card>
      )}
      </div>
    </div>
  );
};

export default HarpEnvPage;
