"use client"

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { launchExternalTool, checkToolAvailability } from '@/lib/mylaunch';
import { toast } from 'react-toastify';
import { ReactNode } from 'react';

interface PSDMTLinkProps {
  className?: string;
  children: ReactNode;
}

export function PSDMTLink({ className, children }: PSDMTLinkProps) {
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
        const checkResult = await checkToolAvailability('psdmt', netid);
        if (!checkResult.success) {
          toast.error(checkResult.error || 'PSDMT n\'est pas configuré ou non accessible');
          setIsLoading(false);
          return;
        }
      }

      // Lancer PSDMT via le protocole mylaunch://
      const success = launchExternalTool('psdmt');

      if (success) {
        toast.info('Lancement de PSDMT en cours...');
      } else {
        toast.error('Impossible de lancer PSDMT. Vérifiez que le protocole mylaunch:// est installé.');
      }
    } catch (error) {
      console.error('Erreur lors du lancement de PSDMT:', error);
      toast.error('Erreur lors du lancement de PSDMT');
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

