"use client"

import { launchExternalTool } from '@/lib/mylaunch';
import { ReactNode } from 'react';

interface SQLPlusLinkProps {
  className?: string;
  children: ReactNode;
}

export function SQLPlusLink({ className, children }: SQLPlusLinkProps) {
  const handleClick = (e: React.MouseEvent<HTMLSpanElement>) => {
    e.preventDefault();
    
    // Lancer SQL*Plus via le protocole mylaunch://
    launchExternalTool('sqlplus');
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

