"use client";

import * as React from "react";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";

export type LauncherToastOptions = {
  onContinue?: () => void;
  healthUrl?: string;
  autoCloseMs?: number;
};

export function showLauncherNotRunningToast(options?: LauncherToastOptions) {
  const healthUrl = options?.healthUrl ?? "http://localhost:8765/health";
  const autoClose = options?.autoCloseMs ?? 15000;

  toast.error(
    <div className="space-y-2 text-white">
      <div className="font-semibold text-white">Launcher HARP non détecté</div>
      <div className="text-sm text-white/90">
        Le serveur local ne répond pas sur{" "}
        <span className="font-mono text-white">{healthUrl}</span>.
        <br />
        Démarrez le launcher (ou installez-le) puis relancez l’action.
      </div>
      <div className="text-xs text-white/85">
        Installation recommandée :{" "}
        <span className="font-mono text-white">install-launcher-server.ps1 -AddToStartup</span>
        <br />
        Démarrage manuel :{" "}
        <span className="font-mono text-white">D:\apps\portal\launcher\start-launcher-server.bat</span>
      </div>
      <div className="flex gap-2 pt-1">
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={() => window.open(healthUrl, "_blank", "noopener,noreferrer")}
        >
          Tester /health
        </Button>
        {options?.onContinue && (
          <Button type="button" size="sm" variant="outline" onClick={options.onContinue}>
            Continuer quand même
          </Button>
        )}
      </div>
    </div>,
    { autoClose }
  );
}

