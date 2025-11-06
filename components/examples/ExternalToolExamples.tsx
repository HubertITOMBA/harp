/**
 * Fichier d'exemples pour l'utilisation des composants de lancement d'applications externes
 * Ce fichier peut être supprimé ou utilisé comme référence
 */

"use client";

import { PuttyLauncher, PeopleSoftIDELauncher, ExternalToolLauncher } from "@/components/ui/external-tool-launcher";
import { useExternalTool } from "@/hooks/use-external-tool";
import { buildPuttyUrl } from "@/lib/mylaunch";
import { Button } from "@/components/ui/button";

/**
 * Exemple 1: Composants spécialisés
 */
export function Example1_SpecializedComponents() {
  return (
    <div className="space-y-4 p-4">
      <h2 className="text-xl font-bold">Exemple 1: Composants spécialisés</h2>
      
      {/* PuTTY avec tous les paramètres */}
      <PuttyLauncher 
        host="10.0.0.1" 
        user="admin" 
        port={22}
        variant="default"
      />
      
      {/* PeopleSoft IDE */}
      <PeopleSoftIDELauncher 
        dbname="HR92" 
        server="PSDEV"
        user="PS"
        variant="outline"
      />
    </div>
  );
}

/**
 * Exemple 2: Composant générique avec enfants personnalisés
 */
export function Example2_GenericComponent() {
  return (
    <div className="space-y-4 p-4">
      <h2 className="text-xl font-bold">Exemple 2: Composant générique</h2>
      
      <ExternalToolLauncher 
        tool="putty" 
        params={{ host: "10.0.0.1", user: "admin", port: 22 }}
        variant="default"
      >
        Se connecter au serveur via SSH
      </ExternalToolLauncher>
      
      <ExternalToolLauncher 
        tool="pside" 
        params={{ dbname: "HR92", server: "PSDEV" }}
        variant="secondary"
      >
        Ouvrir l'environnement HR92
      </ExternalToolLauncher>
    </div>
  );
}

/**
 * Exemple 3: Utilisation du hook
 */
export function Example3_UsingHook() {
  const { launch, isLaunching, error } = useExternalTool();
  
  const handleOpenPutty = () => {
    launch('putty', { host: '10.0.0.1', user: 'admin', port: 22 });
  };
  
  const handleOpenPeopleSoft = () => {
    launch('pside', { dbname: 'HR92', server: 'PSDEV' });
  };
  
  return (
    <div className="space-y-4 p-4">
      <h2 className="text-xl font-bold">Exemple 3: Utilisation du hook</h2>
      
      <Button 
        onClick={handleOpenPutty} 
        disabled={isLaunching}
        variant="default"
      >
        {isLaunching ? 'Lancement...' : 'Ouvrir PuTTY (hook)'}
      </Button>
      
      <Button 
        onClick={handleOpenPeopleSoft} 
        disabled={isLaunching}
        variant="outline"
      >
        Ouvrir PeopleSoft (hook)
      </Button>
      
      {error && (
        <div className="text-red-500 text-sm">
          Erreur: {error.message}
        </div>
      )}
    </div>
  );
}

/**
 * Exemple 4: Lien direct avec URL construite
 */
export function Example4_DirectLink() {
  const puttyUrl = buildPuttyUrl({ host: '10.0.0.1', user: 'admin', port: 22 });
  
  return (
    <div className="space-y-4 p-4">
      <h2 className="text-xl font-bold">Exemple 4: Lien direct</h2>
      
      <a 
        href={puttyUrl}
        className="inline-block px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Ouvrir PuTTY (lien direct)
      </a>
      
      <p className="text-sm text-gray-600">
        URL générée: <code className="bg-gray-100 px-2 py-1 rounded">{puttyUrl}</code>
      </p>
    </div>
  );
}

/**
 * Exemple 5: Intégration dans un tableau de serveurs (exemple)
 */
interface Server {
  name: string;
  ip: string;
  user?: string;
  port?: number;
}

export function Example5_ServerTable({ servers }: { servers: Server[] }) {
  return (
    <div className="space-y-4 p-4">
      <h2 className="text-xl font-bold">Exemple 5: Intégration dans un tableau</h2>
      
      <table className="w-full border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-300 px-4 py-2">Serveur</th>
            <th className="border border-gray-300 px-4 py-2">IP</th>
            <th className="border border-gray-300 px-4 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {servers.map((server) => (
            <tr key={server.name} className="border border-gray-300">
              <td className="border border-gray-300 px-4 py-2">{server.name}</td>
              <td className="border border-gray-300 px-4 py-2">{server.ip}</td>
              <td className="border border-gray-300 px-4 py-2">
                <PuttyLauncher
                  host={server.ip}
                  user={server.user}
                  port={server.port}
                  size="sm"
                  variant="outline"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

