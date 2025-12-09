"use client"

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { launchExternalTool, checkToolAvailability } from '@/lib/mylaunch';
import { toast } from 'react-toastify';
import { ReactNode } from 'react';

interface SQLDeveloperLinkProps {
  className?: string;
  children: ReactNode;
}

export function SQLDeveloperLink({ className, children }: SQLDeveloperLinkProps) {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async (e: React.MouseEvent<HTMLSpanElement>) => {
    e.preventDefault();
    
    setIsLoading(true);

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
        const checkResult = await checkToolAvailability('sqldeveloper', netid);
        if (!checkResult.success) {
          toast.error(checkResult.error || 'SQL Developer n\'est pas configuré ou non accessible');
          setIsLoading(false);
          return;
        }
      }

      // Lancer SQL Developer via le protocole mylaunch://
      const launchResult = await launchExternalTool('sqldeveloper');

      if (launchResult.success) {
        toast.info('Lancement de SQL Developer en cours...');
        // Afficher un message d'aide après un court délai au cas où le protocole ne serait pas installé
        setTimeout(() => {
          toast.warning(
            'Si SQL Developer ne s\'ouvre pas, le protocole mylaunch:// n\'est peut-être pas installé. Contactez votre administrateur.',
            { autoClose: 8000 }
          );
        }, 2000);
      } else {
        toast.error(
          launchResult.error || 'Impossible de lancer SQL Developer. Le protocole mylaunch:// n\'est pas installé.',
          { autoClose: 10000 }
        );
      }
    } catch (error) {
      console.error('Erreur lors du lancement de SQL Developer:', error);
      toast.error('Erreur lors du lancement de SQL Developer');
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

