"use client";

import { PuttyLauncher, PeopleSoftIDELauncher } from '@/components/ui/external-tool-launcher';

interface ServerConnectionButtonsProps {
  ip?: string | null;
  srv?: string | null;
  psuser?: string | null;
  className?: string;
}

/**
 * Composant affichant les boutons de connexion pour un serveur
 * Utilisé dans les pages de détails de serveur
 */
export function ServerConnectionButtons({
  ip,
  srv,
  psuser,
  className = "",
}: ServerConnectionButtonsProps) {
  if (!ip && !srv) {
    return null;
  }

  return (
    <div className={`flex gap-2 flex-wrap ${className}`}>
      {ip && (
        <PuttyLauncher
          host={ip}
          user={psuser || undefined}
          size="default"
          variant="default"
        />
      )}
      {srv && (
        <PeopleSoftIDELauncher
          server={srv}
          size="default"
          variant="outline"
        />
      )}
    </div>
  );
}

