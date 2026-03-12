"use client";

import { useCallback, useState } from "react";
import { 
  launchExternalTool, 
  buildMyLaunchUrl,
  checkLauncherHealth,
  type ExternalTool 
} from "@/lib/mylaunch";

interface UseExternalToolReturn {
  launch: (tool: ExternalTool, params?: Record<string, string | number | undefined>) => Promise<boolean>;
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

  const launch = useCallback(async (
    tool: ExternalTool,
    params?: Record<string, string | number | undefined>
  ): Promise<boolean> => {
    setIsLaunching(true);
    setError(null);

    try {
      const health = await checkLauncherHealth(800);
      if (!health.running) {
        throw new Error("Launcher HARP non détecté (http://localhost:8765/health).");
      }

      const result = await launchExternalTool(tool, params);
      if (!result.success) throw new Error(result.error || "Impossible de lancer l'application externe");

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

