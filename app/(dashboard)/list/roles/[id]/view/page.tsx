import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, ArrowLeft } from "lucide-react";
import { ViewRoleContent } from '@/components/role/ViewRoleContent';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import prisma from "@/lib/prisma";
import { notFound } from 'next/navigation';

export default async function ViewRolePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (!id || isNaN(parseInt(id))) {
    return notFound();
  }

  const roleData = await prisma.harproles.findUnique({
    where: { id: parseInt(id) },
    include: {
      harpuseroles: {
        include: {
          user: {
            select: {
              id: true,
              netid: true,
              nom: true,
              prenom: true,
              email: true,
            }
          }
        }
      }
    }
  });

  if (!roleData) {
    return notFound();
  }

  // Cette page est interceptée par le routing parallèle
  // Le modal sera affiché à la place, mais cette page sert de fallback
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-200 to-orange-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Bouton retour */}
        <div className="mb-4">
          <Button asChild variant="outline" className="bg-white hover:bg-gray-50">
            <Link href="/list/roles">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour à la liste
            </Link>
          </Button>
        </div>

        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="harp-card-header">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Eye className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-2xl text-white">Rôle {roleData.role.toUpperCase()}</CardTitle>
                <CardDescription className="text-orange-100">
                  {roleData.descr}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <ViewRoleContent role={roleData} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

