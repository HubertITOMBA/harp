import { getAllUserRoles } from "@/actions/get-all-user-roles";
import { getUserProfile } from "@/lib/actions/profile-actions";
import { LogOut, User, Mail, Key, Shield, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { logOut } from "@/actions/logout";
import { ChangePasswordDialog } from "@/components/profile/ChangePasswordDialog";
import { notFound } from "next/navigation";

export const metadata = {
  title: 'Mon Profil',
};

// Marquer la route comme dynamique car elle utilise auth() qui utilise headers()
export const dynamic = 'force-dynamic';

/**
 * Page de profil utilisateur affichant les informations personnelles et les rôles
 */
const ProfilePage = async () => {
  // Récupérer les données du profil utilisateur
  const user = await getUserProfile();
  
  if (!user) {
    return notFound();
  }

  // Récupérer tous les rôles fusionnés
  const allUserRoles = await getAllUserRoles();

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* En-tête avec titre et boutons d'action */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
              Mon <span className="text-orange-600">Profil</span>
            </h1>
            <p className="text-gray-600 text-sm sm:text-base">
              Gérez vos informations personnelles et consultez vos permissions
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <ChangePasswordDialog />
            <form action={logOut}>
              <Button 
                type="submit" 
                variant="outline" 
                size="lg" 
                className="w-full sm:w-auto border-orange-300 hover:bg-orange-50 hover:border-orange-400 text-orange-700"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Déconnexion
              </Button>
            </form>
          </div>
        </div>

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
                  Vos données de compte et identifiants
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Nom complet */}
              <div className="space-y-1">
                <Label className="text-[9px] sm:text-[10px] font-semibold text-slate-700 uppercase tracking-wide flex items-center gap-1 sm:gap-2 bg-slate-100 px-2 py-1 rounded-t-md">
                  <User className="h-3 w-3 sm:h-4 sm:w-4 text-orange-600" />
                  Nom complet
                </Label>
                <div className="p-2 sm:p-2.5 bg-orange-50 rounded-md rounded-tl-none border border-orange-200 border-t-0 text-xs font-medium text-slate-900 shadow-sm">
                  {user.name || "N/A"}
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1">
                <Label className="text-[9px] sm:text-[10px] font-semibold text-slate-700 uppercase tracking-wide flex items-center gap-1 sm:gap-2 bg-slate-100 px-2 py-1 rounded-t-md">
                  <Mail className="h-3 w-3 sm:h-4 sm:w-4 text-orange-600" />
                  Adresse email
                </Label>
                <div className="p-2 sm:p-2.5 bg-orange-50 rounded-md rounded-tl-none border border-orange-200 border-t-0 text-xs font-medium text-slate-900 shadow-sm">
                  {user.email || "N/A"}
                </div>
              </div>

              {/* NetID */}
              <div className="space-y-1">
                <Label className="text-[9px] sm:text-[10px] font-semibold text-slate-700 uppercase tracking-wide flex items-center gap-1 sm:gap-2 bg-slate-100 px-2 py-1 rounded-t-md">
                  <Key className="h-3 w-3 sm:h-4 sm:w-4 text-orange-600" />
                  NetID
                </Label>
                <div className="p-2 sm:p-2.5 bg-orange-50 rounded-md rounded-tl-none border border-orange-200 border-t-0 text-xs font-medium text-slate-900 font-mono shadow-sm">
                  {user.netid || "N/A"}
                </div>
              </div>

              {/* Nom et Prénom si disponibles */}
              {(user.nom || user.prenom) && (
                <div className="space-y-1">
                  <Label className="text-[9px] sm:text-[10px] font-semibold text-slate-700 uppercase tracking-wide flex items-center gap-1 sm:gap-2 bg-slate-100 px-2 py-1 rounded-t-md">
                    <User className="h-3 w-3 sm:h-4 sm:w-4 text-orange-600" />
                    Nom et Prénom
                  </Label>
                  <div className="p-2 sm:p-2.5 bg-orange-50 rounded-md rounded-tl-none border border-orange-200 border-t-0 text-xs font-medium text-slate-900 shadow-sm">
                    {[user.prenom, user.nom].filter(Boolean).join(" ") || "N/A"}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Section Rôles et Permissions */}
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-gray-700 to-gray-800 text-white rounded-t-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Shield className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-2xl text-white">Rôles et Permissions</CardTitle>
                <CardDescription className="text-gray-300">
                  {allUserRoles.length} rôle(s) attribué(s)
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {/* Badges des rôles */}
            <div className="mb-6">
              <Label className="text-sm font-semibold text-gray-700 mb-3 block">
                Rôles actifs
              </Label>
              <div className="flex flex-wrap gap-3">
                {allUserRoles.length > 0 ? (
                  allUserRoles.map((role, index) => (
                    <Badge 
                      key={index} 
                      variant="secondary" 
                      className="text-sm px-4 py-2 bg-gradient-to-r from-orange-100 to-orange-50 text-orange-800 border border-orange-200 hover:from-orange-200 hover:to-orange-100 transition-colors"
                    >
                      <Shield className="h-3 w-3 mr-2" />
                      {role}
                    </Badge>
                  ))
                ) : (
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 text-center text-gray-500">
                    <Shield className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p>Aucun rôle attribué</p>
                  </div>
                )}
              </div>
            </div>

            <Separator className="my-6" />

            {/* Tableau des rôles HARP */}
            {user.harpuseroles.length > 0 ? (
              <div className="space-y-4">
                <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Info className="h-4 w-4 text-orange-600" />
                  Détails des rôles HARP
                </Label>
                
                <div className="rounded-md border border-gray-200 overflow-hidden">
                  <Table>
                    <TableHeader className="bg-gradient-to-r from-orange-500 to-orange-600">
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="text-white font-semibold text-sm">
                          Statut
                        </TableHead>
                        <TableHead className="text-white font-semibold text-sm">
                          Rôle
                        </TableHead>
                        <TableHead className="text-white font-semibold text-sm">
                          Description
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {user.harpuseroles.map((userRole) => (
                        <TableRow
                          key={`${userRole.harproles.id}`}
                          className="hover:bg-orange-50/50 transition-colors"
                        >
                          <TableCell>
                            <Badge 
                              variant="outline" 
                              className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                            >
                              <Shield className="h-3 w-3 mr-1" />
                              Actif
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="font-medium text-gray-900">
                              {userRole.harproles.role}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-gray-600">
                              {userRole.harproles.descr || "Aucune description"}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 text-center text-gray-500">
                <Shield className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p>Aucun rôle HARP attribué</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProfilePage;

