import { PORTAL_ADMIN_ROLE } from "@/lib/user-roles";

/** Données déjà calculées, hors menu qui n'est pas de niveau famille. */
export type MenuFamilyCoherenceShown =
  | { kind: "unmatched-display"; display: number }
  | {
      kind: "matched";
      typenvid: number;
      typenv: string;
      descr: string | null;
      menuRoles: string[];
      subroles: Array<{
        id: number;
        code: string;
        active: boolean;
        roles: Array<{ role: string }>;
      }>;
      coherence: {
        menuHasNoRoleRestriction: boolean;
        menuWithoutGrant: string[];
        grantWithoutMenu: string[];
      };
    };

type MenuFamilyCoherenceViewProps = {
  data: MenuFamilyCoherenceShown;
};

/**
 * Présentation en lecture seule de la cohérence menu / famille.
 * Le calcul reste dans loadMenuFamilyCoherence.
 *
 * @param data - Vue déjà produite pour un menu de niveau 3
 */
export function MenuFamilyCoherenceView({ data }: MenuFamilyCoherenceViewProps) {
  if (data.kind === "unmatched-display") {
    return (
      <section className="mt-4 border border-slate-300 rounded-md p-4 bg-slate-50">
        <h2 className="text-base font-semibold text-slate-900">Cohérence RBAC</h2>
        <p className="text-sm text-slate-700 mt-2">
          Aucune famille ne correspond à display {data.display}. Cette valeur n&apos;est pas une clé vers harptypenv. Aucun grant n&apos;est créé.
        </p>
      </section>
    );
  }

  return (
    <section className="mt-4 border border-slate-300 rounded-md p-4 bg-slate-50 space-y-3">
      <h2 className="text-base font-semibold text-slate-900">Cohérence RBAC</h2>
      <p className="text-sm text-slate-800">
        Famille {data.descr || data.typenv} ({data.typenv}), typenvid {data.typenvid}. La correspondance display = typenvid est une convention de données. Ces indications ne modifient ni le menu ni les grants.
      </p>
      <p className="text-sm text-slate-700">
        {PORTAL_ADMIN_ROLE} voit ce menu actif et cette famille par les contournements existants, sans grant artificiel.
      </p>
      <p className="text-sm text-slate-700">
        Rôles pris en compte pour le menu (colonne et associations) : {data.menuRoles.length > 0 ? data.menuRoles.join(", ") : "aucun"}.
      </p>
      {data.coherence.menuHasNoRoleRestriction && (
        <p className="text-sm text-amber-800">
          Ce menu n&apos;a aucun rôle. Il reste visible pour tous, sans ouvrir la famille.
        </p>
      )}
      {data.subroles.length === 0 ? (
        <p className="text-sm text-slate-600">Aucun sous-rôle n&apos;accorde cette famille.</p>
      ) : (
        <ul className="text-sm text-slate-800 space-y-1">
          {data.subroles.map((subrole) => (
            <li key={subrole.id}>
              {subrole.code} — {subrole.active ? "actif" : "inactif"} — rôles : {subrole.roles.map((role) => role.role).join(", ") || "aucun"}
            </li>
          ))}
        </ul>
      )}
      {data.coherence.menuWithoutGrant.map((role) => (
        <p key={`menu-${role}`} className="text-sm text-amber-800">
          Menu visible pour {role}, mais aucun accès RBAC actif à cette famille.
        </p>
      ))}
      {data.coherence.grantWithoutMenu.map((role) => (
        <p key={`grant-${role}`} className="text-sm text-sky-800">
          Accès RBAC autorisé, mais menu non visible pour {role}.
        </p>
      ))}
    </section>
  );
}
