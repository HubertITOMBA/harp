"use client"
 
import { useState } from 'react';
import { launchExternalTool } from '@/lib/mylaunch';
import { Button } from '@/components/ui/button';
import { PuttyLauncher } from '@/components/ui/external-tool-launcher';

interface LancerApplisProps {
  host?: string;
  user?: string;
  port?: string | number;
  sshkey?: string;
}

const LancerApplis = ({ host, user, port, sshkey }: LancerApplisProps) => {
  const [error, setError] = useState<string | null>(null);

  const execAppli = () => {
    setError(null);

    try {
      // Vérifier qu'on a au moins un host
      if (!host) {
        setError('Aucun serveur spécifié. Veuillez sélectionner un serveur dans l\'onglet "Serveurs".');
        return;
      }

      // Lancer PuTTY via le protocole mylaunch://
      const success = launchExternalTool('putty', {
        host,
        user,
        port,
        sshkey,
      });

      if (!success) {
        throw new Error('Impossible de lancer PuTTY. Vérifiez que le protocole mylaunch:// est installé.');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du lancement de PuTTY';
      setError(errorMessage);
      console.error('Erreur lors du lancement de PuTTY:', err);
    }
  };

  // Si on a les paramètres nécessaires, utiliser PuttyLauncher directement
  if (host) {
    return (
      <PuttyLauncher
        host={host}
        user={user}
        port={port}
        sshkey={sshkey}
        variant="outline"
        size="sm"
      />
    );
  }

  // Sinon, afficher un bouton avec message d'information
  return (
    <div className="flex flex-col gap-2">
      <Button 
        onClick={execAppli}
        variant="outline"
        size="sm"
        className="w-full sm:w-auto"
        disabled
      >
        Lancer PuTTY
      </Button>

      {error && (
        <p className="text-xs text-red-600" role="alert">
          {error}
        </p>
      )}
      
      {!error && (
        <p className="text-xs text-gray-500">
          Sélectionnez un serveur dans l&apos;onglet &quot;Serveurs&quot; pour lancer PuTTY
        </p>
      )}
    </div>
  );
};

export default LancerApplis;