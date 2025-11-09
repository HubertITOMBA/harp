import React from 'react'
import prisma from "@/lib/prisma";
import { notFound } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Pencil } from "lucide-react";
import { EditEnvForm } from '@/components/env/EditEnvForm';

const EditEnvPage = async ({ params }: { params: { env: string } }) => {
  const { env } = await params;

  const envData = await prisma.envsharp.findUnique({
    where: { env: env },
    include: {
      statutenv: true,
    },
  });  

  if (!envData) {
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
                  Modifier l&apos;environnement <span className="uppercase">{env}</span>
                </CardTitle>
                <CardDescription className="text-orange-100">
                  Modifiez les informations de l&apos;environnement
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <EditEnvForm env={envData} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default EditEnvPage;

