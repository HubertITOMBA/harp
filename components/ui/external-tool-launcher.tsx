"use client";

import * as React from "react";
import { Button, ButtonProps } from "@/components/ui/button";
import { 
  buildPuttyUrl, 
  buildPeopleSoftUrl, 
  launchExternalTool,
  type PuttyParams,
  type PeopleSoftParams,
  type ExternalTool 
} from "@/lib/mylaunch";

interface ExternalToolLauncherProps {
  tool: ExternalTool;
  params?: PuttyParams | PeopleSoftParams | Record<string, string | number | undefined>;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
  className?: string;
  children?: React.ReactNode;
  onLaunch?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Composant bouton pour lancer des applications Windows externes
 * 
 * @example
 * <ExternalToolLauncher 
 *   tool="putty" 
 *   params={{ host: "10.0.0.1", user: "admin", port: 22 }}
 *   variant="default"
 * >
 *   Ouvrir PuTTY
 * </ExternalToolLauncher>
 */
export function ExternalToolLauncher({
  tool,
  params = {},
  variant = "default",
  size = "default",
  className,
  children,
  onLaunch,
  onError,
}: ExternalToolLauncherProps) {
  const handleClick = React.useCallback(async () => {
    try {
      const result = await launchExternalTool(tool, params);
      if (result.success) {
        onLaunch?.();
      } else {
        throw new Error(result.error || "Impossible de lancer l'application");
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error("Erreur lors du lancement:", err);
      onError?.(err);
    }
  }, [tool, params, onLaunch, onError]);

  const defaultLabel = React.useMemo(() => {
    switch (tool) {
      case "putty":
        return "Ouvrir PuTTY";
      case "pside":
        return "Ouvrir PeopleSoft IDE";
      case "ptsmt":
        return "Ouvrir PeopleSoft PTSMT";
      default:
        return "Lancer l'application";
    }
  }, [tool]);

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleClick}
      type="button"
    >
      {children || defaultLabel}
    </Button>
  );
}

/**
 * Composant spécialisé pour PuTTY
 */
export function PuttyLauncher({
  host,
  user,
  port,
  sshkey,
  ...buttonProps
}: PuttyParams & Omit<ButtonProps, "onClick">) {
  return (
    <ExternalToolLauncher
      tool="putty"
      params={{ host, user, port, sshkey }}
      {...buttonProps}
    >
      Ouvrir PuTTY
    </ExternalToolLauncher>
  );
}

/**
 * Composant spécialisé pour PeopleSoft IDE
 */
export function PeopleSoftIDELauncher({
  dbname,
  server,
  user,
  password,
  ...buttonProps
}: PeopleSoftParams & Omit<ButtonProps, "onClick">) {
  return (
    <ExternalToolLauncher
      tool="pside"
      params={{ dbname, server, user, password }}
      {...buttonProps}
    >
      Ouvrir PeopleSoft IDE
    </ExternalToolLauncher>
  );
}

/**
 * Composant spécialisé pour PeopleSoft PTSMT
 */
export function PeopleSoftPTSMTLauncher({
  dbname,
  server,
  user,
  password,
  ...buttonProps
}: PeopleSoftParams & Omit<ButtonProps, "onClick">) {
  return (
    <ExternalToolLauncher
      tool="ptsmt"
      params={{ dbname, server, user, password }}
      {...buttonProps}
    >
      Ouvrir PeopleSoft PTSMT
    </ExternalToolLauncher>
  );
}

