"use client"
 
import { useState } from 'react';
import * as React from 'react';
import { useSession } from 'next-auth/react';
import { launchExternalTool } from '@/lib/mylaunch';
import { Button } from '@/components/ui/button';
import { PuttyLauncher } from '@/components/ui/external-tool-launcher';

interface LancerApplisProps {
  host?: string;
  user?: string;
  port?: string | number;
  sshkey?: string;
  devMode?: boolean; // Mode dev : forcer l'utilisation des props même si undefined
  devUser?: string; // User par défaut en mode dev
}

const LancerApplis = ({ host, user, port, sshkey, devMode, devUser }: LancerApplisProps) => {
  const { data: session } = useSession();
  const [error, setError] = useState<string | null>(null);

  // Détection automatique de l'environnement
  // Priorité : 1) devMode prop, 2) NEXT_PUBLIC_DEV_MODE, 3) NODE_ENV
  const isDevMode = React.useMemo(() => {
    // 1. Si devMode est explicitement passé en props, l'utiliser (priorité la plus haute)
    if (devMode !== undefined) {
      return devMode;
    }
    
    // 2. Vérifier NEXT_PUBLIC_DEV_MODE (variable d'environnement publique pour le client)
    const publicDevMode = process.env.NEXT_PUBLIC_DEV_MODE;
    if (publicDevMode !== undefined) {
      return publicDevMode === 'true' || publicDevMode === '1';
    }
    
    // 3. Détecter via NODE_ENV (fonctionne côté serveur et client en Next.js)
    // En production, NODE_ENV sera 'production', en dev ce sera 'development'
    const nodeEnv = process.env.NODE_ENV;
    if (nodeEnv === 'development') {
      return true;
    }
    if (nodeEnv === 'production') {
      return false;
    }
    
    // 4. Par défaut : production (sécurité)
    return false;
  }, [devMode]);

  // En mode dev : FORCER l'utilisation des valeurs dev (ignorer les props user/sshkey de prod)
  // En production : utiliser les données de la session si non fournies en props
  const userToUse = isDevMode 
    ? (devUser || "hubert") // Mode dev : TOUJOURS utiliser devUser ou "hubert" (ignorer user prop)
    : (user || session?.user?.netid || undefined); // Production : utiliser session si pas de props
  
  const sshkeyToUse = isDevMode
    ? undefined // Mode dev : TOUJOURS pas de clé SSH (ignorer sshkey prop et session)
    : (sshkey || session?.user?.pkeyfile || undefined); // Production : utiliser session si pas de props
  
  // En mode dev, forcer aussi le host si nécessaire
  const hostToUse = isDevMode && (!host || host.trim() === '')
    ? "192.168.1.49" // Mode dev : host par défaut si non fourni
    : host; // Sinon utiliser le host fourni

  // Debug en mode dev
  React.useEffect(() => {
    if (isDevMode) {
      console.log('[LanceAppli DEV MODE]', {
        isDevMode,
        devModeProp: devMode,
        userProp: user,
        devUser,
        userToUse,
        hostProp: host,
        hostToUse,
        sshkeyToUse,
        sessionNetid: session?.user?.netid,
        sessionPkeyfile: session?.user?.pkeyfile,
        nodeEnv: process.env.NODE_ENV,
        publicDevMode: process.env.NEXT_PUBLIC_DEV_MODE
      });
    } else {
      console.log('[LanceAppli PROD MODE]', {
        isDevMode,
        userProp: user,
        userToUse,
        hostProp: host,
        hostToUse,
        sshkeyToUse,
        sessionNetid: session?.user?.netid,
        sessionPkeyfile: session?.user?.pkeyfile
      });
    }
  }, [isDevMode, devMode, user, devUser, userToUse, host, hostToUse, sshkeyToUse, session]);

  const execAppli = () => {
    setError(null);

    try {
      // Vérifier qu'on a au moins un host
      if (!hostToUse) {
        setError('Aucun serveur spécifié. Veuillez sélectionner un serveur dans l\'onglet "Serveurs".');
        return;
      }

      // Lancer PuTTY via le protocole mylaunch://
      // En mode dev : utiliser les valeurs forcées (hubert, pas de sshkey)
      // En production : utiliser netid et pkeyfile de la session
      const success = launchExternalTool('putty', {
        host: hostToUse,
        user: userToUse,
        port,
        sshkey: sshkeyToUse,
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
  if (hostToUse) {
    return (
      <PuttyLauncher
        host={hostToUse}
        user={userToUse}
        port={port}
        sshkey={sshkeyToUse}
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