"use client"

import { useSession } from 'next-auth/react';
import { launchExternalTool, checkToolAvailability } from '@/lib/mylaunch';
import { toast } from 'react-toastify';
import { ReactNode } from 'react';

interface SQLPlusLinkProps {
  className?: string;
  children: ReactNode;
}

export function SQLPlusLink({ className, children }: SQLPlusLinkProps) {
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

      // Lancer SQL*Plus via le protocole mylaunch://
      const launchResult = await launchExternalTool('sqlplus');

      if (launchResult.success) {
        toast.success('SQL*Plus est en cours de lancement...');
      } else {
        toast.error(
          launchResult.error || 'Impossible de lancer SQL*Plus. Le protocole mylaunch:// n\'est pas installé.',
          { autoClose: 10000 }
        );
      }
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

