"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ExternalLink, Globe, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getEnvFamilyCard } from "@/actions/get-env-family-card";
import { EnvFamilyCard, type EnvFamilyEnvironment } from "./EnvFamilyCard";
import { HarpUrlLink } from "./HarpUrlLink";
import { useEnvFamilyBusyApi, useEnvFamilyCloseToken } from "./EnvFamilyCloseProvider";

interface EnvFamilyRowProps {
  envId: number;
  name: string;
  url: string | null;
  anonym: string | null;
  edi: string | null;
  descr: string | null;
  statenv: string | null;
  icone: string | null;
  appli: string | null;
  harprelease: string | null;
  serverLabel: string | null;
  "data-env-id": number;
}

/**
 * Convertit une date sérialisée par la Server Action en Date.
 * Une valeur illisible reste absente pour ne pas afficher une date fausse.
 *
 * @param value - Date Prisma ou chaîne ISO renvoyée au client
 * @returns Date exploitable, ou null
 */
function toDate(value: Date | string | null | undefined): Date | null {
  if (value == null || value === "") {
    return null;
  }
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Réhydrate les dates de la fiche après le passage client.
 * Les mots de passe restent des chaînes et ne sont pas journalisés.
 *
 * @param envsharp - Fiche renvoyée par getEnvFamilyCard
 * @returns Fiche attendue par EnvFamilyCard
 */
function reviveCard(envsharp: EnvFamilyEnvironment): EnvFamilyEnvironment {
  return {
    ...envsharp,
    harpenvinfo: envsharp.harpenvinfo.map((info) => {
      const raw = info as typeof info & {
        datmaj: Date | string | null;
        refreshdt: Date | string | null;
        datadt: Date | string | null;
        modedt: Date | string | null;
      };
      return {
        ...info,
        datmaj: (toDate(raw.datmaj) ?? null) as unknown as Date,
        refreshdt: toDate(raw.refreshdt),
        datadt: toDate(raw.datadt),
        modedt: toDate(raw.modedt),
      };
    }),
  };
}

function displayValue(value: string | null | undefined): string {
  const text = value?.trim();
  return text ? text : "—";
}

function harpVersion(appli: string | null, harprelease: string | null): string {
  const parts = [appli, harprelease].filter((part) => part && part.trim());
  return parts.length > 0 ? parts.join(" ") : "—";
}

/**
 * Ligne compacte d'un environnement, avec fiche complète à la demande.
 * La fiche et ses mots de passe ne sont conservés que tant que la ligne est ouverte.
 *
 * @param envId - Identifiant envsharp utilisé pour le chargement autorisé
 * @param name - Nom de l'environnement
 * @param url - URL PeopleSoft, absente si le nom n'est pas un lien
 * @param anonym - Voyant Anonymisée lorsque la valeur n'est pas N
 * @param edi - Voyant EDI et image associée lorsque la valeur n'est pas N
 * @param descr - Description affichée sur le second niveau
 * @param statenv - Libellé de statut, conservé par l'appelant et absent de la ligne compacte
 * @param icone - Icône de statut, conservée par l'appelant et absente de la ligne compacte
 * @param appli - Code application de la version HARP
 * @param harprelease - Release HARP
 * @param serverLabel - Serveur principal déjà choisi pour la liste
 * @param data-env-id - Identifiant lu par la recherche de la liste
 */
export function EnvFamilyRow({
  envId,
  name,
  url,
  anonym,
  edi,
  descr,
  appli,
  harprelease,
  serverLabel,
  "data-env-id": dataEnvId,
}: EnvFamilyRowProps) {
  const requestId = useRef(0);
  const closeToken = useEnvFamilyCloseToken();
  const busyApi = useEnvFamilyBusyApi();
  const seenCloseToken = useRef(closeToken);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<"denied" | "unavailable" | null>(null);
  const [card, setCard] = useState<EnvFamilyEnvironment | null>(null);

  const closeDetails = useCallback(() => {
    requestId.current += 1;
    setOpen(false);
    setLoading(false);
    setError(null);
    setCard(null);
  }, []);

  useEffect(() => {
    if (seenCloseToken.current === closeToken) {
      return;
    }
    seenCloseToken.current = closeToken;
    closeDetails();
  }, [closeToken, closeDetails]);

  useEffect(() => {
    busyApi?.setRowBusy(envId, open || loading);
  }, [busyApi, envId, open, loading]);

  useEffect(() => {
    return () => busyApi?.setRowBusy(envId, false);
  }, [busyApi, envId]);

  const openDetails = async () => {
    const current = requestId.current + 1;
    requestId.current = current;
    setOpen(true);
    setLoading(true);
    setError(null);
    setCard(null);

    try {
      const result = await getEnvFamilyCard(envId);
      if (requestId.current !== current) {
        return;
      }
      if (!result.success) {
        setError(result.error);
        setCard(null);
        return;
      }
      setCard(reviveCard(result.envsharp));
    } catch {
      if (requestId.current !== current) {
        return;
      }
      setError("unavailable");
      setCard(null);
    } finally {
      if (requestId.current === current) {
        setLoading(false);
      }
    }
  };

  return (
    <div
      data-env-id={dataEnvId}
      className="w-full rounded-md border border-orange-200 bg-white shadow-sm"
    >
      <div className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:gap-4 sm:p-4">
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <HarpUrlLink
              href={url || "#"}
              className="break-words text-sm font-bold text-harpOrange hover:underline sm:text-base"
            >
              {name}
              {url ? <ExternalLink className="ml-1 inline h-3 w-3 text-slate-500" /> : null}
            </HarpUrlLink>
            {anonym !== "N" ? (
              <Badge
                variant="outline"
                className="text-xs border-orange-400 text-orange-800 bg-orange-50"
              >
                <Image
                  src="/ressources/anonym.png"
                  alt="ANO"
                  width={16}
                  height={16}
                  className="object-contain align-middle"
                />
                Anonymisée
              </Badge>
            ) : null}
            {edi !== "N" ? (
              <span className="inline-flex items-center gap-1">
                <Badge
                  variant="outline"
                  className="text-xs border-sky-400 text-sky-800 bg-sky-50"
                >
                  <Globe className="mr-1 h-3 w-3" />
                  EDI
                </Badge>
                <Image
                  src="/ressources/edi.png"
                  alt="EDI"
                  width={80}
                  height={16}
                  className="h-4 w-auto max-h-4 object-contain"
                />
              </span>
            ) : null}
          </div>

          <dl className="grid grid-cols-1 gap-y-1.5 sm:grid-cols-[minmax(0,1.4fr)_minmax(6.5rem,0.7fr)_minmax(7rem,0.8fr)] sm:gap-x-4">
            <div className="min-w-0">
              <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-600 sm:text-xs">Description</dt>
              <dd className="mt-0.5 break-words text-sm text-slate-600">{displayValue(descr)}</dd>
            </div>
            <div className="min-w-0">
              <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-600 sm:text-xs">HARP</dt>
              <dd className="mt-0.5 break-words font-mono text-sm font-medium text-slate-900">{harpVersion(appli, harprelease)}</dd>
            </div>
            <div className="min-w-0">
              <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-600 sm:text-xs">Serveur</dt>
              <dd className="mt-0.5 break-words font-mono text-sm font-medium text-slate-900">{displayValue(serverLabel)}</dd>
            </div>
          </dl>
        </div>

        <Button
          type="button"
          variant="outline"
          aria-expanded={open}
          onClick={() => {
            if (open) {
              closeDetails();
              return;
            }
            void openDetails();
          }}
          className="h-8 w-full shrink-0 border-orange-300 text-xs text-orange-800 hover:bg-orange-50 sm:w-24"
        >
          {open ? "Fermer" : "Détails"}
        </Button>
      </div>

      {open && loading ? (
        <div className="flex items-center gap-2 border-t border-orange-100 px-3 py-3 text-xs text-slate-600">
          <Loader2 className="h-4 w-4 animate-spin text-orange-600" />
          Chargement de la fiche…
        </div>
      ) : null}

      {open && error === "denied" ? (
        <p className="border-t border-orange-100 px-3 py-3 text-xs text-red-700">
          Accès refusé. Vous n&apos;avez pas les permissions nécessaires pour cette fiche.
        </p>
      ) : null}

      {open && error === "unavailable" ? (
        <p className="border-t border-orange-100 px-3 py-3 text-xs text-red-700">
          Impossible de charger la fiche. Veuillez réessayer.
        </p>
      ) : null}

      {open && card ? (
        <div className="border-t border-orange-100 p-2 sm:p-3">
          <EnvFamilyCard data-env-id={dataEnvId} envsharp={card} hideHeader />
        </div>
      ) : null}
    </div>
  );
}
