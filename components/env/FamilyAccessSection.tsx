import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield } from "lucide-react";
import { loadFamilyAccess } from "@/lib/rbac-admin-read";
import { FamilyAccessAdmin } from "@/components/env/FamilyAccessAdmin";

type FamilyAccessSectionProps = {
  typenvid: number | null;
};

/**
 * Bloc d'accès RBAC de la famille portée par un environnement.
 *
 * @param typenvid - envsharp.typenvid, ou null
 */
export async function FamilyAccessSection({ typenvid }: FamilyAccessSectionProps) {
  const result = await loadFamilyAccess(typenvid);

  return (
    <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader className="harp-card-header">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-lg">
            <Shield className="h-6 w-6" />
          </div>
          <CardTitle className="text-xl sm:text-2xl">Accès à la famille</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {!result.ok && <p className="text-sm text-red-700">{result.error}</p>}
        {result.ok && result.data == null && (
          <p className="text-sm text-slate-700">
            Cet environnement n&apos;a pas de typenvid. Aucune famille ne peut être accordée depuis cette fiche.
          </p>
        )}
        {result.ok && result.data && (
          <div className="space-y-4">
            <p className="text-sm text-slate-900">
              Famille : <span className="font-semibold">{result.data.descr || result.data.typenv}</span>
              {" "}({result.data.typenv}), typenvid {result.data.typenvid}.
            </p>
            <FamilyAccessAdmin view={result.data} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
