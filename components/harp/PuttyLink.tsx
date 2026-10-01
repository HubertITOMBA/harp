"use client"

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { launchTargetBoundTool, checkToolAvailability, checkLauncherHealth } from '@/lib/mylaunch';
import { toast } from 'react-toastify';
import { ReactNode } from 'react';
import { showLauncherNotRunningToast } from '@/components/harp/launcherToast';

interface PuttyLinkProps {
  host: string;
  ip?: string;
  envId?: number;
  serverId?: number;
  className?: string;
  children: ReactNode;
}

export function PuttyLink({ envId, serverId, className, children }: PuttyLinkProps) {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async (e: React.MouseEvent<HTMLSpanElement>) => {
    e.preventDefault();
    
    if (envId == null || serverId == null || !Number.isInteger(envId) || envId <= 0 || !Number.isInteger(serverId) || serverId <= 0) {
      toast.error("Lancement indisponible : environnement ou serveur non identifié.");
      return;
    }

    setIsLoading(true);

    try {
      const netid = session?.user?.netid;
      if (!netid) {
        toast.warning('Session utilisateur non disponible. Le lancement peut échouer.');
      }

      // Vérifier si le launcher est démarré (serveur local - port par utilisateur)
      const health = await checkLauncherHealth(800, netid);
      const launcherRunning = health.running;

      // Vérifier si l'outil est disponible (en production uniquement)
      const isDevMode = 
        process.env.NEXT_PUBLIC_DEV_MODE === 'true' || 
        process.env.NEXT_PUBLIC_DEV_MODE === '1' ||
        process.env.NODE_ENV === 'development';

      if (!isDevMode && netid) {
        const checkResult = await checkToolAvailability('putty', netid);
        if (!checkResult.success) {
          toast.error(checkResult.error || 'PuTTY n\'est pas configuré ou non accessible');
          setIsLoading(false);
          return;
        }
      }

      // En mode dev : utiliser "hubert" sans clé SSH
      // En production : utiliser netid et pkeyfile de la session
      const userToUse = isDevMode 
        ? "hubert"
        : (session?.user?.netid || undefined);
    
      const sshkeyToUse = isDevMode
        ? undefined
        : (session?.user?.pkeyfile || undefined);

      const doLaunch = async () => {
        const launchResult = await launchTargetBoundTool(
          {
            targetType: "server",
            envId,
            serverId,
            tool: "putty",
          },
          { user: userToUse, sshkey: sshkeyToUse, netid: netid || userToUse }
        );

        if (launchResult.success) {
          toast.success('PuTTY est en cours de lancement...');
        } else {
          toast.error(
            launchResult.error || 'Impossible de lancer PuTTY. Vérifiez que le launcher est installé et démarré.',
            { autoClose: 10000 }
          );
        }
      };

      // Si le launcher ne répond pas, afficher un message clair et actionnable
      if (!launcherRunning) {
        showLauncherNotRunningToast({ onContinue: () => void doLaunch() });
        return;
      }

      await doLaunch();
    } catch (error) {
      console.error('Erreur lors du lancement de PuTTY:', error);
      toast.error('Erreur lors du lancement de PuTTY');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <span
      onClick={handleClick}
      className={className}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick(e as any);
        }
      }}
    >
      {children}
    </span>
  );
}

