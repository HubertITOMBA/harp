import { getAllUserRoles } from "@/actions/get-all-user-roles";
import { logOut } from "@/actions/logout";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { LogOut, User, Mail, Key, Hash, Shield, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export const metadata = {
  title: 'Accueil',
};

const Home = async () => {
  const session = await auth();
  
  if (!session?.user?.id) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-200 to-orange-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Non connecté</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Récupérer tous les rôles fusionnés
  const allUserRoles = await getAllUserRoles();

  // Vérifier et convertir l'ID utilisateur
  const userId = session.user.id ? parseInt(session.user.id, 10) : null;
  
  if (!userId || isNaN(userId)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-200 to-orange-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Erreur</CardTitle>
          </CardHeader>
          <CardContent>
            <p>ID utilisateur invalide. Impossible de charger les informations.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Récupérer les informations utilisateur complètes
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      netid: true,
      role: true,
    },
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-200 to-orange-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* En-tête avec titre et bouton de déconnexion */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
              Mon <span className="text-orange-600">Profil</span>
            </h1>
            <p className="text-gray-600 text-sm sm:text-base">
              Gérez vos informations personnelles et consultez vos permissions
            </p>
          </div>
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
                  Vos données de compte et identifiants
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {user && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Nom */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <User className="h-4 w-4 text-orange-600" />
                    Nom complet
                  </Label>
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-gray-900 font-medium">
                    {user.name || "N/A"}
                  </div>
                </div>

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

                {/* NetID */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Key className="h-4 w-4 text-orange-600" />
                    NetID
                  </Label>
                  <div className="p-3 bg-orange-50 rounded-lg border border-orange-200 text-orange-900 font-semibold">
                    {user.netid || "N/A"}
                  </div>
                </div>

                {/* ID Utilisateur */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Hash className="h-4 w-4 text-orange-600" />
                    Identifiant unique
                  </Label>
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-gray-600 font-mono text-sm">
                    #{user.id}
                  </div>
                </div>
              </div>
            )}
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

            {/* Détails des rôles */}
            <div className="space-y-4">
              <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-4">
                <Info className="h-4 w-4 text-orange-600" />
                Détails des rôles
              </Label>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-2 w-2 rounded-full bg-orange-500"></div>
                    <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                      Rôle Principal
                    </span>
                  </div>
                  <p className="text-gray-900 font-medium">
                    {user?.role || "Aucun"}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Rôle défini dans le profil utilisateur
                  </p>
                </div>

                <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg border border-orange-200">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-2 w-2 rounded-full bg-orange-600"></div>
                    <span className="text-xs font-semibold text-orange-700 uppercase tracking-wide">
                      Rôles HARP
                    </span>
                  </div>
                  <p className="text-orange-900 font-medium">
                    {allUserRoles.length} rôle(s) actif(s)
                  </p>
                  <p className="text-xs text-orange-700 mt-1">
                    Rôles attribués via le système HARP
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Home;
