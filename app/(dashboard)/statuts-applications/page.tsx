import { getApplicationStatusList, executeAppStatusRefresh } from "@/actions/app-status";
import { AppStatusTable } from "@/components/monitoring/AppStatusTable";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Statut des applications",
  description: "Suivi du statut des applications PeopleSoft / WebLogic par environnement et serveur.",
};

export default async function StatutsApplicationsPage() {
  const result = await getApplicationStatusList();

  const rows = result.success && result.data ? result.data : [];
  const error = !result.success ? result.error : undefined;

  async function handleRefresh() {
    "use server";
    await executeAppStatusRefresh();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-200 to-orange-50 p-4 sm:p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-gray-900">
            Statut des <span className="text-orange-600">applications</span>
          </h1>
          <p className="text-xs text-gray-600">
            Suivi des statuts (actif, en cours, en erreur, stoppé) par application, environnement et serveur.
          </p>
        </div>
        <form action={handleRefresh}>
          <Button type="submit" variant="outline" size="sm">
            Actualiser depuis le serveur Unix
          </Button>
        </form>
      </div>

      {error && (
        <p className="text-xs text-red-600" role="alert">
          {error}
        </p>
      )}

      <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-sm border border-orange-100 p-2 sm:p-3">
        <AppStatusTable data={rows} />
      </div>
    </div>
  );
}

