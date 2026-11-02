"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import {
  attachSubroleToRole,
  createSubroleAndAttach,
  detachSubroleFromRole,
  readRoleSubroles,
} from "@/actions/rbac-admin";
import { PORTAL_ADMIN_ROLE } from "@/lib/user-roles";
import { emptyRoleSubrolesMessage } from "@/lib/rbac-menu-coherence";

type FamilyLabel = {
  typenvid: number;
  typenv: string;
  descr: string | null;
};

type SubroleRow = {
  id: number;
  code: string;
  descr: string | null;
  active: boolean;
  families: FamilyLabel[];
  roles: Array<{ id: number; role: string }>;
};

type AvailableSubrole = {
  id: number;
  code: string;
  descr: string | null;
  active: boolean;
};

type RoleSubrolesPanelProps = {
  roleId: number;
  roleName: string;
};

/**
 * Onglet des sous-rôles d'un rôle.
 * Le retrait ne supprime que harprolesubrole.
 *
 * @param roleId - Identifiant du rôle ouvert
 * @param roleName - Libellé affiché
 */
export function RoleSubrolesPanel({ roleId, roleName }: RoleSubrolesPanelProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [loading, setLoading] = useState(true);
  const [subroles, setSubroles] = useState<SubroleRow[]>([]);
  const [available, setAvailable] = useState<AvailableSubrole[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [code, setCode] = useState("");
  const [descr, setDescr] = useState("");
  const [detachId, setDetachId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const result = await readRoleSubroles(roleId);
    if (!result.success) {
      toast.error(result.error);
      setSubroles([]);
      setAvailable([]);
    } else {
      setSubroles(result.data.subroles);
      setAvailable(result.data.availableSubroles);
    }
    setLoading(false);
  }, [roleId]);

  useEffect(() => {
    void load();
  }, [load]);

  function afterChange(message: string | undefined): void {
    if (message) {
      toast.success(message);
    }
    setDetachId(null);
    setSelectedId("");
    setCode("");
    setDescr("");
    router.refresh();
    void load();
  }

  function associateExisting(): void {
    const subroleId = Number.parseInt(selectedId, 10);
    if (!Number.isInteger(subroleId) || subroleId <= 0) {
      toast.error("Choisissez un sous-rôle existant");
      return;
    }
    startTransition(async () => {
      const result = await attachSubroleToRole(roleId, subroleId);
      if (!result.success) {
        toast.error(result.error || "Association impossible");
        return;
      }
      afterChange(result.message);
    });
  }

  function createAndAssociate(): void {
    startTransition(async () => {
      const result = await createSubroleAndAttach(roleId, code, descr);
      if (!result.success) {
        toast.error(result.error || "Création impossible");
        return;
      }
      afterChange(result.message);
    });
  }

  function detach(subroleId: number): void {
    startTransition(async () => {
      const result = await detachSubroleFromRole(roleId, subroleId);
      if (!result.success) {
        toast.error(result.error || "Retrait impossible");
        return;
      }
      afterChange(result.message);
    });
  }

  if (loading) {
    return (
      <div className="flex justify-center py-6">
        <Loader2 className="h-5 w-5 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {roleName === PORTAL_ADMIN_ROLE && (
        <p className="text-xs text-slate-700 bg-slate-100 border border-slate-200 rounded-md px-3 py-2">
          PORTAL_ADMIN ouvre toutes les familles sans sous-rôle ni grant. Aucun sous-rôle n&apos;est créé pour représenter ce contournement.
        </p>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-2 border border-slate-200 rounded-md p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-700">Associer un sous-rôle existant</p>
          <select
            className="w-full border border-slate-300 rounded-md text-xs text-slate-900 px-2 py-1.5"
            value={selectedId}
            onChange={(event) => setSelectedId(event.target.value)}
          >
            <option value="">Choisir un sous-rôle</option>
            {available.map((item) => (
              <option key={item.id} value={String(item.id)}>
                {item.code}{item.active ? "" : " (inactif)"}
              </option>
            ))}
          </select>
          <Button type="button" size="sm" disabled={pending} onClick={associateExisting} className="bg-orange-600 hover:bg-orange-700 text-white">
            Associer
          </Button>
        </div>
        <div className="space-y-2 border border-slate-200 rounded-md p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-700">Créer puis associer</p>
          <input
            className="w-full border border-slate-300 rounded-md text-xs px-2 py-1.5"
            value={code}
            maxLength={32}
            placeholder="Code"
            onChange={(event) => setCode(event.target.value)}
          />
          <input
            className="w-full border border-slate-300 rounded-md text-xs px-2 py-1.5"
            value={descr}
            maxLength={100}
            placeholder="Description"
            onChange={(event) => setDescr(event.target.value)}
          />
          <Button type="button" size="sm" disabled={pending} onClick={createAndAssociate} className="bg-orange-600 hover:bg-orange-700 text-white">
            Créer et associer
          </Button>
        </div>
      </div>

      {subroles.length === 0 ? (
        <p className="text-xs text-slate-600">{emptyRoleSubrolesMessage(roleName)}</p>
      ) : (
        <ul className="space-y-2">
          {subroles.map((subrole) => {
            const otherRoles = subrole.roles.filter((role) => role.role !== roleName);
            return (
              <li key={subrole.id} className="border border-slate-200 rounded-md p-3 space-y-2">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{subrole.code}</p>
                    <p className="text-xs text-slate-600">{subrole.descr || "Sans description"}</p>
                    <p className={`text-xs font-medium ${subrole.active ? "text-emerald-700" : "text-amber-700"}`}>
                      {subrole.active ? "Actif" : "Inactif : ce sous-rôle n'accorde actuellement aucun accès"}
                    </p>
                    {otherRoles.length > 0 && (
                      <p className="text-xs text-slate-600">Également porté par : {otherRoles.map((role) => role.role).join(", ")}</p>
                    )}
                  </div>
                  {detachId === subrole.id ? (
                    <div className="space-y-1">
                      <p className="text-xs text-slate-700">Retirer seulement l&apos;association avec {roleName}. Le sous-rôle et ses familles restent.</p>
                      <div className="flex gap-2">
                        <Button type="button" size="sm" variant="destructive" disabled={pending} onClick={() => detach(subrole.id)}>
                          Confirmer le retrait
                        </Button>
                        <Button type="button" size="sm" variant="outline" onClick={() => setDetachId(null)}>
                          Annuler
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button type="button" size="sm" variant="outline" onClick={() => setDetachId(subrole.id)}>
                      Retirer l&apos;association
                    </Button>
                  )}
                </div>
                {subrole.families.length === 0 ? (
                  <p className="text-xs text-slate-500">Aucune famille TypeEnv accordée.</p>
                ) : (
                  <ul className="text-xs text-slate-800 space-y-1">
                    {subrole.families.map((family) => (
                      <li key={family.typenvid}>
                        {family.typenv}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
