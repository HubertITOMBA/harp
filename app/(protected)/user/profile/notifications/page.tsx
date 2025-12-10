import { UserNotificationsTable } from "@/components/notification/UserNotificationsTable";

export const metadata = {
  title: 'Mes Notifications',
};

// Marquer la route comme dynamique car elle utilise auth() qui utilise headers()
export const dynamic = 'force-dynamic';

/**
 * Page affichant uniquement la section Mes notifications
 */
const NotificationsPage = async () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 p-2 sm:p-3 lg:p-4">
      <div className="max-w-6xl mx-auto space-y-3">
        {/* En-tête avec titre */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
              Mes <span className="text-orange-600">Notifications</span>
            </h1>
            <p className="text-gray-600 text-xs sm:text-sm">
              Consultez et gérez vos notifications
            </p>
          </div>
        </div>

        {/* Section Notifications */}
        <UserNotificationsTable />
      </div>
    </div>
  );
};

export default NotificationsPage;

