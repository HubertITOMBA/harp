import { getAllUserRoles } from "@/actions/get-all-user-roles";
import { getUserProfile } from "@/lib/actions/profile-actions";
import { Shield, Info } from "lucide-react";
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
import { notFound } from "next/navigation";

export const metadata = {
  title: 'Mes Rôles',
};

// Marquer la route comme dynamique car elle utilise auth() qui utilise headers()
export const dynamic = 'force-dynamic';

/**
 * Page affichant uniquement la section Rôles et Permissions
 */
const RolesPage = async () => {
  // Récupérer les données du profil utilisateur
  const user = await getUserProfile();
  
  if (!user) {
    return notFound();
  }

  // Récupérer tous les rôles fusionnés
  const allUserRoles = await getAllUserRoles();

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 p-2 sm:p-3 lg:p-4">
      <div className="max-w-6xl mx-auto space-y-3">
        {/* En-tête avec titre */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
              Mes <span className="text-orange-600">Rôles</span>
            </h1>
            <p className="text-gray-600 text-xs sm:text-sm">
              Consultez vos rôles et permissions attribués
            </p>
          </div>
        </div>

        {/* Section Rôles et Permissions */}
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-gray-700 to-gray-800 text-white rounded-t-lg py-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-white/20 rounded-lg">
                <Shield className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-lg text-white">Rôles et Permissions</CardTitle>
                <CardDescription className="text-gray-300 text-xs">
                  {allUserRoles.length} rôle(s) attribué(s)
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            {/* Badges des rôles */}
            <div className="mb-3">
              <Label className="text-xs font-semibold text-gray-700 mb-2 block">
                Rôles actifs
              </Label>
              <div className="flex flex-wrap gap-2">
                {allUserRoles.length > 0 ? (
                  allUserRoles.map((role, index) => (
                    <Badge 
                      key={index} 
                      variant="secondary" 
                      className="text-xs px-2 py-1 bg-gradient-to-r from-orange-100 to-orange-50 text-orange-800 border border-orange-200 hover:from-orange-200 hover:to-orange-100 transition-colors"
                    >
                      <Shield className="h-3 w-3 mr-1" />
                      {role}
                    </Badge>
                  ))
                ) : (
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-center text-gray-500">
                    <Shield className="h-6 w-6 mx-auto mb-1 text-gray-400" />
                    <p className="text-sm">Aucun rôle attribué</p>
                  </div>
                )}
              </div>
            </div>

            <Separator className="my-3" />

            {/* Tableau des rôles HARP */}
            {user.harpuseroles.length > 0 ? (
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-gray-700 flex items-center gap-2">
                  <Info className="h-3 w-3 text-orange-600" />
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
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-center text-gray-500">
                <Shield className="h-6 w-6 mx-auto mb-1 text-gray-400" />
                <p className="text-sm">Aucun rôle HARP attribué</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RolesPage;

