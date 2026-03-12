"use client"

import { useSession } from 'next-auth/react';
import { launchExternalTool, checkToolAvailability, checkLauncherHealth } from '@/lib/mylaunch';
import { toast } from 'react-toastify';
import { ReactNode } from 'react';
import { showLauncherNotRunningToast } from '@/components/harp/launcherToast';

interface SQLPlusLinkProps {
  className?: string;
  children: ReactNode;
  aliasql?: string | null;
}

export function SQLPlusLink({ className, children, aliasql }: SQLPlusLinkProps) {
  const { data: session } = useSession();

  const handleClick = async (e: React.MouseEvent<HTMLSpanElement>) => {
    e.preventDefault();

    try {
      // Récupérer le netid
      const netid = session?.user?.netid;
      if (!netid) {
        toast.warning('Session utilisateur non disponible. Le lancement peut échouer.');
      }

      // Vérifier si l'outil est disponible (en production uniquement)
      const isDevMode = 
        process.env.NEXT_PUBLIC_DEV_MODE === 'true' || 
        process.env.NEXT_PUBLIC_DEV_MODE === '1' ||
        process.env.NODE_ENV === 'development';

      if (!isDevMode && netid) {
        const checkResult = await checkToolAvailability('sqlplus', netid);
        if (!checkResult.success) {
          toast.error(checkResult.error || 'SQL*Plus n\'est pas configuré ou non accessible');
          return;
        }
      }

      // Lancer SQL*Plus via le protocole mylaunch:// avec les paramètres
      const params: Record<string, string | undefined> = {};
      if (aliasql) params.aliasql = aliasql;
      
      const doLaunch = async () => {
        const launchResult = await launchExternalTool('sqlplus', params);

        if (launchResult.success) {
          toast.success('SQL*Plus est en cours de lancement...');
        } else {
          toast.error(
            launchResult.error || 'Impossible de lancer SQL*Plus. Vérifiez que le launcher est installé et démarré.',
            { autoClose: 10000 }
          );
        }
      };

      const health = await checkLauncherHealth(800);
      if (!health.running) {
        showLauncherNotRunningToast({ onContinue: () => void doLaunch() });
        return;
      }

      await doLaunch();
    } catch (error) {
      console.error('Erreur lors du lancement de SQL*Plus:', error);
      toast.error('Erreur lors du lancement de SQL*Plus');
    }
  };

  return (
    <span
      onClick={handleClick}
      className={className}
      role="button"
      tabIndex={0}
      onKeyDown={(e: React.KeyboardEvent<HTMLSpanElement>) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick(e as unknown as React.MouseEvent<HTMLSpanElement>);
        }
      }}
    >
      {children}
    </span>
  );
}
