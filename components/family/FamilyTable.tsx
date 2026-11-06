"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { FamilyAdminRow } from "@/lib/family-admin-read";
import { DeleteFamilyButton } from "@/components/family/DeleteFamilyButton";
import { EditFamilyDialog } from "@/components/family/EditFamilyDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const PAGE_SIZES = [10, 20, 50] as const;
const DEFAULT_PAGE_SIZE = 20;

/** Colonne triable du tableau des familles. */
export type FamilySortColumn =
  | "typenvid"
  | "name"
  | "description"
  | "environments"
  | "menu"
  | "subroles"
  | "coherence";

/** Sens de tri. Les valeurs absentes ne suivent pas le sens descendant. */
export type FamilySortDirection = "asc" | "desc";

/** Tri choisi par l'administrateur. */
export type FamilySort = {
  column: FamilySortColumn;
  direction: FamilySortDirection;
};

const INITIAL_SORT: FamilySort = { column: "typenvid", direction: "asc" };

const SORTABLE_COLUMNS: Array<{ id: FamilySortColumn; label: string; align: "left" | "right" }> = [
  { id: "typenvid", label: "typenvid", align: "left" },
  { id: "name", label: "Nom", align: "left" },
  { id: "description", label: "Description", align: "left" },
  { id: "environments", label: "Environnements", align: "right" },
  { id: "menu", label: "Menu de niveau 3", align: "left" },
  { id: "subroles", label: "Sous-rôles", align: "right" },
  { id: "coherence", label: "Cohérence", align: "left" },
];

type FamilyTableProps = {
  families: FamilyAdminRow[];
};

/**
 * Compare deux textes français. Une valeur nulle ou vide reste après une valeur présente.
 *
 * @param left - Texte de gauche, ou absent
 * @param right - Texte de droite, ou absent
 * @param direction - Sens appliqué seulement aux deux valeurs présentes
 * @returns Négatif si left précède right
 */
function compareOptionalText(
  left: string | null,
  right: string | null,
  direction: FamilySortDirection,
): number {
  const leftAbsent = left == null || left.length === 0;
  const rightAbsent = right == null || right.length === 0;
  if (leftAbsent || rightAbsent) {
    if (leftAbsent && rightAbsent) {
      return 0;
    }
    return leftAbsent ? 1 : -1;
  }
  const compared = left.localeCompare(right, "fr");
  return direction === "desc" ? -compared : compared;
}

/**
 * Compare deux nombres. Une valeur nulle reste après une valeur présente.
 *
 * @param left - Nombre de gauche, ou absent
 * @param right - Nombre de droite, ou absent
 * @param direction - Sens appliqué seulement aux deux valeurs présentes
 * @returns Négatif si left précède right
 */
function compareOptionalNumber(
  left: number | null,
  right: number | null,
  direction: FamilySortDirection,
): number {
  if (left == null || right == null) {
    if (left == null && right == null) {
      return 0;
    }
    return left == null ? 1 : -1;
  }
  const compared = left - right;
  return direction === "desc" ? -compared : compared;
}

/**
 * Reproduit le texte visible de la colonne Menu de niveau 3.
 *
 * @param family - Ligne à afficher
 * @returns Noms joints, ou null s'il n'y a aucun menu
 */
function visibleMenuLabel(family: FamilyAdminRow): string | null {
  if (family.menus.length === 0) {
    return null;
  }
  return family.menus
    .map((menu) => `${menu.menu}${menu.active === 1 ? "" : " (inactif)"}`)
    .join(" ");
}

/**
 * Reproduit le libellé visible de la colonne Cohérence.
 *
 * @param family - Ligne à afficher
 * @returns Texte des pastilles, dans leur ordre d'affichage
 */
function visibleCoherenceLabel(family: FamilyAdminRow): string {
  if (!family.withoutMenu && !family.hasRbac) {
    return "Menu présent, sans sous-rôle";
  }
  const parts: string[] = [];
  if (family.withoutMenu) {
    parts.push("Sans menu");
  }
  if (family.hasRbac) {
    parts.push("RBAC");
  }
  return parts.join(" ");
}

/**
 * Départage deux lignes égales sur la colonne choisie.
 * L'ordre reste typenvid croissant, puis le nom, quel que soit le sens du tri.
 *
 * @param left - Première ligne
 * @param right - Seconde ligne
 * @returns Négatif si left précède right
 */
function compareFamilyTie(left: FamilyAdminRow, right: FamilyAdminRow): number {
  const byId = compareOptionalNumber(left.typenvid, right.typenvid, "asc");
  if (byId !== 0) {
    return byId;
  }
  return left.typenv.localeCompare(right.typenv, "fr");
}

/**
 * Compare deux familles selon la colonne et le sens demandés.
 * Les valeurs absentes restent en dernier, y compris en ordre décroissant.
 *
 * @param left - Première ligne
 * @param right - Seconde ligne
 * @param sort - Colonne et sens
 * @returns Négatif si left précède right
 */
export function compareFamilies(
  left: FamilyAdminRow,
  right: FamilyAdminRow,
  sort: FamilySort,
): number {
  let primary = 0;
  if (sort.column === "typenvid") {
    primary = compareOptionalNumber(left.typenvid, right.typenvid, sort.direction);
  } else if (sort.column === "name") {
    primary = compareOptionalText(left.typenv, right.typenv, sort.direction);
  } else if (sort.column === "description") {
    primary = compareOptionalText(left.descr, right.descr, sort.direction);
  } else if (sort.column === "environments") {
    primary = compareOptionalNumber(left.environmentCount, right.environmentCount, sort.direction);
  } else if (sort.column === "menu") {
    primary = compareOptionalText(visibleMenuLabel(left), visibleMenuLabel(right), sort.direction);
  } else if (sort.column === "subroles") {
    const byCount = left.subroleCount - right.subroleCount;
    const difference = byCount !== 0 ? byCount : left.activeSubroleCount - right.activeSubroleCount;
    primary = sort.direction === "desc" ? -difference : difference;
  } else {
    primary = compareOptionalText(visibleCoherenceLabel(left), visibleCoherenceLabel(right), sort.direction);
  }
  if (primary !== 0) {
    return primary;
  }
  return compareFamilyTie(left, right);
}

/**
 * Trie une copie de la liste complète. La liste d'origine n'est pas modifiée.
 *
 * @param families - Lignes reçues par le tableau
 * @param sort - Colonne et sens
 * @returns Nouvelle liste triée
 */
export function sortFamilies(families: readonly FamilyAdminRow[], sort: FamilySort): FamilyAdminRow[] {
  return [...families].sort((left, right) => compareFamilies(left, right, sort));
}

/**
 * Affiche les familles par pages, sans nouvelle lecture.
 * Le tri porte sur toute la liste avant le découpage.
 * La page et le tri choisis sont conservés après un rafraîchissement tant que la page existe.
 *
 * @param families - Catalogue complet
 */
export function FamilyTable({ families }: FamilyTableProps) {
  const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<FamilySort>(INITIAL_SORT);
  const sortedFamilies = useMemo(() => sortFamilies(families, sort), [families, sort]);
  const pageCount = Math.max(1, Math.ceil(sortedFamilies.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const startIndex = (currentPage - 1) * pageSize;
  const visibleFamilies = sortedFamilies.slice(startIndex, startIndex + pageSize);
  const rangeStart = families.length === 0 ? 0 : startIndex + 1;
  const rangeEnd = startIndex + visibleFamilies.length;

  useEffect(() => {
    if (page > pageCount) {
      setPage(pageCount);
    }
  }, [page, pageCount]);

  function changePageSize(value: string): void {
    setPageSize(Number(value));
    setPage(1);
  }

  function changeSort(column: FamilySortColumn): void {
    setSort((current) => {
      if (current.column === column) {
        return { column, direction: current.direction === "asc" ? "desc" : "asc" };
      }
      return { column, direction: "asc" };
    });
    setPage(1);
  }

  return (
    <div className="space-y-3">
      <Table>
        <TableHeader className="bg-slate-100">
          <TableRow className="border-slate-200 bg-slate-100 hover:bg-slate-100">
            {SORTABLE_COLUMNS.map((column) => {
              const active = sort.column === column.id;
              const DirectionIcon = sort.direction === "asc" ? ChevronUp : ChevronDown;
              return (
                <TableHead
                  key={column.id}
                  aria-sort={active ? (sort.direction === "asc" ? "ascending" : "descending") : "none"}
                  className={`font-semibold text-slate-800 ${column.align === "right" ? "text-right" : ""}`}
                >
                  <button
                    type="button"
                    className={`inline-flex items-center gap-1 font-semibold text-slate-800 ${column.align === "right" ? "w-full justify-end" : ""}`}
                    onClick={() => changeSort(column.id)}
                  >
                    {column.label}
                    {active ? <DirectionIcon className="h-3.5 w-3.5" aria-hidden="true" /> : null}
                  </button>
                </TableHead>
              );
            })}
            <TableHead className="text-right font-semibold text-slate-800">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {families.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-slate-600">
                Aucune famille dans harptypenv.
              </TableCell>
            </TableRow>
          ) : (
            visibleFamilies.map((family) => (
              <TableRow key={family.id}>
                <TableCell className="font-mono">{family.typenvid ?? "—"}</TableCell>
                <TableCell className="font-medium text-slate-900">{family.typenv}</TableCell>
                <TableCell>{family.descr || "—"}</TableCell>
                <TableCell className="text-right">{family.environmentCount}</TableCell>
                <TableCell>
                  {family.menus.length === 0
                    ? "—"
                    : family.menus.map((menu) => (
                        <span key={menu.id} className="block">
                          {menu.menu}
                          {menu.active === 1 ? "" : " (inactif)"}
                        </span>
                      ))}
                </TableCell>
                <TableCell className="text-right">
                  {family.subroleCount}
                  {family.subroleCount > 0 ? (
                    <span className="block text-xs text-slate-500">
                      {family.activeSubroleCount} actif{family.activeSubroleCount > 1 ? "s" : ""}
                    </span>
                  ) : null}
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {family.withoutMenu ? (
                      <Badge variant="outline" className="border-amber-400 text-amber-800 bg-amber-50">
                        Sans menu
                      </Badge>
                    ) : null}
                    {family.hasRbac ? (
                      <Badge variant="outline" className="border-emerald-400 text-emerald-800 bg-emerald-50">
                        RBAC
                      </Badge>
                    ) : null}
                    {!family.withoutMenu && !family.hasRbac ? (
                      <span className="text-xs text-slate-500">Menu présent, sans sous-rôle</span>
                    ) : null}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <EditFamilyDialog
                      id={family.id}
                      typenv={family.typenv}
                      typenvid={family.typenvid}
                      descr={family.descr}
                    />
                    <DeleteFamilyButton
                      id={family.id}
                      typenv={family.typenv}
                      typenvid={family.typenvid}
                      environmentCount={family.environmentCount}
                      subroleCount={family.subroleCount}
                      menuCount={family.menus.length}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {families.length > 0 ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs font-medium text-slate-700">
            {rangeStart}–{rangeEnd} sur {families.length} famille{families.length > 1 ? "s" : ""}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <label htmlFor="family-page-size" className="text-xs font-medium text-slate-700">
                Lignes par page
              </label>
              <Select value={String(pageSize)} onValueChange={changePageSize}>
                <SelectTrigger id="family-page-size" className="h-8 w-[72px] border-slate-300 text-xs text-slate-900">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAGE_SIZES.map((size) => (
                    <SelectItem key={size} value={String(size)}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs font-medium text-slate-700">
              Page {currentPage} sur {pageCount}
            </p>
            {pageCount > 1 ? (
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="border-slate-300 text-slate-800"
                  disabled={currentPage <= 1}
                  onClick={() => setPage(currentPage - 1)}
                >
                  Précédent
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="border-slate-300 text-slate-800"
                  disabled={currentPage >= pageCount}
                  onClick={() => setPage(currentPage + 1)}
                >
                  Suivant
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
