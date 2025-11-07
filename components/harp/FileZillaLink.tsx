"use client"

import { launchExternalTool } from '@/lib/mylaunch';
import { ReactNode } from 'react';

interface FileZillaLinkProps {
  host?: string;
  pshome?: string;
  className?: string;
  children: ReactNode;
}

export function FileZillaLink({ host, pshome, className, children }: FileZillaLinkProps) {
  const handleClick = (e: React.MouseEvent<HTMLSpanElement>) => {
    e.preventDefault();
    
    // Lancer FileZilla via le protocole mylaunch://
    // FileZilla s'ouvrira et l'utilisateur pourra se connecter manuellement
    launchExternalTool('filezilla');
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

