"use client"

import { launchExternalTool } from '@/lib/mylaunch';
import { ReactNode } from 'react';

interface SQLDeveloperLinkProps {
  className?: string;
  children: ReactNode;
}

export function SQLDeveloperLink({ className, children }: SQLDeveloperLinkProps) {
  const handleClick = (e: React.MouseEvent<HTMLSpanElement>) => {
    e.preventDefault();
    
    // Lancer SQL Developer via le protocole mylaunch://
    launchExternalTool('sqldeveloper');
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

