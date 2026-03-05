"use client"

import { buildMyLaunchUrl } from '@/lib/mylaunch';
import { toast } from 'react-toastify';
import { ReactNode } from 'react';

/** Alias Oracle SQL*Net pour la connexion (valeur du champ aliasql de la table envsharp).
 *  Utilise un vrai lien <a href="mylaunch://sqlplus?aliasql=..."> pour que le launcher reçoive l'URL complète. */
interface SQLPlusLinkProps {
  className?: string;
  children: ReactNode;
  aliasql?: string | null;
}

export function SQLPlusLink({ className, children, aliasql }: SQLPlusLinkProps) {
  const alias = typeof aliasql === 'string' ? aliasql.trim() : '';
  const href = alias ? buildMyLaunchUrl('sqlplus', { aliasql: alias }) : undefined;

  const handleNoAlias = (e: React.MouseEvent) => {
    e.preventDefault();
    toast.warning('Aucun alias SQL*Net pour cet environnement. Vérifiez le champ aliasql dans envsharp.');
  };

  if (href) {
    return (
      <a href={href} className={className}>
        {children}
      </a>
    );
  }

  return (
    <span
      onClick={handleNoAlias}
      className={className}
      role="button"
      tabIndex={0}
      onKeyDown={(e: React.KeyboardEvent<HTMLSpanElement>) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleNoAlias(e as unknown as React.MouseEvent);
        }
      }}
    >
      {children}
    </span>
  );
}

