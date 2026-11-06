import Link from "next/link";
import { FolderTree } from "lucide-react";
import { requirePortalAdmin } from "@/lib/require-portal-admin";
import { loadFamilyAdminCatalog } from "@/lib/family-admin-read";
import { CreateFamilyDialog } from "@/components/family/CreateFamilyDialog";
import { FamilyTable } from "@/components/family/FamilyTable";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

/**
 * Consultation des familles harptypenv.
 * Le dashboard exige déjà PORTAL_ADMIN. Cette page le revérifie en base.
 * La création et la suppression passent par des Server Actions réservées à PORTAL_ADMIN.
 */
export default async function FamilyAdminPage() {
  const admin = await requirePortalAdmin();
  if (!admin.ok) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4 text-red-600">Accès refusé</h1>
          <p className="text-muted-foreground mb-4">{admin.error}</p>
          <Link href="/home" className="text-primary hover:underline">
            Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    );
  }

  const catalog = await loadFamilyAdminCatalog();
  const withoutMenu = catalog.families.filter((family) => family.withoutMenu).length;
  const withRbac = catalog.families.filter((family) => family.hasRbac).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-200 to-orange-50 p-3 sm:p-4 lg:p-6">
      <div className="space-y-4 sm:space-y-6">
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="harp-card-header">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="flex items-center gap-3 text-xl sm:text-2xl lg:text-3xl font-bold">
                  <FolderTree className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8" />
                  Familles d&apos;environnements
                </CardTitle>
                <p className="text-orange-50 text-sm sm:text-base mt-2">
                  {catalog.families.length} famille{catalog.families.length > 1 ? "s" : ""} enregistrée{catalog.families.length > 1 ? "s" : ""}.
                </p>
              </div>
              <CreateFamilyDialog />
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-md border border-amber-300 bg-amber-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">Familles sans menu</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">{withoutMenu}</p>
                <p className="text-xs text-slate-600">Aucun menu de niveau 3 avec le même display.</p>
              </div>
              <div className="rounded-md border border-sky-300 bg-sky-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-sky-800">Menus sans famille</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">{catalog.orphanMenus.length}</p>
                <p className="text-xs text-slate-600">Menu de niveau 3 dont le display ne désigne aucune famille.</p>
              </div>
              <div className="rounded-md border border-emerald-300 bg-emerald-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">Familles avec RBAC</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">{withRbac}</p>
                <p className="text-xs text-slate-600">Au moins un sous-rôle est lié à la famille.</p>
              </div>
            </div>

            <FamilyTable families={catalog.families} />
          </CardContent>
        </Card>

        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="harp-card-header">
            <CardTitle className="text-xl sm:text-2xl font-bold">
              Menus de niveau 3 sans famille
            </CardTitle>
            <p className="text-orange-50 text-sm sm:text-base mt-2">
              {catalog.orphanMenus.length} menu{catalog.orphanMenus.length > 1 ? "s" : ""}. Aucun grant n&apos;est créé.
            </p>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>display</TableHead>
                  <TableHead>Menu</TableHead>
                  <TableHead>État</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {catalog.orphanMenus.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-slate-600">
                      Chaque menu de niveau 3 correspond à une famille.
                    </TableCell>
                  </TableRow>
                ) : (
                  catalog.orphanMenus.map((menu) => (
                    <TableRow key={menu.id}>
                      <TableCell className="font-mono">{menu.display}</TableCell>
                      <TableCell className="font-medium text-slate-900">{menu.menu}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-sky-400 text-sky-800 bg-sky-50">
                          {menu.active === 1 ? "Sans famille" : "Sans famille, inactif"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
