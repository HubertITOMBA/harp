import { getAllUserRoles } from "@/actions/get-all-user-roles";
import { logOut } from "@/actions/logout";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RandomGradientBackground } from "@/components/ui/random-gradient-background";

export const metadata = {
  title: 'Accueil',
};

const Home = async () => {
  const session = await auth();
  
  if (!session?.user?.id) {
    return (
      <div className="container p-4">
        <p>Non connecté</p>
      </div>
    );
  }

  // Récupérer tous les rôles fusionnés
  const allUserRoles = await getAllUserRoles();

  // Vérifier et convertir l'ID utilisateur
  const userId = session.user.id ? parseInt(session.user.id, 10) : null;
  
  if (!userId || isNaN(userId)) {
    return (
      <div className="container p-4">
        <Card>
          <CardHeader>
            <CardTitle>Erreur</CardTitle>
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
    <RandomGradientBackground>
      <div className="container p-2 sm:p-4 space-y-4 sm:space-y-6 py-4 sm:py-8 max-w-full">
        <Card className="backdrop-blur-sm bg-card/95 shadow-lg">
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0">
              <div>
                <CardTitle className="text-lg sm:text-xl">Profil utilisateur</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Informations et rôles de l&apos;utilisateur</CardDescription>
              </div>
              <form action={logOut}>
                <Button type="submit" variant="outline" size="sm" className="w-full sm:w-auto">
                  <LogOut className="mr-2 h-4 w-4" />
                  Déconnexion
                </Button>
              </form>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {user && (
              <div className="space-y-2">
                <div>
                  <span className="font-semibold">Nom :</span> {user.name || "N/A"}
                </div>
                <div>
                  <span className="font-semibold">Email :</span> {user.email || "N/A"}
                </div>
                <div>
                  <span className="font-semibold">NetID :</span> {user.netid || "N/A"}
                </div>
                <div>
                  <span className="font-semibold">ID :</span> {user.id}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <h3 className="font-semibold text-lg">Rôles de l&apos;utilisateur ({allUserRoles.length})</h3>
              <div className="flex flex-wrap gap-2">
                {allUserRoles.length > 0 ? (
                  allUserRoles.map((role, index) => (
                    <Badge key={index} variant="secondary" className="text-sm">
                      {role}
                    </Badge>
                  ))
                ) : (
                  <p className="text-muted-foreground">Aucun rôle attribué</p>
                )}
              </div>
            </div>

            <div className="mt-4 p-4 bg-muted rounded-lg">
              <h4 className="font-semibold mb-2">Détails des rôles :</h4>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>
                  <strong>Rôle principal (User.role) :</strong> {user?.role || "Aucun"}
                </li>
                <li>
                  <strong>Rôles harp (harproles via harpuseroles) :</strong> {allUserRoles.length} rôle(s)
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Debug : Affichage brut pour développement */}
        <Card className="backdrop-blur-sm bg-card/95 shadow-lg">
          <CardHeader>
            <CardTitle className="text-sm">Debug - Données brutes</CardTitle>
          </CardHeader>
          <CardContent>
            {/* <pre className="text-xs bg-muted p-2 rounded overflow-auto">
              {JSON.stringify({ user, allUserRoles }, null, 2)}
            </pre> */}
          </CardContent>
        </Card>
      </div>
    </RandomGradientBackground>
  );
};

export default Home;
