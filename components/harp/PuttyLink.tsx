"use client"

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { launchExternalTool, checkToolAvailability, checkLauncherHealth } from '@/lib/mylaunch';
import { toast } from 'react-toastify';
import { ReactNode } from 'react';
import { showLauncherNotRunningToast } from '@/components/harp/launcherToast';

interface PuttyLinkProps {
  host: string;
  ip?: string;
  className?: string;
  children: ReactNode;
}

export function PuttyLink({ host, ip, className, children }: PuttyLinkProps) {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async (e: React.MouseEvent<HTMLSpanElement>) => {
    e.preventDefault();
    
    if (!host || host.trim() === '') {
      toast.error('Aucun serveur spécifié pour PuTTY');
      return;
    }

    setIsLoading(true);

    try {
      // Récupérer le netid
      const netid = session?.user?.netid;
      if (!netid) {
        toast.warning('Session utilisateur non disponible. Le lancement peut échouer.');
      }

      // Vérifier si le launcher est démarré (serveur local)
      const health = await checkLauncherHealth(800);
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

      // Utiliser l'IP si disponible, sinon le host (nom du serveur)
      const hostToUse = ip && ip.trim() !== '' ? ip : host;

      // En mode dev : utiliser "hubert" sans clé SSH
      // En production : utiliser netid et pkeyfile de la session
      const userToUse = isDevMode 
        ? "hubert"
        : (session?.user?.netid || undefined);
    
      const sshkeyToUse = isDevMode
        ? undefined
        : (session?.user?.pkeyfile || undefined);

      const doLaunch = async () => {
        const launchResult = await launchExternalTool('putty', {
          host: hostToUse,
          user: userToUse,
          sshkey: sshkeyToUse,
        });

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

