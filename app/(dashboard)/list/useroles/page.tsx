import React from 'react'
import { columns } from './columns'
import { db } from "@/lib/db";
import { DataTable } from './data-table';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";
import { CreateUserRolesDialog } from '@/components/useroles/CreateUserRolesDialog';

const UserRoleListPage = async () => {
  // Récupérer les attributions de rôles depuis harpuseroles avec les relations
  const userRolesData = await db.harpuseroles.findMany({
    include: {
      user: {
        select: {
          netid: true
        }
      },
      harproles: {
        select: {
          role: true
        }
      }
    },
    orderBy: {
      datmaj: 'desc'
    }
  });

  // Transformer les données pour correspondre au format attendu par les colonnes
  const data = userRolesData.map(ur => ({
    netid: ur.user.netid || "",
    role: ur.harproles.role,
    rolep: "N", // La table harpuseroles n'a pas de champ rolep, on met "N" par défaut
    datmaj: ur.datmaj,
  }));

  const userRoleCount = data.length;
 
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-200 to-orange-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="harp-card-header">
            <CardTitle className="flex items-center gap-3 text-xl sm:text-2xl lg:text-3xl font-bold">
              <Users className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8" />
              Tous les Utilisateurs par Rôle
            </CardTitle>
            <p className="text-orange-50 text-sm sm:text-base mt-2">
              {userRoleCount} attribution{userRoleCount > 1 ? "s" : ""} de rôle enregistrée{userRoleCount > 1 ? "s" : ""}
            </p>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="mb-4 flex justify-end">
              <CreateUserRolesDialog />
            </div>
            <DataTable columns={columns} data={data} />
          </CardContent>
        </Card>
      </div>
    </div>
  )    
}

export default UserRoleListPage