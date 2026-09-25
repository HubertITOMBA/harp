import React from 'react'
import Image from 'next/image'
import prisma from "@/lib/prisma";
import { notFound } from 'next/navigation';
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  User, 
  Mail, 
  Key, 
  Shield, 
  Hash, 
  Lock, 
  UserCircle,
  Clock,
  ArrowLeft,
  Layers
} from "lucide-react";
import Link from 'next/link';
import { RemoveRoleButton } from '@/components/user/RemoveRoleButton';
import { UpdatePasswordDialogWrapper } from '@/components/user/UpdatePasswordDialogWrapper';
import { AddRolesModalWrapper } from '@/components/user/AddRolesModalWrapper';
import { UserScopesForm } from '@/components/user/UserScopesForm';
import {
  ASSIGNABLE_USER_SCOPE_CODES,
  type AssignableUserScopeCode,
} from '@/lib/user-scopes';
import { PORTAL_ADMIN_ROLE } from '@/lib/user-roles';

const UserSinglePage = async ({ params }: { params: { netid: string } }) => {
  const { netid } = await params;

  // Récupérer l'utilisateur depuis la table User avec ses rôles HARP
  const user = await prisma.user.findUnique({
    where: { netid: netid },
    include: {
      harpuseroles: {
        include: {
          harproles: {
            select: {
              id: true,
              role: true,
              descr: true,
            },
          },
        },
        orderBy: {
          datmaj: 'desc',
        },
      },
      harpuserscope: {
        include: {
          harpscope: {
            select: {
              code: true,
              descr: true,
            },
          },
        },
      },
    },
  });  

  if (!user) {
    return notFound();
  } 

  // Les rôles sont maintenant dans user.harpuseroles
  const userRoles = user.harpuseroles;

  // Récupérer tous les rôles HARP disponibles pour le modal
  const allRoles = await prisma.harproles.findMany({
    orderBy: {
      role: 'asc'
    }
  });

  const assignedRoleNames = userRoles.map(ur => ur.harproles.role);
  const availableRoles = allRoles.filter(role => !assignedRoleNames.includes(role.role));
  const isPortalAdmin =
    user.role === PORTAL_ADMIN_ROLE || assignedRoleNames.includes(PORTAL_ADMIN_ROLE);
  const assignedScopeCodes = new Set(user.harpuserscope.map((row) => row.harpscope.code));
  const scopeCatalog = await prisma.harpscope.findMany({
    where: { code: { in: [...ASSIGNABLE_USER_SCOPE_CODES] } },
    select: { code: true, descr: true },
  });
  const scopeOptions = ASSIGNABLE_USER_SCOPE_CODES.flatMap((code) => {
    const row = scopeCatalog.find((scope) => scope.code === code);
    if (!row) {
      return [];
    }
    return [{
      code: code as AssignableUserScopeCode,
      descr: row.descr,
      checked: assignedScopeCodes.has(code),
    }];
  });
  const unexpectedScopeCodes = user.harpuserscope
    .map((row) => row.harpscope.code)
    .filter((code) => !ASSIGNABLE_USER_SCOPE_CODES.includes(code as AssignableUserScopeCode));

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-200 to-orange-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Bouton retour */}
        <div className="mb-4">
          <Button asChild variant="outline" className="bg-white hover:bg-gray-50">
            <Link href="/list/users">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour à la liste
            </Link>
          </Button>
        </div>
        
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
          <CardHeader className="harp-card-header">
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
                    userRoles.map((userRole) => (
                      <tr 
                        key={`${userRole.userId}-${userRole.roleId}`} 
                        className="hover:bg-harpSkyLight transition-colors duration-200"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge 
                            variant="secondary" 
                            className="bg-gradient-to-r from-orange-100 to-orange-50 text-orange-800 border border-orange-200"
                          >
                            <Shield className="h-3 w-3 mr-1" />
                            {userRole.harproles.role}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {userRole.harproles.descr || "—"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {new Intl.DateTimeFormat("fr-FR", {
                            dateStyle: 'short', 
                            timeStyle: 'short'
                          }).format(userRole.datmaj)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <RemoveRoleButton netid={netid} role={userRole.harproles.role} />
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

        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-t-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Layers className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-2xl text-white">Périmètres d&apos;environnements</CardTitle>
                <CardDescription className="text-orange-100">
                  Limite les environnements d&apos;une famille déjà autorisée par les rôles
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {isPortalAdmin ? (
              <div className="space-y-2 rounded-md border border-orange-200 bg-orange-50 p-4">
                <p className="text-sm font-semibold text-slate-900">
                  Accès global — PORTAL_ADMIN
                </p>
                <p className="text-sm text-slate-700">
                  Cet utilisateur dispose d&apos;un accès global aux environnements.
                  Aucune affectation de périmètre individuelle n&apos;est nécessaire.
                </p>
                {user.harpuserscope.length > 0 && (
                  <p className="text-sm font-medium text-red-700">
                    Anomalie : des périmètres individuels sont déjà enregistrés
                    ({user.harpuserscope.map((row) => row.harpscope.code).join(", ")}).
                    Ils ne sont pas modifiés depuis cette fiche.
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {unexpectedScopeCodes.length > 0 && (
                  <p className="text-sm font-medium text-red-700">
                    Anomalie : un périmètre hors 4K et 150K est déjà enregistré
                    ({unexpectedScopeCodes.join(", ")}).
                    L&apos;enregistrement ne conservera que la sélection affichée.
                  </p>
                )}
                {scopeOptions.length > 0 ? (
                  <UserScopesForm
                    key={`${netid}:${scopeOptions.map((option) => `${option.code}:${option.checked}`).join("|")}`}
                    netid={netid}
                    options={scopeOptions}
                  />
                ) : (
                  <p className="text-sm text-slate-700">
                    Aucun périmètre affectable n&apos;est disponible.
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Bouton retour en bas */}
        <div className="mt-6 flex justify-start">
          <Button asChild variant="outline" className="bg-white hover:bg-gray-50">
            <Link href="/list/users">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour à la liste
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

export default UserSinglePage;
