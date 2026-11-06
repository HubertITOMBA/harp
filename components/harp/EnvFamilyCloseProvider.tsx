"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Button } from "@/components/ui/button";

const CloseTokenContext = createContext(0);
const BusyCountContext = createContext(0);

type BusyApi = {
  setRowBusy: (envId: number, busy: boolean) => void;
};

const BusyApiContext = createContext<BusyApi | null>(null);
const CloseAllContext = createContext<() => void>(() => {});

/**
 * Partage un signal de fermeture et le nombre de fiches actives.
 * Les fiches et les mots de passe restent dans chaque ligne.
 *
 * @param children - Titre de la famille et liste des lignes
 */
export function EnvFamilyCloseProvider({ children }: { children: ReactNode }) {
  const [closeToken, setCloseToken] = useState(0);
  const [busyCount, setBusyCount] = useState(0);
  const busyIds = useRef(new Set<number>());
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const setRowBusy = useCallback((envId: number, busy: boolean) => {
    const ids = busyIds.current;
    const present = ids.has(envId);
    if (busy === present) {
      return;
    }
    if (busy) {
      ids.add(envId);
    } else {
      ids.delete(envId);
    }
    if (alive.current) {
      setBusyCount(ids.size);
    }
  }, []);

  const closeAll = useCallback(() => {
    setCloseToken((token) => token + 1);
  }, []);

  const busyApi = useMemo(() => ({ setRowBusy }), [setRowBusy]);

  return (
    <CloseTokenContext.Provider value={closeToken}>
      <BusyApiContext.Provider value={busyApi}>
        <BusyCountContext.Provider value={busyCount}>
          <CloseAllContext.Provider value={closeAll}>
            {children}
          </CloseAllContext.Provider>
        </BusyCountContext.Provider>
      </BusyApiContext.Provider>
    </CloseTokenContext.Provider>
  );
}

/**
 * Jeton de fermeture globale. Il ne change que lors d'un « Tout fermer ».
 */
export function useEnvFamilyCloseToken(): number {
  return useContext(CloseTokenContext);
}

/**
 * Signale qu'une ligne a une fiche ouverte ou en cours de chargement.
 */
export function useEnvFamilyBusyApi(): BusyApi | null {
  return useContext(BusyApiContext);
}

/**
 * Bouton qui referme toutes les fiches ouvertes de la famille affichée.
 * Il est inactif tant qu'aucune fiche n'est ouverte ou en chargement.
 */
export function EnvFamilyCloseAllButton() {
  const busyCount = useContext(BusyCountContext);
  const closeAll = useContext(CloseAllContext);

  return (
    <Button
      type="button"
      variant="outline"
      disabled={busyCount === 0}
      onClick={closeAll}
      className="h-8 w-full border-orange-300 text-xs text-orange-800 hover:bg-orange-50 disabled:opacity-50 sm:w-28"
    >
      Tout fermer
    </Button>
  );
}
