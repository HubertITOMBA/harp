/**
 * Page d'initialisation de la base de données
 * S'affiche pendant la migration automatique
 * Empêche l'accès à l'application jusqu'à la fin de la migration
 */

import { ensureFullDatabaseMigration } from "@/lib/init-full-migration";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Database, CheckCircle2, AlertCircle } from "lucide-react";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function InitPage() {
  // Exécuter la migration complète
  const migrationResult = await ensureFullDatabaseMigration();

  // Si la migration est terminée avec succès ou si elle n'était pas nécessaire
  if (migrationResult.success || migrationResult.skipped) {
    // Rediriger vers la page d'accueil
    redirect("/");
  }

  // Si la table n'existe pas, afficher un message d'erreur
  if (migrationResult.requiresPrismaMigration) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-200 to-orange-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-red-500 to-red-600 text-white rounded-t-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <AlertCircle className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-2xl text-white">Tables manquantes</CardTitle>
                <CardDescription className="text-red-100">
                  Les tables de la base de données n&apos;ont pas encore été créées
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8">
            <div className="text-center space-y-4">
              <AlertCircle className="h-16 w-16 text-red-500 mx-auto" />
              <h3 className="text-xl font-semibold text-gray-900">Action requise</h3>
              <p className="text-gray-600">{migrationResult.error}</p>
              <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-700 font-mono text-left">
                  <strong>Commande à exécuter :</strong>
                </p>
                <code className="block mt-2 p-3 bg-gray-800 text-green-400 rounded text-sm">
                  npx prisma db push
                </code>
                <p className="text-xs text-gray-500 mt-2 text-left">
                  Ou alternativement : <code className="bg-gray-200 px-1 rounded">npx prisma migrate dev</code>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Si la migration est en cours ou a échoué, afficher la page d'attente
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-200 to-orange-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-xl border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-t-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Database className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-2xl text-white">Initialisation de la base de données</CardTitle>
              <CardDescription className="text-orange-100">
                Veuillez patienter pendant l&apos;initialisation...
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-8">
          {migrationResult.success ? (
            <div className="text-center space-y-4">
              <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
              <h3 className="text-xl font-semibold text-gray-900">Initialisation terminée !</h3>
              <p className="text-gray-600">
                {migrationResult.userCount} utilisateur(s) et {migrationResult.envCount} environnement(s) ont été importés.
              </p>
              {migrationResult.harpTablesStatus && (
                <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200 text-left">
                  <p className="text-sm font-semibold text-green-800 mb-2">Tables harp* initialisées :</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {Object.entries(migrationResult.harpTablesStatus).map(([table, count]) => (
                      <div key={table} className="flex justify-between">
                        <span className="text-gray-700">{table}:</span>
                        <span className="font-mono text-green-600">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <p className="text-sm text-gray-500 mt-4">
                Redirection en cours...
              </p>
            </div>
          ) : migrationResult.error ? (
            <div className="text-center space-y-4">
              <AlertCircle className="h-16 w-16 text-red-500 mx-auto" />
              <h3 className="text-xl font-semibold text-gray-900">Erreur lors de l&apos;initialisation</h3>
              <p className="text-red-600">{migrationResult.error}</p>
              <p className="text-sm text-gray-500 mt-4">
                Veuillez rafraîchir la page ou contacter l&apos;administrateur.
              </p>
            </div>
          ) : (
            <div className="text-center space-y-6">
              <Loader2 className="h-16 w-16 text-orange-600 mx-auto animate-spin" />
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-gray-900">Initialisation en cours...</h3>
                <p className="text-gray-600">
                  Migration des données depuis les tables existantes
                </p>
                {migrationResult.totalSteps && (
                  <p className="text-sm text-gray-500">
                    Étape {migrationResult.completedSteps || 0} / {migrationResult.totalSteps}
                  </p>
                )}
              </div>
              <div className="mt-6 p-4 bg-orange-50 rounded-lg border border-orange-200">
                <p className="text-sm text-orange-800">
                  ⏳ Cette opération peut prendre plusieurs minutes. Veuillez ne pas fermer cette page.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

