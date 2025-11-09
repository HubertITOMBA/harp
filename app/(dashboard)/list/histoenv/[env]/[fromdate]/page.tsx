import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, History } from "lucide-react";
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { db } from "@/lib/db";
import { notFound } from 'next/navigation';
import Image from 'next/image';

export default async function ViewHistoryPage({ 
  params 
}: { 
  params: Promise<{ env: string; fromdate: string }> 
}) {
  const { env, fromdate } = await params;
  
  const decodedEnv = decodeURIComponent(env);
  const decodedFromdate = new Date(decodeURIComponent(fromdate));

  const entry = await db.psadm_dispo.findUnique({
    where: {
      env_fromdate: {
        env: decodedEnv,
        fromdate: decodedFromdate
      }
    },
    include: {
      psadm_env: {
        select: {
          env: true,
          descr: true
        }
      }
    }
  });

  if (!entry) {
    return notFound();
  }

  // Récupérer l'icône du statut
  let icone = null;
  if (entry.statenvId) {
    const statutenv = await db.statutenv.findUnique({
      where: { id: entry.statenvId },
      select: { icone: true }
    });
    icone = statutenv?.icone || null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-200 to-orange-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Bouton retour */}
        <div className="mb-4">
          <Button asChild variant="outline" className="bg-white hover:bg-gray-50">
            <Link href="/list/histoenv">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour à la liste
            </Link>
          </Button>
        </div>

        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="harp-card-header">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <History className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-xl text-white">
                  Historique - {entry.env}
                </CardTitle>
                <CardDescription className="text-orange-100 text-sm">
                  {new Intl.DateTimeFormat("fr-FR", {
                    dateStyle: 'full',
                    timeStyle: 'short',
                  }).format(entry.fromdate)}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-6">
              {/* Informations générales */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-600">Environnement</label>
                  <p className="text-sm mt-1">{entry.env}</p>
                </div>
                
                <div>
                  <label className="text-xs font-semibold text-gray-600">Date</label>
                  <p className="text-sm mt-1">
                    {new Intl.DateTimeFormat("fr-FR", {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    }).format(entry.fromdate)}
                  </p>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-600">Statut</label>
                  <div className="flex items-center gap-2 mt-1">
                    {icone && (
                      <Image 
                        src={`/ressources/${icone}`} 
                        alt="Statut" 
                        width={20} 
                        height={20} 
                        className="bg-transparent" 
                      />
                    )}
                    <p className="text-sm">{entry.statenv}</p>
                  </div>
                </div>

                {entry.msg && (
                  <div className="md:col-span-2">
                    <label className="text-xs font-semibold text-gray-600 mb-2 block">Message</label>
                    <div className="mt-1 p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-sm text-gray-800 whitespace-pre-wrap break-words leading-relaxed">
                        {entry.msg}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

