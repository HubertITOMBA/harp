import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import prisma from "@/lib/prisma";
import { notFound } from 'next/navigation';
import { Label } from "@/components/ui/label";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ServerConnectionButtons } from '@/components/ui/server-connection-buttons';
import { 
  Server, 
  Network, 
  Monitor, 
  User, 
  Globe,
  ArrowLeft,
  Activity
} from "lucide-react";

const ServSinglePage = async ({ params }: { params: { srv: string } }) => {
  const { srv } = await params;

  const Servs = await prisma.harpserve.findFirst({
    where: { srv: srv },
    include: {
      statutenv: true,
    },
  });  

  if (!Servs) {
    return notFound();
  }

  // Récupérer les rôles du serveur
  const ServRoles = await prisma.psadm_rolesrv.findMany({
    where: {
      srv: srv,
    },
    include: {
      psadm_typsrv: true,
    }
  }); 
     
  const CountServRoles = await prisma.psadm_rolesrv.count({ 
    where: {
      srv: srv,
    }
  });
  
  const Apps = await prisma.psadm_rolesrv.groupBy({ 
    by: ['typsrv'],
    where: {
      srv: srv,
    },
    _count: {
      srv: true 
    },
  });


  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-200 to-orange-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Bouton retour */}
        <div className="mb-4">
          <Button asChild variant="outline" className="bg-white hover:bg-gray-50">
            <Link href="/list/servers">
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
                  src={`/ressources/${Servs.statutenv?.icone || 'special.png'}`} 
                  alt={`Statut ${Servs.srv}`} 
                  width={50} 
                  height={50} 
                  className="rounded-lg border-2 border-orange-200"
                />
              </div>
              <div className="flex-1 min-w-[200px]">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-0.5">
                  {Servs.srv}
                </h1>
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
                  <Network className="h-3 w-3 text-orange-600" />
                  Adresse IP
                </Label>
                <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-200 text-xs font-medium text-gray-900 font-mono">
                  {Servs.ip}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-2">
                  <Monitor className="h-3 w-3 text-orange-600" />
                  Système d&apos;exploitation
                </Label>
                <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-200 text-xs font-medium text-gray-900">
                  <Badge variant="outline" className="text-[10px] py-0 px-1.5">
                    {Servs.os || '-'}
                  </Badge>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-2">
                  <User className="h-3 w-3 text-orange-600" />
                  PS User
                </Label>
                <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-200 text-xs font-medium text-gray-900">
                  {Servs.psuser || '-'}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-2">
                  <Globe className="h-3 w-3 text-orange-600" />
                  Domaine
                </Label>
                <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-200 text-xs font-medium text-gray-900">
                  {Servs.domain || '-'}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-2">
                  <Server className="h-3 w-3 text-orange-600" />
                  PS Home
                </Label>
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-sm font-medium text-gray-900 font-mono">
                  {Servs.pshome}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section Connexion rapide */}
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-t-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Activity className="h-6 w-6" />
              </div>
              <CardTitle className="text-xl sm:text-2xl">Connexion rapide</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <ServerConnectionButtons 
              ip={Servs.ip}
              srv={Servs.srv}
              psuser={Servs.psuser || undefined}
            />
          </CardContent>
        </Card>

        {/* Section Applications du serveur */}
        {CountServRoles > 0 && (
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-t-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Server className="h-6 w-6" />
                </div>
                <CardTitle className="text-xl sm:text-2xl">
                  {CountServRoles} Application{CountServRoles > 1 ? 's' : ''} sur {srv}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr className="bg-harpOrange text-white">
                      <th className="px-4 py-3 text-left text-xs sm:text-sm font-semibold text-white">Environnement</th>
                      <th className="px-4 py-3 text-left text-xs sm:text-sm font-semibold text-white">Type</th>
                      <th className="px-4 py-3 text-left text-xs sm:text-sm font-semibold text-white">Description</th>
                      <th className="px-4 py-3 text-left text-xs sm:text-sm font-semibold text-white">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {ServRoles.map((item, index) => (
                      <tr key={index} className="hover:bg-harpSkyLight transition-colors duration-200">
                        <td className="px-4 py-3 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                          {item.env}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                          <Badge className="bg-orange-500 text-white text-[10px] py-0 px-1.5">
                            {item.typsrv}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-xs sm:text-sm text-gray-600">
                          {item.psadm_typsrv?.descr || '-'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-xs sm:text-sm">
                          {item.status === 1 ? (
                            <div className="flex items-center gap-1">
                              <Image src="/ressources/OK.png" alt="Actif" width={14} height={14} className="bg-transparent" />
                              <span className="text-[10px] text-green-600 hidden sm:inline">Actif</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              <Image src="/ressources/KO.png" alt="Inactif" width={14} height={14} className="bg-transparent" />
                              <span className="text-[10px] text-red-600 hidden sm:inline">Inactif</span>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Bouton retour en bas */}
        <div className="mt-6 flex justify-start">
          <Button asChild variant="outline" className="bg-white hover:bg-gray-50">
            <Link href="/list/servers">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour à la liste
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}


export default ServSinglePage;



