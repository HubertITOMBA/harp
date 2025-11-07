"use client"

import { useSession } from 'next-auth/react';
import { launchExternalTool } from '@/lib/mylaunch';
import { ReactNode } from 'react';

interface PuttyLinkProps {
  host: string;
  ip?: string;
  className?: string;
  children: ReactNode;
}

export function PuttyLink({ host, ip, className, children }: PuttyLinkProps) {
  const { data: session } = useSession();

  const handleClick = (e: React.MouseEvent<HTMLSpanElement>) => {
    e.preventDefault();
    
    if (!host || host.trim() === '') {
      console.error('Aucun host spécifié pour PuTTY');
      return;
    }

    // Utiliser l'IP si disponible, sinon le host (nom du serveur)
    const hostToUse = ip && ip.trim() !== '' ? ip : host;

    // Détection automatique de l'environnement
    const isDevMode = 
      process.env.NEXT_PUBLIC_DEV_MODE === 'true' || 
      process.env.NEXT_PUBLIC_DEV_MODE === '1' ||
      process.env.NODE_ENV === 'development';

    // En mode dev : utiliser "hubert" sans clé SSH
    // En production : utiliser netid et pkeyfile de la session
    const userToUse = isDevMode 
      ? "hubert"
      : (session?.user?.netid || undefined);
  
    const sshkeyToUse = isDevMode
      ? undefined
      : (session?.user?.pkeyfile || undefined);

    // Lancer PuTTY via le protocole mylaunch://
    launchExternalTool('putty', {
      host: hostToUse,
      user: userToUse,
      sshkey: sshkeyToUse,
    });
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

