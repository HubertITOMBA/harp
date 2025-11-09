import prisma from "@/lib/prisma";
import Image from "next/image";
import Link from "next/link";
import { Label } from "@/components/ui/label";
import { PuttyLink } from "./PuttyLink";
import { SQLDeveloperLink } from "./SQLDeveloperLink";
import { SQLPlusLink } from "./SQLPlusLink";
import { PSDMTLink } from "./PSDMTLink";
import { FileZillaLink } from "./FileZillaLink";
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
  Globe
} from "lucide-react";

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-200 to-orange-50 p-4 sm:p-6 lg:p-8 text-[75%]">
      <div className="max-w-7xl mx-auto space-y-6">
      {/* Header avec statistiques */}
      <div className="flex flex-row p-4 justify-between items-center bg-gradient-to-r from-orange-500/10 to-orange-600/10 rounded-xl mb-4 border border-orange-300/30 shadow-lg">
        <div>
          <h1 className="text-3xl font-bold text-harpOrange">
            {envCount} Environnement{envCount > 1 ? "s" : ""}
          </h1>
           <p className="text-sm text-muted-foreground mt-1">
            Type d&apos;environnement : {typenvid}
          </p>  
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
            <CardHeader className="bg-gradient-to-r from-white to-harpSkyLight/5 pb-3">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  {/* Icône de statut */}
                  {envsharp.statutenv?.icone && (
                    <div className="flex-shrink-0">
                      <Image
                        src={`/ressources/${envsharp.statutenv.icone}`}
                        alt={envsharp.statutenv.statenv || "Statut"}
                        width={48}
                        height={48}
                        className="rounded-lg"
                      />
                    </div>
                  )}

                  {/* Nom de l'environnement */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link
                        href={envsharp.url || "#"}
                        className="text-2xl font-bold text-harpOrange hover:underline flex items-center gap-2"
                      >
                        {envsharp.env}
                        {envsharp.url && (
                          <ExternalLink className="w-4 h-4 text-muted-foreground" />
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
            <CardContent className="pt-4">
              <Tabs defaultValue="environment" className="w-full">
                <TabsList className="grid w-full grid-cols-3 bg-muted/50">
                  <TabsTrigger
                    value="environment"
                    className="flex items-center gap-2 data-[state=active]:bg-harpOrange data-[state=active]:text-white"
                  >
                    <Info className="w-4 h-4" />
                    Environnement
                  </TabsTrigger>
                  <TabsTrigger
                    value="bases"
                    className="flex items-center gap-2 data-[state=active]:bg-harpOrange data-[state=active]:text-white"
                  >
                    <Database className="w-4 h-4" />
                    Oracle
                  </TabsTrigger>
                  <TabsTrigger
                    value="serveurs"
                    className="flex items-center gap-2 data-[state=active]:bg-harpOrange data-[state=active]:text-white"
                  >
                    <Server className="w-4 h-4" />
                    Serveurs
                  </TabsTrigger>
                </TabsList>

                {/* Onglet Environnement */}
                <TabsContent value="environment" className="mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex gap-4 items-center p-2 rounded-lg hover:bg-muted/50 transition-colors">
                        <Label className="w-32 text-muted-foreground">
                          Version Harp :
                        </Label>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{envsharp.appli}</span>
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

                      {/* <div className="flex gap-4 items-center p-2 rounded-lg hover:bg-muted/50 transition-colors">
                        <Label className="w-32 text-muted-foreground">
                          Type :
                        </Label>
                        <span className="font-semibold">
                          {envsharp.typenvid}
                        </span>
                      </div> */}

                      <div className="flex gap-4 items-center p-2 rounded-lg hover:bg-muted/50 transition-colors">
                        <Label className="w-32 text-muted-foreground">
                          Instance Oracle :
                        </Label>
                        <span className="font-semibold">
                          {envsharp.instanceId || "N/A"}
                        </span>
                        <SQLDeveloperLink className="font-semibold text-harpOrange hover:underline cursor-pointer">
                          {envsharp.aliasql || "N/A"} - {envsharp.orarelease || "N/A"}
                        </SQLDeveloperLink>
                      </div>

                      <div className="flex gap-4 items-center p-2 rounded-lg hover:bg-muted/50 transition-colors">
                        <Label className="w-32 text-muted-foreground">
                          Alias SQL*Net / Schema  :
                        </Label>
                        <SQLPlusLink className="font-semibold text-sm text-harpOrange hover:underline cursor-pointer">
                          {envsharp.aliasql || "N/A"} / {envsharp.oraschema || "N/A"}
                        </SQLPlusLink>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex gap-4 items-center p-2 rounded-lg hover:bg-muted/50 transition-colors">
                        <Label className="w-32 text-muted-foreground">
                          Schéma Oracle :
                        </Label>
                        <PSDMTLink className="font-semibold text-harpOrange hover:underline cursor-pointer">
                          {envsharp.oraschema || "N/A"}
                        </PSDMTLink>
                      </div>

                      <div className="flex gap-4 items-center p-2 rounded-lg hover:bg-muted/50 transition-colors">
                        <Label className="w-32 text-muted-foreground">
                          Version PSoft :
                        </Label>
                        <Link
                          href={envsharp.url || "#"}
                          className="font-semibold text-harpOrange hover:underline"
                        >
                          {envsharp.psversion || "N/A"}
                        </Link>
                      </div>

                      <div className="flex gap-4 items-center p-2 rounded-lg hover:bg-muted/50 transition-colors">
                        <Label className="w-32 text-muted-foreground">
                          Version PTools :
                        </Label>
                        <Link
                          href={envsharp.url || "#"}
                          className="font-semibold text-harpOrange hover:underline"
                        >
                          {envsharp.ptversion || "N/A"}
                        </Link>
                      </div>

                      <div className="flex gap-4 items-center p-2 rounded-lg hover:bg-muted/50 transition-colors">
                        <Label className="w-32 text-muted-foreground">
                          Version Cobol :
                        </Label>
                        <span className="font-semibold">
                          {envsharp.volum || "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Onglet Oracle - Lazy loading */}
                <TabsContent value="bases" className="mt-4">
                  {/* Informations harpenvinfo - Style EnvInfos */}
                  {envsharp.harpenvinfo && envsharp.harpenvinfo.length > 0 && (
                    <Card className="mt-4">
                      <CardHeader>
                        <CardTitle>Informations Environnement</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {(() => {
                          const envInfo = envsharp.harpenvinfo[0];
                          return (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {envInfo.datadt && (
                                <div className="flex gap-4 items-center p-2 rounded-lg hover:bg-muted/50 transition-colors">
                                  <Label className="w-32 text-muted-foreground">
                                    Image production :
                                  </Label>
                                  <Label className="font-semibold text-sm">
                                    {new Intl.DateTimeFormat("fr-FR", {
                                      dateStyle: "short",
                                      timeStyle: "medium",
                                    }).format(envInfo.datadt)}
                                  </Label>
                                </div>
                              )}
                              {envInfo.refreshdt && (
                                <div className="flex gap-4 items-center p-2 rounded-lg hover:bg-muted/50 transition-colors">
                                  <Label className="w-32 text-muted-foreground">
                                    Dernier refresh :
                                  </Label>
                                  <Label className="font-semibold text-sm">
                                    {new Intl.DateTimeFormat("fr-FR", {
                                      dateStyle: "short",
                                      timeStyle: "medium",
                                    }).format(envInfo.refreshdt)}
                                  </Label>
                                </div>
                              )}
                              {envInfo.modedt && (
                                <div className="flex gap-4 items-center p-2 rounded-lg hover:bg-muted/50 transition-colors">
                                  <Label className="w-32 text-muted-foreground">
                                    Dernier mis à jour :
                                  </Label>
                                  <Label className="font-semibold text-sm">
                                    {new Intl.DateTimeFormat("fr-FR", {
                                      dateStyle: "short",
                                      timeStyle: "short",
                                    }).format(envInfo.modedt)}
                                  </Label>
                                </div>
                              )}
                              {envInfo.datmaj && (
                                <div className="flex gap-4 items-center p-2 rounded-lg hover:bg-muted/50 transition-colors">
                                  <Label className="w-32 text-muted-foreground">
                                    Date maj :
                                  </Label>
                                  <Label className="font-semibold text-sm">
                                    {new Intl.DateTimeFormat("fr-FR", {
                                      dateStyle: "short",
                                      timeStyle: "short",
                                    }).format(envInfo.datmaj)}
                                  </Label>
                                </div>
                              )}
                              {envInfo.userunx && (
                                <div className="flex gap-4 items-center p-2 rounded-lg hover:bg-muted/50 transition-colors">
                                  <Label className="w-32 text-muted-foreground">
                                    Sudo Sudoer :
                                  </Label>
                                  <Label className="bg-harpOrange text-white p-1 rounded-xl text-sm">
                                    {envInfo.userunx}
                                  </Label>
                                </div>
                              )}
                              {envInfo.pswd_ft_exploit && (
                                <div className="flex gap-4 items-center p-2 rounded-lg hover:bg-muted/50 transition-colors">
                                  <Label className="w-32 text-muted-foreground">
                                    password FT_EXPLOIT :
                                  </Label>
                                  <Label className="text-red-600 font-semibold text-sm">
                                    Clique ici pour copier le mot de passe
                                  </Label>
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
                    <Card className="mt-4">
                      <CardHeader>
                        <CardTitle>Informations Serveur</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="flex gap-4 items-center p-2 rounded-lg hover:bg-muted/50 transition-colors">
                            <Label className="w-32 text-muted-foreground">
                              Serveur :
                            </Label>
                            <PuttyLink
                              host={envsharp.serverInfo.srv || envsharp.serverInfo.ip || ""}
                              ip={envsharp.serverInfo.ip || ""}
                              className="font-semibold text-sm text-harpOrange hover:underline cursor-pointer"
                            >
                              {envsharp.serverInfo.srv || "N/A"} {envsharp.serverInfo.ip ? `(${envsharp.serverInfo.ip})` : ""}
                            </PuttyLink>
                          </div>






                          
                          {/* <div className="flex gap-4 items-center p-2 rounded-lg hover:bg-muted/50 transition-colors">
                            <Label className="w-32 text-muted-foreground">
                              IP :
                            </Label>
                            <Label className="font-semibold text-sm">
                              {envsharp.serverInfo.ip || "N/A"}
                            </Label>
                          </div> */}
                          <div className="flex gap-4 items-center p-2 rounded-lg hover:bg-muted/50 transition-colors">
                            <Label className="w-32 text-muted-foreground">
                              PS Home :
                            </Label>
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
                          <div className="flex gap-4 items-center p-2 rounded-lg hover:bg-muted/50 transition-colors">
                            <Label className="w-32 text-muted-foreground">
                              Psoft User :
                            </Label>
                            <Label className="font-semibold text-sm">
                              {envsharp.serverInfo.psuser || "N/A"}
                            </Label>
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
                            <div className="flex gap-4 items-center p-2 rounded-lg hover:bg-muted/50 transition-colors">
                              <Label className="w-32 text-muted-foreground">
                                Domaine :
                              </Label>
                              <Label className="font-semibold text-sm">
                                {envsharp.serverInfo.domain}
                              </Label>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                {/* Onglet Serveurs - Lazy loading */}
                <TabsContent value="serveurs" className="mt-4">
                  <EnvServRoles id={envsharp.id} />
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
