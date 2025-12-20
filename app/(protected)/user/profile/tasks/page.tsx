import { getUserTasks } from "@/actions/user-task-actions";
import { CheckSquare, Calendar, Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserTasksTable } from "@/components/profile/UserTasksTable";
import { notFound } from "next/navigation";

export const metadata = {
  title: 'Mes Tâches',
};

// Marquer la route comme dynamique car elle utilise auth() qui utilise headers()
export const dynamic = 'force-dynamic';

/**
 * Page affichant les tâches assignées à l'utilisateur connecté
 */
const UserTasksPage = async () => {
  // Récupérer les tâches de l'utilisateur
  const result = await getUserTasks();
  
  if (!result.success) {
    return notFound();
  }

  const tasks = result.data || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 p-2 sm:p-3 lg:p-4">
      <div className="max-w-7xl mx-auto space-y-3">
        {/* En-tête avec titre */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
              Mes <span className="text-orange-600">Tâches</span>
            </h1>
            <p className="text-gray-600 text-xs sm:text-sm">
              Gérez vos tâches assignées ({tasks.length} tâche{tasks.length > 1 ? "s" : ""})
            </p>
          </div>
        </div>

        {/* Section Tâches */}
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-t-lg py-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-white/20 rounded-lg">
                <CheckSquare className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-lg text-white">Mes Tâches Assignées</CardTitle>
                <CardDescription className="text-orange-100 text-xs">
                  {tasks.length} tâche{tasks.length > 1 ? "s" : ""} en cours
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            {tasks.length > 0 ? (
              <UserTasksTable tasks={tasks} />
            ) : (
              <div className="p-8 bg-gray-50 rounded-lg border border-gray-200 text-center text-gray-500">
                <CheckSquare className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                <p className="text-sm font-medium">Aucune tâche assignée</p>
                <p className="text-xs mt-1">Vous n'avez actuellement aucune tâche assignée.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UserTasksPage;

