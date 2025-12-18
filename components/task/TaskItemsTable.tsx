"use client";

import { useState, useMemo, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ArrowUpDown, Clock, User, Settings2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TaskItemActions } from './TaskItemActions';
import { updateTaskItemStatus } from '@/actions/update-task-status';
import { toast } from 'react-toastify';

interface TaskItem {
  id: number;
  harpitemId: number | null;
  startDate: Date | string | null;
  endDate: Date | string | null;
  resourceNetid: string | null;
  predecessorId: number | null;
  order: number;
  status: "EN_ATTENTE" | "EN_COURS" | "BLOQUE" | "TERMINE" | "SUCCES" | "ECHEC";
  harpitem?: {
    id: number;
    descr: string;
  } | null;
  predecessor?: {
    id: number;
    status: string;
    harpitem?: {
      id: number;
      descr: string;
    } | null;
  } | null;
  user?: {
    id: number;
    netid: string | null;
    nom: string | null;
    prenom: string | null;
  } | null;
}

interface TaskItemsTableProps {
  items: TaskItem[];
  taskId: number;
  onItemUpdated?: () => void;
}

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

// Fonction pour formater le temps écoulé entre deux dates au format hh:mm:ss
const formatElapsedTime = (startDate: Date | string | null, endDate: Date | string | null): string => {
  if (!startDate || !endDate) return "00:00:00";
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffMs = end.getTime() - start.getTime();
  
  if (diffMs < 0) return "00:00:00";
  
  const totalSeconds = Math.floor(diffMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

// Fonction pour calculer trigNetid (3 premiers caractères de resourceNetid en majuscules)
const getTrigNetid = (resourceNetid: string | null): string => {
  if (!resourceNetid) return "";
  return resourceNetid.substring(0, 3).toUpperCase();
};

type SortField = "id" | "order" | "harpitemId" | "resourceNetid" | "trigNetid" | "predecessorId" | "startDate" | "endDate" | "status" | "elapsedTime";
type SortDirection = "asc" | "desc";

export function TaskItemsTable({ items, taskId, onItemUpdated }: TaskItemsTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<SortField>("order");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [visibleColumns, setVisibleColumns] = useState({
    id: true,
    harpitemId: false, // Masqué par défaut
    taches: true, // harpitem.descr
    resourceNetid: false, // Masqué par défaut
    trigNetid: true,
    predecessorId: true,
    order: true,
    startDate: true,
    endDate: true,
    status: true,
    elapsedTime: true,
    actions: true,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const filteredAndSortedItems = useMemo(() => {
    let filtered = items.filter((item) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        item.harpitem?.descr?.toLowerCase().includes(searchLower) ||
        item.resourceNetid?.toLowerCase().includes(searchLower) ||
        getTrigNetid(item.resourceNetid).toLowerCase().includes(searchLower) ||
        item.id.toString().includes(searchTerm)
      );
    });

    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case "id":
          aValue = a.id;
          bValue = b.id;
          break;
        case "harpitemId":
          aValue = a.harpitemId || 0;
          bValue = b.harpitemId || 0;
          break;
        case "order":
          aValue = a.order;
          bValue = b.order;
          break;
        case "resourceNetid":
          aValue = a.resourceNetid || "";
          bValue = b.resourceNetid || "";
          break;
        case "trigNetid":
          aValue = getTrigNetid(a.resourceNetid);
          bValue = getTrigNetid(b.resourceNetid);
          break;
        case "predecessorId":
          aValue = a.predecessorId || 0;
          bValue = b.predecessorId || 0;
          break;
        case "status":
          aValue = a.status;
          bValue = b.status;
          break;
        case "startDate":
          aValue = a.startDate ? new Date(a.startDate).getTime() : 0;
          bValue = b.startDate ? new Date(b.startDate).getTime() : 0;
          break;
        case "endDate":
          aValue = a.endDate ? new Date(a.endDate).getTime() : 0;
          bValue = b.endDate ? new Date(b.endDate).getTime() : 0;
          break;
        case "elapsedTime":
          // Calculer le temps écoulé en secondes pour le tri
          const aElapsed = (a.startDate && a.endDate) 
            ? Math.round((new Date(a.endDate).getTime() - new Date(a.startDate).getTime()) / 1000)
            : 0;
          const bElapsed = (b.startDate && b.endDate)
            ? Math.round((new Date(b.endDate).getTime() - new Date(b.startDate).getTime()) / 1000)
            : 0;
          aValue = aElapsed;
          bValue = bElapsed;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [items, searchTerm, sortField, sortDirection]);

  // Pagination
  const totalItems = filteredAndSortedItems.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedItems = filteredAndSortedItems.slice(startIndex, endIndex);

  // Reset to page 1 when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handleStatusChange = async (itemId: number, newStatus: "EN_ATTENTE" | "EN_COURS" | "BLOQUE" | "TERMINE" | "SUCCES" | "ECHEC") => {
    const result = await updateTaskItemStatus({ itemId, status: newStatus });
    if (result.success) {
      toast.success("Statut mis à jour");
      if (onItemUpdated) {
        onItemUpdated();
      }
    } else {
      toast.error(result.error || "Erreur lors de la mise à jour");
    }
  };

  return (
    <div className="space-y-2">
      {/* Zone de recherche et sélection de colonnes */}
      <div className="flex items-center justify-between gap-2">
        <Input
          placeholder="Rechercher par tâche, ressource, trigNetid ou ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm h-8 text-sm"
        />
        <div className="flex items-center gap-2">
          {searchTerm && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearchTerm("")}
              className="h-8"
            >
              Effacer
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8"
              >
                <Settings2 className="h-4 w-4 mr-2" />
                Colonnes
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="end" 
              className="w-48 z-[102]" 
              onClick={(e) => e.stopPropagation()}
            >
              <DropdownMenuCheckboxItem
                checked={visibleColumns.id}
                onCheckedChange={(checked) => {
                  setVisibleColumns({ ...visibleColumns, id: checked });
                }}
                onSelect={(e) => e.preventDefault()}
              >
                ID
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.harpitemId}
                onCheckedChange={(checked) => {
                  setVisibleColumns({ ...visibleColumns, harpitemId: checked });
                }}
                onSelect={(e) => e.preventDefault()}
              >
                ID Item
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.taches}
                onCheckedChange={(checked) => {
                  setVisibleColumns({ ...visibleColumns, taches: checked });
                }}
                onSelect={(e) => e.preventDefault()}
              >
                Tâches
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.resourceNetid}
                onCheckedChange={(checked) => {
                  setVisibleColumns({ ...visibleColumns, resourceNetid: checked });
                }}
                onSelect={(e) => e.preventDefault()}
              >
                Ressource (Netid)
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.trigNetid}
                onCheckedChange={(checked) => {
                  setVisibleColumns({ ...visibleColumns, trigNetid: checked });
                }}
                onSelect={(e) => e.preventDefault()}
              >
                Ressource
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.predecessorId}
                onCheckedChange={(checked) => {
                  setVisibleColumns({ ...visibleColumns, predecessorId: checked });
                }}
                onSelect={(e) => e.preventDefault()}
              >
                Tache Avant
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.order}
                onCheckedChange={(checked) => {
                  setVisibleColumns({ ...visibleColumns, order: checked });
                }}
                onSelect={(e) => e.preventDefault()}
              >
                Ordre
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.startDate}
                onCheckedChange={(checked) => {
                  setVisibleColumns({ ...visibleColumns, startDate: checked });
                }}
                onSelect={(e) => e.preventDefault()}
              >
                Date début
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.endDate}
                onCheckedChange={(checked) => {
                  setVisibleColumns({ ...visibleColumns, endDate: checked });
                }}
                onSelect={(e) => e.preventDefault()}
              >
                Date fin
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.status}
                onCheckedChange={(checked) => {
                  setVisibleColumns({ ...visibleColumns, status: checked });
                }}
                onSelect={(e) => e.preventDefault()}
              >
                Statut
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.elapsedTime}
                onCheckedChange={(checked) => {
                  setVisibleColumns({ ...visibleColumns, elapsedTime: checked });
                }}
                onSelect={(e) => e.preventDefault()}
              >
                TDurée
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.actions}
                onCheckedChange={(checked) => {
                  setVisibleColumns({ ...visibleColumns, actions: checked });
                }}
                onSelect={(e) => e.preventDefault()}
              >
                Actions
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Tableau */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader className="bg-orange-500 text-white">
            <TableRow className="hover:bg-orange-600 h-8">
              {/* Ordre demandé : ID, Tâches, Prédécesseur, Trig Netid, Ordre, Début, Fin, Temps écoulé, Statut, Actions */}
              {visibleColumns.id && (
                <TableHead className="text-white py-1 px-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-orange-600 h-auto p-0 text-xs"
                    onClick={() => handleSort("id")}
                  >
                    ID
                    <ArrowUpDown className="ml-1 h-3 w-3" />
                  </Button>
                </TableHead>
              )}
              {visibleColumns.taches && (
                <TableHead className="text-white py-1 px-2 text-xs">Tâches</TableHead>
              )}
              {visibleColumns.predecessorId && (
                <TableHead className="text-white py-1 px-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-orange-600 h-auto p-0 text-xs"
                    onClick={() => handleSort("predecessorId")}
                  >
                    Tâche Avant
                    <ArrowUpDown className="ml-1 h-3 w-3" />
                  </Button>
                </TableHead>
              )}
              {visibleColumns.trigNetid && (
                <TableHead className="text-white py-1 px-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-orange-600 h-auto p-0 text-xs"
                    onClick={() => handleSort("trigNetid")}
                  >
                    Ressource
                    <ArrowUpDown className="ml-1 h-3 w-3" />
                  </Button>
                </TableHead>
              )}
              {visibleColumns.order && (
                <TableHead className="text-white py-1 px-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-orange-600 h-auto p-0 text-xs"
                    onClick={() => handleSort("order")}
                  >
                    Ordre
                    <ArrowUpDown className="ml-1 h-3 w-3" />
                  </Button>
                </TableHead>
              )}
              {visibleColumns.startDate && (
                <TableHead className="text-white py-1 px-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-orange-600 h-auto p-0 text-xs"
                    onClick={() => handleSort("startDate")}
                  >
                    Début
                    <ArrowUpDown className="ml-1 h-3 w-3" />
                  </Button>
                </TableHead>
              )}
              {visibleColumns.endDate && (
                <TableHead className="text-white py-1 px-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-orange-600 h-auto p-0 text-xs"
                    onClick={() => handleSort("endDate")}
                  >
                    Fin
                    <ArrowUpDown className="ml-1 h-3 w-3" />
                  </Button>
                </TableHead>
              )}
              {visibleColumns.elapsedTime && (
                <TableHead className="text-white py-1 px-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-orange-600 h-auto p-0 text-xs"
                    onClick={() => handleSort("elapsedTime")}
                  >
                    Durée
                    <ArrowUpDown className="ml-1 h-3 w-3" />
                  </Button>
                </TableHead>
              )}
              {visibleColumns.status && (
                <TableHead className="text-white py-1 px-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-orange-600 h-auto p-0 text-xs"
                    onClick={() => handleSort("status")}
                  >
                    Statut
                    <ArrowUpDown className="ml-1 h-3 w-3" />
                  </Button>
                </TableHead>
              )}
              {visibleColumns.actions && (
                <TableHead className="text-white text-center py-1 px-2 text-xs">Actions</TableHead>
              )}
              {/* Colonnes masquées par défaut mais disponibles via le menu Colonnes */}
              {visibleColumns.harpitemId && (
                <TableHead className="text-white py-1 px-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-orange-600 h-auto p-0 text-xs"
                    onClick={() => handleSort("harpitemId")}
                  >
                    ID Item
                    <ArrowUpDown className="ml-1 h-3 w-3" />
                  </Button>
                </TableHead>
              )}
              {visibleColumns.resourceNetid && (
                <TableHead className="text-white py-1 px-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-orange-600 h-auto p-0 text-xs"
                    onClick={() => handleSort("resourceNetid")}
                  >
                    Ressource
                    <ArrowUpDown className="ml-1 h-3 w-3" />
                  </Button>
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedItems.length > 0 ? (
              paginatedItems.map((item) => (
                <TableRow key={item.id} className="hover:bg-gray-50 h-10">
                  {/* Ordre demandé : ID, Tâches, Prédécesseur, Trig Netid, Ordre, Début, Fin, Temps écoulé, Statut, Actions */}
                  {visibleColumns.id && (
                    <TableCell className="py-1 px-2 text-xs font-medium">{item.id}</TableCell>
                  )}
                  {visibleColumns.taches && (
                    <TableCell className="py-1 px-2">
                      <span className="text-xs font-medium">{item.harpitem?.descr || "-"}</span>
                    </TableCell>
                  )}
                  {visibleColumns.predecessorId && (
                    <TableCell className="py-1 px-2">
                      {item.predecessorId ? (
                        <span className="text-xs text-gray-600">{item.predecessorId}</span>
                      ) : (
                        <span className="text-gray-400 text-xs">-</span>
                      )}
                    </TableCell>
                  )}
                  {visibleColumns.trigNetid && (
                    <TableCell className="py-1 px-2">
                      {item.resourceNetid ? (
                        <span className="text-xs font-medium">{getTrigNetid(item.resourceNetid)}</span>
                      ) : (
                        <span className="text-gray-400 text-xs">-</span>
                      )}
                    </TableCell>
                  )}
                  {visibleColumns.order && (
                    <TableCell className="py-1 px-2 text-xs font-medium">{item.order}</TableCell>
                  )}
                  {visibleColumns.startDate && (
                    <TableCell className="py-1 px-2">
                      {item.startDate ? (
                        <span className="text-xs">
                          {new Date(item.startDate).toLocaleString("fr-FR", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">-</span>
                      )}
                    </TableCell>
                  )}
                  {visibleColumns.endDate && (
                    <TableCell className="py-1 px-2">
                      {item.endDate ? (
                        <span className="text-xs">
                          {new Date(item.endDate).toLocaleString("fr-FR", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">-</span>
                      )}
                    </TableCell>
                  )}
                  {visibleColumns.elapsedTime && (
                    <TableCell className="py-1 px-2">
                      {item.startDate && item.endDate ? (
                        <span className="text-xs font-medium font-mono">
                          {formatElapsedTime(item.startDate, item.endDate)}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">00:00:00</span>
                      )}
                    </TableCell>
                  )}
                  {visibleColumns.status && (
                    <TableCell className="py-1 px-2">
                      <Badge className={`${statusColors[item.status]} text-xs px-1.5 py-0.5`}>
                        {statusLabels[item.status]}
                      </Badge>
                    </TableCell>
                  )}
                  {visibleColumns.actions && (
                    <TableCell 
                      className="py-1 px-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <TaskItemActions
                        item={{
                          id: item.id,
                          title: item.harpitem?.descr || "",
                          taskId: taskId,
                        }}
                        fullItem={{
                          id: item.id,
                          title: item.harpitem?.descr || "",
                          startDate: item.startDate,
                          endDate: item.endDate,
                          resourceNetid: item.resourceNetid,
                          predecessorId: item.predecessorId,
                          status: item.status,
                          comment: null,
                          taskId: taskId,
                          harpitemId: item.harpitemId,
                          harpitem: item.harpitem || null,
                        }}
                        onItemUpdated={onItemUpdated}
                      />
                    </TableCell>
                  )}
                  {/* Colonnes masquées par défaut mais disponibles via le menu Colonnes */}
                  {visibleColumns.harpitemId && (
                    <TableCell className="py-1 px-2 text-xs">{item.harpitemId || "-"}</TableCell>
                  )}
                  {visibleColumns.resourceNetid && (
                    <TableCell className="py-1 px-2">
                      {item.resourceNetid ? (
                        <span className="text-xs">{item.resourceNetid}</span>
                      ) : (
                        <span className="text-gray-400 text-xs">-</span>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell 
                  colSpan={Object.values(visibleColumns).filter(v => v).length} 
                  className="text-center py-6 text-gray-500 text-sm"
                >
                  {searchTerm ? "Aucun résultat trouvé" : "Aucune tâche"}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalItems > 0 && (
        <div className="flex items-center justify-between px-2 py-4">
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
          <div className="flex items-center space-x-6 lg:space-x-8">
            <div className="flex w-[100px] items-center justify-center text-sm font-medium">
              Page {currentPage} sur {totalPages}
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                className="h-8 w-8 p-0"
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
                className="h-8 w-8 p-0"
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
    </div>
  );
}
