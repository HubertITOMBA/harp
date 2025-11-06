"use client";

import { useCallback, useState } from "react";
import { 
  launchExternalTool, 
  buildMyLaunchUrl,
  type ExternalTool 
} from "@/lib/mylaunch";

interface UseExternalToolReturn {
  launch: (tool: ExternalTool, params?: Record<string, string | number | undefined>) => boolean;
  isLaunching: boolean;
  error: Error | null;
  buildUrl: (tool: ExternalTool, params?: Record<string, string | number | undefined>) => string;
}

/**
 * Hook personnalisé pour lancer des applications externes via mylaunch://
 * 
 * @example
 * const { launch, isLaunching, error } = useExternalTool();
 * 
 * const handleOpenPutty = () => {
 *   launch('putty', { host: '10.0.0.1', user: 'admin', port: 22 });
 * };
 */
export function useExternalTool(): UseExternalToolReturn {
  const [isLaunching, setIsLaunching] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const launch = useCallback((
    tool: ExternalTool,
    params?: Record<string, string | number | undefined>
  ): boolean => {
    setIsLaunching(true);
    setError(null);

    try {
      const success = launchExternalTool(tool, params);
      
      if (!success) {
        throw new Error("Impossible de lancer l'application externe");
      }

      // Réinitialiser l'état après un court délai
      setTimeout(() => {
        setIsLaunching(false);
      }, 500);

      return true;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      setIsLaunching(false);
      console.error("Erreur lors du lancement:", error);
      return false;
    }
  }, []);

  const buildUrl = useCallback((
    tool: ExternalTool,
    params?: Record<string, string | number | undefined>
  ): string => {
    return buildMyLaunchUrl(tool, params);
  }, []);

  return {
    launch,
    isLaunching,
    error,
    buildUrl,
  };
}

