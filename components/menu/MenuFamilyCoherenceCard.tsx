import { loadMenuFamilyCoherence } from "@/lib/rbac-admin-read";
import { MenuFamilyCoherenceView } from "@/components/menu/MenuFamilyCoherenceView";

type MenuFamilyCoherenceCardProps = {
  menuId: number;
};

/**
 * Information de cohérence entre un menu de niveau 3 et le RBAC des familles.
 * N'écrit aucun rôle ni aucun grant.
 *
 * @param menuId - Identifiant du menu affiché
 */
export async function MenuFamilyCoherenceCard({ menuId }: MenuFamilyCoherenceCardProps) {
  const result = await loadMenuFamilyCoherence(menuId);
  if (!result.ok) {
    return <p className="text-sm text-red-700 mt-4">{result.error}</p>;
  }
  if (result.data.kind === "not-family-menu") {
    return null;
  }
  return <MenuFamilyCoherenceView data={result.data} />;
}
