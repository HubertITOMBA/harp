import React from 'react'
import prisma from "@/lib/prisma";
import { notFound, redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Shield, ArrowLeft } from "lucide-react";
import Link from 'next/link';
import { addUserRoles } from '@/actions/user-roles';
import { AddRolesForm } from '@/components/user/AddRolesForm';

const AddRolesPage = async ({ params }: { params: { netid: string } }) => {
  const { netid } = await params;

  const user = await prisma.psadm_user.findUnique({
    where: { netid: netid },
    select: {
      netid: true,
      prenom: true,
      nom: true
    }
  });  

  if (!user) {
    return notFound();
  }

  // Récupérer tous les rôles disponibles
  const allRoles = await prisma.psadm_role.findMany({
    orderBy: {
      role: 'asc'
    }
  });

  // Récupérer les rôles déjà attribués
  const userRoles = await prisma.psadm_roleuser.findMany({
    where: {
      netid: netid,
    },
    select: {
      role: true
    }
  });

  const assignedRoleNames = userRoles.map(ur => ur.role);
  const availableRoles = allRoles.filter(role => !assignedRoleNames.includes(role.role));

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-200 to-orange-50 p-3 sm:p-4 lg:p-6">
      <div className="max-w-4xl mx-auto space-y-4">
        {/* En-tête */}
        <div className="flex items-center gap-3">
          <Link href={`/list/users/${netid}`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Ajouter des rôles
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              Pour <span className="font-semibold uppercase text-orange-600">{user.netid}</span> - {user.prenom} {user.nom}
            </p>
          </div>
        </div>

        {/* Card de sélection */}
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-t-lg p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-white/20 rounded-lg">
                <Shield className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <div>
                <CardTitle className="text-xl sm:text-2xl text-white">Sélectionner les rôles</CardTitle>
                <CardDescription className="text-orange-100 text-xs sm:text-sm">
                  Choisissez un ou plusieurs rôles à attribuer
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-3 sm:p-4">
            <AddRolesForm 
              netid={netid} 
              availableRoles={availableRoles}
              assignedRoles={assignedRoleNames}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default AddRolesPage;

