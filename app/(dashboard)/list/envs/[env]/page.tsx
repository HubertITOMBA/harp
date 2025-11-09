 
import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import prisma from "@/lib/prisma";
import { notFound } from 'next/navigation';
import EnvServRoles from '@/components/harp/EnvServRoles';
import { Label } from "@/components/ui/label";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Server, 
  Database, 
  Calendar, 
  Clock,
  FileText,
  Key,
  User,
  Code,
  MessageSquare,
  Activity,
  Shield,
  ArrowLeft
} from "lucide-react";


const EnvSinglePage = async ({ params }: { params: { env: string } }) => {
  const { env } = await params;

  const Envs = await prisma.envsharp.findUnique({
      where: { env: env },
        include: {
          statutenv: true,
          harptypenv: true,
        },
     });  

     if (!Envs) {
      return notFound();
    } 

     
     const envInfos = await prisma.harpenvinfo.findUnique({ where: { envId: Envs.id } });  

      
        const dbServers = await prisma.harpenvserv.findFirst({
          where: {
              typsrv: "DB",
              envId: Envs.id,
              // serverId: {
              //     equals: prisma.harpserve. // Note: ceci ne fonctionnera pas comme prévu
              // }
          },
          select: {
              serverId: true,
              // env: true,
              typsrv: true,
              harpserve: {
                  select: {
                      srv: true,
                      ip: true,
                      pshome: true,
                      psuser: true,
                      domain: true
                  }
              }
          }
      });

    const envMonitor = await prisma.psadm_monitor.findFirst({
      where: {
        env: env,
      },
      orderBy: {
        monitordt: 'desc'
      },
      select: {
        env: true,
        monitordt: true,
        dbstatus: true,
        nbdom: true,
        asstatus1: true,
        asstatus2: true,
        asstatus3: true,
        asstatus4: true,
        asstatus5: true,
        lastasdt: true,
        prcsunxstatus: true,
        lastprcsunxdt: true,
        prcsntstatus: true,
        lastprcsntdt: true,
        lastlogin: true,
        lastlogindt: true
      }
    });





  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-200 to-orange-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Bouton retour */}
        <div className="mb-4">
          <Button asChild variant="outline" className="bg-white hover:bg-gray-50">
            <Link href="/list/envs">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour à la liste
            </Link>
          </Button>
        </div>
        
        {/* En-tête avec icône et nom */}
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-4 flex-wrap lg:flex-nowrap">
              <div className="relative shrink-0">
                <Image 
                  src={`/ressources/${Envs.statutenv?.icone || 'special.png'}`} 
                  alt={`Statut ${Envs.env}`} 
                  width={50} 
                  height={50} 
                  className="rounded-lg border-2 border-orange-200"
                />
              </div>
              <div className="flex-1 min-w-[200px]">
                {Envs.url ? (
                  <Link href={Envs.url} target="_blank" rel="noopener noreferrer" className="hover:text-orange-600 transition-colors">
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-0.5">
                      {Envs.env}
                    </h1>
                  </Link>
                ) : (
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-0.5">
                    {Envs.env}
                  </h1>
                )}
                  {Envs.descr && (
                   <p className="text-xs text-gray-800 mb-1.5">
                      {Envs.descr}
                    </p>
                  )}
                <div className="flex items-center gap-2 flex-wrap mt-1.5">
                  {Envs.anonym === "N" ? null : (
                    <Image src="/ressources/anonym.png" alt="Anonymisé" width={20} height={20} />
                  )}
                  {Envs.edi === "N" ? null : (
                    <Image src="/ressources/edi.png" alt="EDI" width={80} height={16} className="bg-transparent" />
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>



        {/* Section Informations générales */}
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="harp-card-header">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Server className="h-6 w-6" />
              </div>
              <CardTitle className="text-xl sm:text-2xl">Informations générales</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-2">
                  <Shield className="h-3 w-3 text-orange-600" />
                  Environnement
                </Label>
                <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-200 text-xs font-medium text-gray-900">
                  {Envs.harptypenv?.descr || Envs.harptypenv?.typenv || '-'}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-2">
                  <Code className="h-3 w-3 text-orange-600" />
                  Application
                </Label>
                <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-200 text-xs font-medium text-gray-900">
                  {Envs.appli || '-'}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-2">
                  <FileText className="h-3 w-3 text-orange-600" />
                  Version Harp
                </Label>
                <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-200 text-xs font-medium text-gray-900">
                  {Envs.harprelease || '-'}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-2">
                  <Database className="h-3 w-3 text-orange-600" />
                  Alias SQL *Net
                </Label>
                <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-200 text-xs font-medium text-gray-900">
                  {Envs.aliasql || '-'}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-2">
                  <Database className="h-3 w-3 text-orange-600" />
                  Schema Owner
                </Label>
                <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-200 text-xs font-medium text-gray-900">
                  {Envs.oraschema || '-'}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-2">
                  <User className="h-3 w-3 text-orange-600" />
                  PeopleSoft User
                </Label>
                <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-200 text-xs font-medium text-gray-900">
                  {dbServers?.harpserve?.psuser || '-'}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-2">
                  <Server className="h-3 w-3 text-orange-600" />
                  PeopleSoft
                </Label>
                <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-200 text-xs font-medium text-gray-900">
                  {Envs.psversion || '-'}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-2">
                  <Server className="h-3 w-3 text-orange-600" />
                  PeopleTools
                </Label>
                <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-200 text-xs font-medium text-gray-900">
                  {Envs.ptversion || '-'}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-2">
                  <Calendar className="h-3 w-3 text-orange-600" />
                  Dernière mise à jour
                </Label>
                <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-200 text-xs font-medium text-gray-900">
                  {Envs.datmaj ? new Intl.DateTimeFormat("fr-FR", {dateStyle: 'short', timeStyle: 'short'}).format(Envs.datmaj) : '-'}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-2">
                  <Clock className="h-3 w-3 text-orange-600" />
                  Image production
                </Label>
                <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-200 text-xs font-medium text-gray-900">
                  {envInfos?.datadt ? new Intl.DateTimeFormat("fr-FR", {dateStyle: 'short', timeStyle: 'medium'}).format(envInfos.datadt) : '-'}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-2">
                  <Clock className="h-3 w-3 text-orange-600" />
                  Dernier refresh
                </Label>
                <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-200 text-xs font-medium text-gray-900">
                  {envInfos?.refreshdt ? new Intl.DateTimeFormat("fr-FR", {dateStyle: 'short', timeStyle: 'medium'}).format(envInfos.refreshdt) : '-'}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-2">
                  <Clock className="h-3 w-3 text-orange-600" />
                  Dernier mode
                </Label>
                <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-200 text-xs font-medium text-gray-900">
                  {envInfos?.modedt ? new Intl.DateTimeFormat("fr-FR", {dateStyle: 'short', timeStyle: 'medium'}).format(envInfos.modedt) : '-'}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-2">
                  <Key className="h-3 w-3 text-orange-600" />
                  Password FT_EXPLOIT
                </Label>
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  {envInfos?.pswd_ft_exploit ? (
                    <div className="flex items-center gap-2">
                      <Badge variant="destructive" className="text-xs">Disponible</Badge>
                      <Button size="sm" variant="outline" className="h-7 text-xs">
                        Copier
                      </Button>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-500">-</span>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-2">
                  <User className="h-3 w-3 text-orange-600" />
                  User Unix
                </Label>
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  {envInfos?.userunx ? (
                    <Badge className="bg-orange-500 text-white">{envInfos.userunx}</Badge>
                  ) : (
                    <span className="text-sm text-gray-500">-</span>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-2">
                  <Server className="h-3 w-3 text-orange-600" />
                  DB Serveur IP
                </Label>
                <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-200 text-xs font-medium text-gray-900">
                  {dbServers?.harpserve?.ip || '-'}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-2">
                  <FileText className="h-3 w-3 text-orange-600" />
                  PS Home
                </Label>
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-sm font-medium text-gray-900 font-mono">
                  {dbServers?.harpserve?.pshome ? `${dbServers.harpserve.pshome}/HARP_FILES` : '-'}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-2">
                  <MessageSquare className="h-3 w-3 text-orange-600" />
                  Message
                </Label>
                <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-200 text-xs font-medium text-gray-900">
                  {Envs.msg || '-'}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-2">
                  <Code className="h-3 w-3 text-orange-600" />
                  Version Cobol
                </Label>
                <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-200 text-xs font-medium text-gray-900">
                  {Envs.volum || '-'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section Rôles de serveurs */}
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-t-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Shield className="h-6 w-6" />
              </div>
              <CardTitle className="text-xl sm:text-2xl">Rôles de serveurs de l&apos;environnement {env}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="xl:col-span-2">
                <EnvServRoles id={Envs.id}/>
              </div>
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Activity className="h-5 w-5 text-orange-600" />
                  Activité récente
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <div className="flex-1">
                      <p className="text-xs text-gray-600">Dernière requête SQL domaine AS</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {envMonitor?.lastasdt ? new Intl.DateTimeFormat("fr-FR", {dateStyle: 'short', timeStyle: 'short'}).format(envMonitor.lastasdt) : '-'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Activity className="h-4 w-4 text-gray-500" />
                    <div className="flex-1">
                      <p className="text-xs text-gray-600">Dernier Heartbeat PRCS UNIX</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {envMonitor?.lastprcsunxdt ? new Intl.DateTimeFormat("fr-FR", {dateStyle: 'short', timeStyle: 'short'}).format(envMonitor.lastprcsunxdt) : '-'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <User className="h-4 w-4 text-gray-500" />
                    <div className="flex-1">
                      <p className="text-xs text-gray-600">Dernière connexion</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {envMonitor?.lastlogin ? `${envMonitor.lastlogin} à ${envMonitor.lastlogindt ? new Intl.DateTimeFormat("fr-FR", {dateStyle: 'short', timeStyle: 'short'}).format(envMonitor.lastlogindt) : '-'}` : '-'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Bouton retour en bas */}
        <div className="mt-6 flex justify-start">
          <Button asChild variant="outline" className="bg-white hover:bg-gray-50">
            <Link href="/list/envs">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour à la liste
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}


export default EnvSinglePage;



