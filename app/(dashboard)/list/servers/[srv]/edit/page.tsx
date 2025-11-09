import React from 'react'
import prisma from "@/lib/prisma";
import { notFound } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Pencil } from "lucide-react";
import { EditServerForm } from '@/components/server/EditServerForm';

const EditServerPage = async ({ params }: { params: { srv: string } }) => {
  const { srv } = await params;

  const serverData = await prisma.harpserve.findFirst({
    where: { srv: srv },
    include: {
      statutenv: true,
    },
  });  

  if (!serverData) {
    return notFound();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-200 to-orange-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="harp-card-header">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Pencil className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-2xl text-white">
                  Modifier le serveur <span className="uppercase">{srv}</span>
                </CardTitle>
                <CardDescription className="text-orange-100">
                  Modifiez les informations du serveur
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <EditServerForm server={serverData} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default EditServerPage;

