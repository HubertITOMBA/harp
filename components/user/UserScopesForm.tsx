"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { updateUserScopes } from "@/actions/update-user-scopes";
import type { AssignableUserScopeCode } from "@/lib/user-scopes";

type ScopeOption = {
  code: AssignableUserScopeCode;
  descr: string;
  checked: boolean;
};

interface UserScopesFormProps {
  netid: string;
  options: ScopeOption[];
}

/**
 * Cases 4K et 150K de la fiche utilisateur.
 * L'enregistrement envoie des codes, pas des identifiants.
 *
 * @param netid - Utilisateur cible
 * @param options - Périmètres affectables et leur état actuel
 */
export function UserScopesForm({ netid, options }: UserScopesFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selected, setSelected] = useState<AssignableUserScopeCode[]>(
    options.filter((option) => option.checked).map((option) => option.code)
  );

  const toggle = (code: AssignableUserScopeCode, checked: boolean) => {
    setSelected((current) => {
      if (checked) {
        return current.includes(code) ? current : [...current, code];
      }
      return current.filter((item) => item !== code);
    });
  };

  const save = () => {
    startTransition(async () => {
      const result = await updateUserScopes(netid, selected);
      if (result.success) {
        toast.success(result.message || "Périmètres d'environnements mis à jour");
        router.refresh();
        return;
      }
      toast.error(result.error || "Erreur lors de la mise à jour des périmètres");
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {options.map((option) => {
          const inputId = `scope-${option.code}`;
          const checked = selected.includes(option.code);
          return (
            <label
              key={option.code}
              htmlFor={inputId}
              className="flex items-center gap-3 rounded-md border border-orange-200 bg-orange-50 px-3 py-3 cursor-pointer"
            >
              <Checkbox
                id={inputId}
                checked={checked}
                disabled={isPending}
                onCheckedChange={(value) => toggle(option.code, value === true)}
              />
              <span className="text-sm font-semibold text-slate-900">{option.code}</span>
              {option.descr && option.descr !== option.code && (
                <span className="text-xs text-slate-600">{option.descr}</span>
              )}
            </label>
          );
        })}
      </div>
      <div className="flex justify-end">
        <Button
          type="button"
          onClick={save}
          disabled={isPending}
          className="bg-orange-600 hover:bg-orange-700 text-white"
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Enregistrement...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Enregistrer les périmètres
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
