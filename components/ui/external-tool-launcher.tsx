"use client";

import * as React from "react";
import { useSession } from "next-auth/react";
import { Button, ButtonProps } from "@/components/ui/button";
import { toast } from "react-toastify";
import { launchFreeSshPutty, checkLauncherHealth } from "@/lib/mylaunch";
import { showLauncherNotRunningToast } from "@/components/harp/launcherToast";

type PuttyLauncherProps = Omit<ButtonProps, "onClick"> & {
  host?: string;
  /** Seul mode conservé. Le compte et la clé viennent du serveur. */
  launchMode: "free-ssh";
};

/**
 * Bouton PuTTY du hub. L'hôte est saisi. Le compte et la clé ne partent pas du navigateur.
 */
function FreeSshPuttyButton({
  host,
  ...buttonProps
}: { host?: string } & Omit<ButtonProps, "onClick">) {
  const { data: session } = useSession();

  const handleClick = async () => {
    try {
      const localNetid = session?.user?.netid;
      const doLaunch = async () => {
        const result = await launchFreeSshPutty(host ?? "", localNetid);
        if (!result.success) {
          throw new Error(result.error || "Impossible de lancer l'application");
        }
      };

      const health = await checkLauncherHealth(800, localNetid);
      if (!health.running) {
        showLauncherNotRunningToast({ onContinue: () => void doLaunch() });
        return;
      }

      await doLaunch();
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      toast.error(err.message || "Erreur lors du lancement", { autoClose: 10000 });
    }
  };

  return (
    <Button {...buttonProps} onClick={() => void handleClick()} type="button">
      Ouvrir PuTTY
    </Button>
  );
}

/**
 * Lance PuTTY en SSH libre. Ce composant n'a plus de mode legacy.
 *
 * @param host - Hôte saisi, validé puis signé côté serveur
 * @param launchMode - Doit être free-ssh
 */
export function PuttyLauncher({
  host,
  launchMode,
  ...buttonProps
}: PuttyLauncherProps) {
  if (launchMode !== "free-ssh") {
    return null;
  }
  return <FreeSshPuttyButton host={host} {...buttonProps} />;
}
