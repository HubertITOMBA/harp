import React from 'react'
import Image from 'next/image'
import prisma from "@/lib/prisma";
import { notFound } from 'next/navigation';
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  User, 
  Mail, 
  Key, 
  Calendar, 
  Shield, 
  Hash, 
  Lock, 
  UserCircle,
  Clock
} from "lucide-react";
import { RemoveRoleButton } from '@/components/user/RemoveRoleButton';
import { UpdatePasswordDialogWrapper } from '@/components/user/UpdatePasswordDialogWrapper';
import { AddRolesModalWrapper } from '@/components/user/AddRolesModalWrapper';

const UserSinglePage = async ({ params }: { params: { netid: string } }) => {
  const { netid } = await params;

  const user = await prisma.psadm_user.findUnique({
    where: { netid: netid },
  });  

  if (!user) {
    return notFound();
  } 

  const userRoles = await prisma.psadm_roleuser.findMany({
    where: {
      netid: netid,
    },
    include: {
      psadm_role: {
        select: {
          descr: true
        }
      }
    },
    orderBy: {
      datmaj: 'desc'
    }
  });

  // Récupérer tous les rôles disponibles pour le modal
  const allRoles = await prisma.psadm_role.findMany({
    orderBy: {
      role: 'asc'
    }
  });

  const assignedRoleNames = userRoles.map(ur => ur.role);
  const availableRoles = allRoles.filter(role => !assignedRoleNames.includes(role.role));

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-200 to-orange-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* En-tête avec avatar et nom */}
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-6">
              <div className="relative">
                <Image 
                  src="/ressources/avatar.png" 
                  alt={`Avatar de ${user.netid}`} 
                  width={80} 
                  height={80} 
                  className="rounded-full border-4 border-orange-200"
                />
                <div className="absolute bottom-0 right-0 h-6 w-6 bg-green-500 rounded-full border-2 border-white"></div>
              </div>
              <div className="flex-1">
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-1">
                  {user.prenom} {user.nom}
                </h1>
                <p className="text-xl text-orange-600 font-semibold uppercase">
                  {user.netid}
                </p>
                {user.oprid && (
                  <Badge variant="secondary" className="mt-2 bg-gray-100 text-gray-700">
                    <Hash className="h-3 w-3 mr-1" />
                    OprId: {user.oprid}
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section Informations personnelles */}
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-t-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <User className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-2xl text-white">Informations Personnelles</CardTitle>
                <CardDescription className="text-orange-100">
                  Détails du compte et identifiants
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Email */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Mail className="h-4 w-4 text-orange-600" />
                  Adresse email
                </Label>
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-gray-900 font-medium">
                  {user.email || "N/A"}
                </div>
              </div>

              {/* Clé SSH */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Key className="h-4 w-4 text-orange-600" />
                  Clé SSH
                </Label>
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-gray-900 font-medium font-mono text-sm">
                  {user.pkeyfile || "N/A"}
                </div>
              </div>

              {/* Mot de passe */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Lock className="h-4 w-4 text-orange-600" />
                  Mot de passe
                </Label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 p-3 bg-gray-50 rounded-lg border border-gray-200 text-gray-900 font-medium">
                    ••••••••••
                  </div>
                  <UpdatePasswordDialogWrapper netid={user.netid} userEmail={user.email} />
                </div>
              </div>

              {/* Dernière connexion */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-orange-600" />
                  Dernière connexion
                </Label>
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-gray-900 font-medium">
                  {user.lastlogin 
                    ? new Intl.DateTimeFormat("fr-FR", {
                        dateStyle: 'short', 
                        timeStyle: 'short'
                      }).format(user.lastlogin)
                    : "Jamais"}
                </div>
              </div>

              {/* Compte Unix */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <UserCircle className="h-4 w-4 text-orange-600" />
                  Compte Unix
                </Label>
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-gray-900 font-medium">
                  {user.unxid || "N/A"}
                </div>
              </div>

              {/* Expiration compte Unix */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-orange-600" />
                  Expiration compte Unix
                </Label>
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-gray-900 font-medium">
                  {user.expunx 
                    ? new Intl.DateTimeFormat("fr-FR", {
                        dateStyle: 'short', 
                        timeStyle: 'short'
                      }).format(user.expunx)
                    : "N/A"}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section Rôles */}
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-gray-700 to-gray-800 text-white rounded-t-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Shield className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-2xl text-white">
                    Rôles de <span className="uppercase">{netid}</span>
                  </CardTitle>
                  <CardDescription className="text-gray-300">
                    {userRoles.length} rôle(s) attribué(s)
                  </CardDescription>
                </div>
              </div>
              <AddRolesModalWrapper 
                netid={netid}
                availableRoles={availableRoles}
                assignedRoles={assignedRoleNames}
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                      Rôle
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                      Mis à jour
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {userRoles.length > 0 ? (
                    userRoles.map((role, index) => (
                      <tr 
                        key={index} 
                        className="hover:bg-harpSkyLight transition-colors duration-200"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge 
                            variant="secondary" 
                            className="bg-gradient-to-r from-orange-100 to-orange-50 text-orange-800 border border-orange-200"
                          >
                            <Shield className="h-3 w-3 mr-1" />
                            {role.role}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {role.psadm_role?.descr || "—"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {new Intl.DateTimeFormat("fr-FR", {
                            dateStyle: 'short', 
                            timeStyle: 'short'
                          }).format(role.datmaj)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <RemoveRoleButton netid={netid} role={role.role} />
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <Shield className="h-12 w-12 text-gray-400" />
                          <p className="text-gray-500 font-medium">Aucun rôle attribué</p>
                          <p className="text-sm text-gray-400">Ajoutez un rôle pour commencer</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default UserSinglePage;
