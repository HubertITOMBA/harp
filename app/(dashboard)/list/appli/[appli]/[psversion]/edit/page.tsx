import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Pencil, ArrowLeft } from "lucide-react";
import { EditAppliForm } from '@/components/appli/EditAppliForm';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { db } from "@/lib/db";
import { notFound } from 'next/navigation';

export default async function EditAppliPage({ 
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
  });

  if (!appliData) {
    return notFound();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-200 to-orange-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
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
                <Pencil className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-2xl text-white">
                  Modifier l'application {appliData.appli} ({appliData.psversion})
                </CardTitle>
                <CardDescription className="text-orange-100">
                  Modifiez les informations de l'application
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <EditAppliForm appli={appliData} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

