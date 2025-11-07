"use client"

import { launchExternalTool } from '@/lib/mylaunch';
import { ReactNode } from 'react';

interface PSDMTLinkProps {
  className?: string;
  children: ReactNode;
}

export function PSDMTLink({ className, children }: PSDMTLinkProps) {
  const handleClick = (e: React.MouseEvent<HTMLSpanElement>) => {
    e.preventDefault();
    
    // Lancer PSDMT via le protocole mylaunch://
    launchExternalTool('psdmt');
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

