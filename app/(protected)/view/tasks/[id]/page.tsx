"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Home, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { getTaskById } from '@/actions/task-actions';
import { toast } from 'react-toastify';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const statusColors = {
  EN_ATTENTE: "bg-gray-500",
  EN_COURS: "bg-blue-500",
  BLOQUE: "bg-red-500",
  TERMINE: "bg-yellow-500",
  SUCCES: "bg-green-500",
  ECHEC: "bg-red-600",
};

const statusLabels = {
  EN_ATTENTE: "En attente",
  EN_COURS: "En cours",
  BLOQUE: "Bloqué",
  TERMINE: "Terminé",
  SUCCES: "Succès",
  ECHEC: "Échec",
};

/**
 * Page de visualisation simplifiée d'une chrono-tâche
 * Affiche uniquement le titre, la description, la barre de progression et la liste des tâches
 */
export default function ViewTaskPage() {
  const router = useRouter();
  const params = useParams();
  const taskId = parseInt(params.id as string);
  
  const [task, setTask] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    if (taskId) {
      setLoading(true);
      loadTask().finally(() => {
        setLoading(false);
      });
    }
  }, [taskId]);

  // Réinitialiser à la page 1 si la page actuelle est invalide
  useEffect(() => {
    if (task?.items) {
      const totalItems = task.items.length;
      const totalPages = Math.ceil(totalItems / pageSize);
      if (totalPages > 0 && currentPage > totalPages) {
        setCurrentPage(1);
      }
    }
  }, [task?.items, pageSize, currentPage]);

  const loadTask = async () => {
    try {
      const result = await getTaskById(taskId);
      if (result.success && result.data) {
        setTask(result.data);
      } else {
        toast.error(result.error || "Erreur lors du chargement");
      }
    } catch (error) {
      console.error("Erreur lors du chargement:", error);
      toast.error("Erreur lors du chargement");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-200 to-orange-50 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="text-lg">Chargement...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-200 to-orange-50 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12 text-red-500">
            <div className="text-lg">Erreur lors du chargement de la chrono-tâche</div>
            <Button 
              onClick={() => router.push('/home')}
              className="mt-4"
              variant="outline"
            >
              <Home className="h-4 w-4 mr-2" />
              Retour à l'accueil
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Calculer la progression basée sur les items terminés (TERMINE, SUCCES, ou ECHEC)
  const totalItems = task.items?.length || 0;
  const completedItems = task.items?.filter((item: any) => 
    ["TERMINE", "SUCCES", "ECHEC"].includes(item.status)
  ).length || 0;
  const progressPercentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  // Calculs de pagination
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedItems = task.items?.slice(startIndex, endIndex) || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-200 to-orange-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Bouton de retour */}
        <Button
          onClick={() => router.push('/home')}
          variant="outline"
          className="mb-4"
        >
          <Home className="h-4 w-4 mr-2" />
          Retour à l'accueil
        </Button>

        {/* Carte principale */}
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="harp-card-header">
            <CardTitle className="flex items-center gap-3 text-xl sm:text-2xl lg:text-3xl font-bold">
              {task.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            {/* Description si présente */}
            {task.descr && (
              <div className="bg-gray-50 p-4 rounded border mb-6">
                <label className="text-sm font-semibold text-gray-700 mb-2 block">Description</label>
                <div className="text-gray-900 text-sm">{task.descr}</div>
              </div>
            )}

            {/* Barre de progression */}
            {totalItems > 0 && (
              <div className={`p-4 rounded-lg border mb-6 ${
                progressPercentage === 100 
                  ? 'bg-gradient-to-r from-green-50 to-green-100 border-green-200' 
                  : 'bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200'
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className={`h-5 w-5 ${progressPercentage === 100 ? 'text-green-600' : 'text-orange-600'}`} />
                    <label className="text-sm font-semibold text-gray-800">
                      Progression de la chrono-tâche
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-800">
                      {completedItems} / {totalItems}
                    </span>
                    <span className={`text-sm font-semibold ${progressPercentage === 100 ? 'text-green-700' : 'text-orange-700'}`}>
                      {progressPercentage}%
                    </span>
                  </div>
                </div>
                <div className="relative h-4 w-full overflow-hidden rounded-full bg-gray-200">
                  <div
                    className={`h-full transition-all duration-500 ${
                      progressPercentage === 100 ? 'bg-green-500' : 'bg-orange-500'
                    }`}
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
                <div className="mt-2 text-xs text-gray-600">
                  {progressPercentage === 100 ? (
                    <span className="text-green-700 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="h-4 w-4" />
                      Toutes les tâches sont terminées ! La chrono-tâche est complète.
                    </span>
                  ) : (
                    <span>
                      {totalItems - completedItems} tâche{totalItems - completedItems > 1 ? "s" : ""} restante{totalItems - completedItems > 1 ? "s" : ""} pour compléter la chrono-tâche
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Tableau des tâches simplifié */}
            {task.items && task.items.length > 0 ? (
              <div className="overflow-x-auto">
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                  <Table className="min-w-full divide-y divide-gray-200">
                    <TableHeader className="bg-harpOrange text-white text-center text-xs font-bold">
                      <TableRow className="h-7">
                        <TableHead className="text-white bg-harpOrange text-center py-1">
                          Ordre
                        </TableHead>
                        <TableHead className="text-white bg-harpOrange text-center py-1">
                          Tâche
                        </TableHead>
                        <TableHead className="text-white bg-harpOrange text-left py-1">
                          Ressource
                        </TableHead>
                        <TableHead className="text-white bg-harpOrange text-center py-1">
                          Prédécesseur
                        </TableHead>
                        <TableHead className="text-white bg-harpOrange text-center py-1">
                          Début
                        </TableHead>
                        <TableHead className="text-white bg-harpOrange text-center py-1">
                          Statut
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y divide-gray-200 bg-white">
                      {paginatedItems.map((item: any) => (
                        <TableRow
                          key={item.id}
                          className="hover:bg-harpSkyLight transition-colors duration-200 h-7"
                        >
                          <TableCell className="text-center text-xs sm:text-sm py-1">
                            {item.order}
                          </TableCell>
                          <TableCell className="text-xs sm:text-sm py-1">
                            {item.harpitem?.descr || "-"}
                          </TableCell>
                          <TableCell className="text-left text-xs sm:text-sm py-1">
                            {item.resourceNetid || "-"}
                          </TableCell>
                          <TableCell className="text-center text-xs sm:text-sm py-1">
                            {item.predecessorId ? item.predecessorId : "-"}
                          </TableCell>
                          <TableCell className="text-center text-xs sm:text-sm py-1">
                            {item.startDate ? (
                              new Date(item.startDate).toLocaleString("fr-FR", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            ) : (
                              "-"
                            )}
                          </TableCell>
                          <TableCell className="text-center py-1">
                            <Badge className={`${statusColors[item.status]} text-white text-xs`}>
                              {statusLabels[item.status]}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500 border rounded-lg bg-gray-50">
                Aucune tâche pour cette chrono-tâche.
              </div>
            )}

            {/* Pagination */}
            {task.items && task.items.length > 0 && totalPages > 1 && (
              <div className="flex items-center justify-between space-x-2 py-4 mt-4">
                <div className="flex-1 text-sm text-muted-foreground">
                  {startIndex + 1} à {Math.min(endIndex, totalItems)} sur {totalItems} tâche{totalItems > 1 ? "s" : ""}
                </div>

                <div className="flex items-center space-x-6 lg:space-x-8">
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-medium">Lignes par page</p>
                    <Select
                      value={`${pageSize}`}
                      onValueChange={(value) => {
                        setPageSize(Number(value));
                        setCurrentPage(1);
                      }}
                    >
                      <SelectTrigger className="h-8 w-[70px]">
                        <SelectValue placeholder={pageSize} />
                      </SelectTrigger>
                      <SelectContent side="top">
                        {[10, 20, 30, 40, 50].map((size) => (
                          <SelectItem key={size} value={`${size}`}>
                            {size}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex w-[100px] items-center justify-center text-sm font-medium">
                    Page {currentPage} sur {totalPages}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      className="hidden h-8 w-8 p-0 lg:flex"
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                    >
                      <span className="sr-only">Aller à la première page</span>
                      <ChevronsLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      className="h-8 w-8 p-0"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <span className="sr-only">Aller à la page précédente</span>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      className="h-8 w-8 p-0"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      <span className="sr-only">Aller à la page suivante</span>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      className="hidden h-8 w-8 p-0 lg:flex"
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                    >
                      <span className="sr-only">Aller à la dernière page</span>
                      <ChevronsRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

