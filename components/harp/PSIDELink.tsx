"use client"

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { launchExternalTool, checkToolAvailability, checkLauncherHealth } from '@/lib/mylaunch';
import { normalizePeopleToolsVersion } from '@/lib/ptools-path';
import { toast } from 'react-toastify';
import { ReactNode } from 'react';
import { showLauncherNotRunningToast } from '@/components/harp/launcherToast';

interface PSIDELinkProps {
  className?: string;
  children: ReactNode;
  ptversion?: string | null;
  aliasql?: string | null;
}

/**
 * Lance PeopleSoft Application Designer (pside.exe) pour la Version PTools de l'environnement.
 *
 * @param ptversion - Version PeopleTools de l'env (ex. "8.61" → pt861)
 * @param aliasql - Alias SQL pour -CD
 */
export function PSIDELink({ className, children, ptversion, aliasql }: PSIDELinkProps) {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async (e: React.MouseEvent<HTMLSpanElement>) => {
    e.preventDefault();
    
    setIsLoading(true);

    try {
      const ptCheck = normalizePeopleToolsVersion(ptversion);
      if (!ptCheck.ok) {
        toast.error(ptCheck.error, { autoClose: 10000 });
        return;
      }

      const netid = session?.user?.netid;
      if (!netid) {
        toast.warning('Session utilisateur non disponible. Le lancement peut échouer.');
      }

      const isDevMode = 
        process.env.NEXT_PUBLIC_DEV_MODE === 'true' || 
        process.env.NEXT_PUBLIC_DEV_MODE === '1' ||
        process.env.NODE_ENV === 'development';

      if (!isDevMode && netid) {
        const checkResult = await checkToolAvailability('pside', netid, {
          ptversion: ptCheck.display,
          aliasql: aliasql || undefined,
        });
        if (!checkResult.success) {
          toast.error(checkResult.error || 'PSIDE n\'est pas configuré ou non accessible');
          return;
        }
      }

      const params: Record<string, string | undefined> = {
        ptversion: ptCheck.display,
        netid: netid || undefined,
      };
      if (aliasql) params.aliasql = aliasql;
      
      const doLaunch = async () => {
        const launchResult = await launchExternalTool('pside', params);

        if (launchResult.success) {
          toast.success(`Application Designer (PTools ${ptCheck.display} / pt${ptCheck.folderSuffix}) en cours de lancement...`);
        } else {
          toast.error(
            launchResult.error || 'Impossible de lancer PSIDE. Vérifiez que le launcher est installé et démarré.',
            { autoClose: 10000 }
          );
        }
      };

      const health = await checkLauncherHealth(800, netid);
      if (!health.running) {
        showLauncherNotRunningToast({ onContinue: () => void doLaunch() });
        return;
      }

      await doLaunch();
    } catch (error) {
      console.error('Erreur lors du lancement de PSIDE:', error);
      toast.error('Erreur lors du lancement de PSIDE');
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
      style={{ cursor: isLoading ? 'wait' : 'pointer' }}
    >
      {children}
    </span>
  );
}
