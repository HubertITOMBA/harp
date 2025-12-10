import { getUserProfile } from "@/lib/actions/profile-actions";
import { User, Mail, Key } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ChangePasswordDialog } from "@/components/profile/ChangePasswordDialog";
import { EditProfileDialog } from "@/components/profile/EditProfileDialog";
import { notFound } from "next/navigation";

export const metadata = {
  title: 'Mon Profil',
};

// Marquer la route comme dynamique car elle utilise auth() qui utilise headers()
export const dynamic = 'force-dynamic';

/**
 * Page de profil utilisateur affichant uniquement les informations personnelles
 */
const ProfilePage = async () => {
  // Récupérer les données du profil utilisateur
  const user = await getUserProfile();
  
  if (!user) {
    return notFound();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 p-2 sm:p-3 lg:p-4">
      <div className="max-w-6xl mx-auto space-y-3">
        {/* En-tête avec titre et boutons d'action */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
              Mon <span className="text-orange-600">Profil</span>
            </h1>
            <p className="text-gray-600 text-xs sm:text-sm">
              Gérez vos informations personnelles
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <EditProfileDialog />
            <ChangePasswordDialog />
          </div>
        </div>

        {/* Section Informations personnelles */}
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="harp-card-header py-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-white/20 rounded-lg">
                <User className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-lg text-white">Informations Personnelles</CardTitle>
                <CardDescription className="text-orange-100 text-xs">
                  Vos données de compte et identifiants
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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

              {/* Clé SSH (pkeyfile) */}
              <div className="space-y-1 md:col-span-2">
                <Label className="text-[9px] sm:text-[10px] font-semibold text-slate-700 uppercase tracking-wide flex items-center gap-1 sm:gap-2 bg-slate-100 px-2 py-1 rounded-t-md">
                  <Key className="h-3 w-3 sm:h-4 sm:w-4 text-orange-600" />
                  Clé SSH (pkeyfile)
                </Label>
                <div className="p-2 sm:p-2.5 bg-orange-50 rounded-md rounded-tl-none border border-orange-200 border-t-0 text-xs font-medium text-slate-900 font-mono shadow-sm break-all">
                  {user.pkeyfile || (
                    <span className="text-gray-500 italic">Aucune clé SSH configurée</span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1 px-2">
                  Chemin vers votre clé SSH privée. Utilisée pour les connexions SSH (ex: Refresh Info).
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProfilePage;
