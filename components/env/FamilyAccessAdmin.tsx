"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { grantFamilyThroughSubrole, revokeFamilyFromSubrole } from "@/actions/rbac-admin";
import type { FamilyAccessView } from "@/lib/rbac-admin-read";

type FamilyAccessAdminProps = {
  view: FamilyAccessView;
};

/**
 * Administration Sous-rôle / TypeEnv pour la famille de l'environnement ouvert.
 * N'écrit jamais de lien direct rôle / famille.
 *
 * @param view - Famille, sous-rôles et rôles déjà chargés
 */
export function FamilyAccessAdmin({ view }: FamilyAccessAdminProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [roleId, setRoleId] = useState("");
  const [mode, setMode] = useState<"existing" | "create">("existing");
  const [subroleId, setSubroleId] = useState("");
  const [code, setCode] = useState("");
  const [descr, setDescr] = useState("");
  const [confirmGrant, setConfirmGrant] = useState(false);
  const [revokeId, setRevokeId] = useState<number | null>(null);

  const selectedRole = view.roles.find((role) => String(role.id) === roleId);
  const selectedSubrole = selectedRole?.subroles.find((subrole) => String(subrole.id) === subroleId);
  const sharedNames = selectedSubrole?.sharedRoles ?? [];
  const sharedGrant = mode === "existing" && sharedNames.length > 1;

  function refresh(message: string | undefined): void {
    if (message) {
      toast.success(message);
    }
    setConfirmGrant(false);
    setRevokeId(null);
    setCode("");
    setDescr("");
    router.refresh();
  }

  function submitGrant(): void {
    if (!selectedRole) {
      toast.error("Choisissez un rôle");
      return;
    }
    if (mode === "existing" && (!Number.isInteger(Number.parseInt(subroleId, 10)) || Number.parseInt(subroleId, 10) <= 0)) {
      toast.error("Choisissez un sous-rôle déjà associé à ce rôle");
      return;
    }
    if (sharedGrant && !confirmGrant) {
      setConfirmGrant(true);
      return;
    }
    startTransition(async () => {
      const result = mode === "create"
        ? await grantFamilyThroughSubrole({
            roleId: selectedRole.id,
            typenvid: view.typenvid,
            newSubrole: { code, descr },
          })
        : await grantFamilyThroughSubrole({
            roleId: selectedRole.id,
            typenvid: view.typenvid,
            subroleId: Number.parseInt(subroleId, 10),
          });
      if (!result.success) {
        toast.error(result.error || "Attribution impossible");
        return;
      }
      refresh(result.message);
    });
  }

  function submitRevoke(id: number): void {
    startTransition(async () => {
      const result = await revokeFamilyFromSubrole(id, view.typenvid);
      if (!result.success) {
        toast.error(result.error || "Retrait impossible");
        return;
      }
      refresh(result.message);
    });
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-800">
        Cette permission concerne tous les environnements de la famille {view.descr || view.typenv} (typenvid {view.typenvid}), pas seulement l&apos;environnement affiché. Le périmètre 4K / 150K n&apos;est pas modifié ici.
      </p>

      {view.subroles.length === 0 ? (
        <p className="text-sm text-slate-600">Aucun sous-rôle n&apos;accorde cette famille.</p>
      ) : (
        <ul className="space-y-3">
          {view.subroles.map((subrole) => (
            <li key={subrole.id} className="border border-slate-200 rounded-md p-3 space-y-2">
              <p className="text-sm font-semibold text-slate-900">{subrole.code}</p>
              <p className="text-xs text-slate-600">{subrole.descr || "Sans description"}</p>
              <p className={`text-xs font-medium ${subrole.active ? "text-emerald-700" : "text-amber-700"}`}>
                {subrole.active ? "Actif" : "Inactif : n'accorde actuellement aucun accès"}
              </p>
              <p className="text-xs text-slate-700">
                Rôles qui héritent de cet accès : {subrole.roles.length > 0 ? subrole.roles.map((role) => role.role).join(", ") : "aucun"}
              </p>
              {revokeId === subrole.id ? (
                <div className="space-y-2">
                  <p className="text-xs text-amber-800">
                    Le retrait supprime seulement le lien sous-rôle / famille. Il touche tous les rôles de ce sous-rôle
                    {subrole.roles.length > 0 ? ` : ${subrole.roles.map((role) => role.role).join(", ")}` : ""}.
                  </p>
                  <div className="flex gap-2">
                    <Button type="button" size="sm" variant="destructive" disabled={pending} onClick={() => submitRevoke(subrole.id)}>
                      Confirmer le retrait
                    </Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => setRevokeId(null)}>
                      Annuler
                    </Button>
                  </div>
                </div>
              ) : (
                <Button type="button" size="sm" variant="outline" onClick={() => setRevokeId(subrole.id)}>
                  Retirer cette famille
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}

      <div className="border border-orange-200 rounded-md p-3 space-y-2 bg-orange-50/40">
        <p className="text-sm font-semibold text-slate-900">Accorder cette famille à un rôle</p>
        <p className="text-xs text-slate-600">Le rôle reçoit la famille par un sous-rôle. Aucun lien direct rôle / famille n&apos;est enregistré.</p>
        <select
          className="w-full border border-slate-300 rounded-md text-sm px-2 py-1.5 bg-white"
          value={roleId}
          onChange={(event) => {
            setRoleId(event.target.value);
            setSubroleId("");
            setConfirmGrant(false);
          }}
        >
          <option value="">Choisir un rôle</option>
          {view.roles.map((role) => (
            <option key={role.id} value={String(role.id)}>{role.role}</option>
          ))}
        </select>
        <div className="flex gap-3 text-xs text-slate-800">
          <label className="flex items-center gap-1">
            <input type="radio" checked={mode === "existing"} onChange={() => { setMode("existing"); setConfirmGrant(false); }} />
            Sous-rôle déjà associé
          </label>
          <label className="flex items-center gap-1">
            <input type="radio" checked={mode === "create"} onChange={() => { setMode("create"); setConfirmGrant(false); }} />
            Créer un sous-rôle
          </label>
        </div>
        {mode === "existing" ? (
          <select
            className="w-full border border-slate-300 rounded-md text-sm px-2 py-1.5 bg-white"
            value={subroleId}
            onChange={(event) => {
              setSubroleId(event.target.value);
              setConfirmGrant(false);
            }}
          >
            <option value="">Choisir un sous-rôle du rôle</option>
            {(selectedRole?.subroles ?? []).map((subrole) => (
              <option key={subrole.id} value={String(subrole.id)}>
                {subrole.code}{subrole.active ? "" : " (inactif)"}
              </option>
            ))}
          </select>
        ) : (
          <div className="grid gap-2">
            <input className="border border-slate-300 rounded-md text-sm px-2 py-1.5" placeholder="Code" maxLength={32} value={code} onChange={(event) => setCode(event.target.value)} />
            <input className="border border-slate-300 rounded-md text-sm px-2 py-1.5" placeholder="Description" maxLength={100} value={descr} onChange={(event) => setDescr(event.target.value)} />
          </div>
        )}
        {sharedGrant && (
          <p className="text-xs text-amber-800">
            Ce sous-rôle est partagé. Accorder cette famille affectera tous les rôles qui l&apos;utilisent : {sharedNames.join(", ")}.
          </p>
        )}
        <Button type="button" size="sm" disabled={pending} className="bg-orange-600 hover:bg-orange-700 text-white" onClick={submitGrant}>
          {sharedGrant && !confirmGrant ? "Voir l'effet sur les rôles" : "Accorder la famille"}
        </Button>
      </div>
    </div>
  );
}
