import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, ArrowLeft, Package } from "lucide-react";
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { db } from "@/lib/db";
import { notFound } from 'next/navigation';

export default async function ViewAppliPage({ 
  params 
}: { 
  params: Promise<{ appli: string; psversion: string }> 
}) {
  const { appli, psversion } = await params;
  
  const decodedAppli = decodeURIComponent(appli);
  const decodedPsversion = decodeURIComponent(psversion);

  const appliData = await db.psadm_appli.findUnique({
    where: {
      appli_psversion: {
        appli: decodedAppli,
        psversion: decodedPsversion,
      },
    },
    include: {
      psadm_env: {
        select: {
          env: true,
        },
        take: 10,
      },
    },
  });

  if (!appliData) {
    return notFound();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-200 to-orange-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Bouton retour */}
        <div className="mb-4">
          <Button asChild variant="outline" className="bg-white hover:bg-gray-50">
            <Link href="/list/appli">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour à la liste
            </Link>
          </Button>
        </div>

        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="harp-card-header">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Package className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-2xl text-white">
                  Application {appliData.appli} ({appliData.psversion})
                </CardTitle>
                <CardDescription className="text-orange-100">
                  {appliData.descr}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-6">
              {/* Informations générales */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-600">Code Application</label>
                  <p className="text-sm mt-1">{appliData.appli}</p>
                </div>
                
                <div>
                  <label className="text-xs font-semibold text-gray-600">Version Psoft</label>
                  <p className="text-sm mt-1">{appliData.psversion}</p>
                </div>

                <div className="md:col-span-2">
                  <label className="text-xs font-semibold text-gray-600">Description</label>
                  <p className="text-sm mt-1">{appliData.descr}</p>
                </div>

                {appliData.psadm_env.length > 0 && (
                  <div className="md:col-span-2">
                    <label className="text-xs font-semibold text-gray-600 mb-2 block">
                      Environnements associés ({appliData.psadm_env.length})
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {appliData.psadm_env.map((env) => (
                        <span
                          key={env.env}
                          className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-medium"
                        >
                          {env.env}
                        </span>
                      ))}
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

