"use client";

import { useSession } from 'next-auth/react';
import { PuttyLauncher, PeopleSoftIDELauncher } from '@/components/ui/external-tool-launcher';
import { launchExternalTool } from '@/lib/mylaunch';
import { toast } from 'react-toastify';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

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
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);

  if (!ip && !srv) {
    return null;
  }

  const handlePuttyClick = async () => {
    if (!ip || ip.trim() === '') {
      toast.error('Aucune adresse IP spécifiée pour PuTTY');
      return;
    }

    setIsLoading(true);

    try {
      // Récupérer le netid et pkeyfile de la session
      const netid = session?.user?.netid;
      const pkeyfile = session?.user?.pkeyfile;

      // Vérifier si on est en mode dev
      const isDevMode = 
        process.env.NEXT_PUBLIC_DEV_MODE === 'true' || 
        process.env.NEXT_PUBLIC_DEV_MODE === '1' ||
        process.env.NODE_ENV === 'development';

      // En mode dev : utiliser "hubert" sans clé SSH
      // En production : utiliser netid et pkeyfile de la session
      const userToUse = isDevMode 
        ? "hubert"
        : (netid || psuser || undefined);
    
      const sshkeyToUse = isDevMode
        ? undefined
        : (pkeyfile || undefined);

      // Lancer PuTTY via le protocole mylaunch://
      const launchResult = await launchExternalTool('putty', {
        host: ip,
        user: userToUse,
        sshkey: sshkeyToUse,
      });

      if (launchResult.success) {
        toast.success('PuTTY est en cours de lancement...');
      } else {
        toast.error(launchResult.error || 'Impossible de lancer PuTTY');
      }
    } catch (error) {
      console.error('Erreur lors du lancement de PuTTY:', error);
      toast.error('Erreur lors du lancement de PuTTY');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`flex gap-2 flex-wrap ${className}`}>
      {ip && (
        <Button
          onClick={handlePuttyClick}
          disabled={isLoading}
          size="default"
          variant="default"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Lancement...
            </>
          ) : (
            'Ouvrir PuTTY'
          )}
        </Button>
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

