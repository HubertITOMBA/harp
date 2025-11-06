## Intégration protocole mylaunch:// (Option A)

Contenu:
- `protocol/install-mylaunch.reg` : crée le protocole `mylaunch://` sur Windows.
- `launcher/launcher.ps1` : lanceur PowerShell avec liste blanche d'outils (PuTTY, pside, ptsmt).

### Installation (poste utilisateur)
1. Copier `launcher.ps1` vers `C:\\apps\\portail\\launcher\\launcher.ps1`.
2. (Optionnel) Placer une icône `launcher.ico` dans `C:\\apps\\portail\\`.
3. Double-cliquer `protocol/install-mylaunch.reg` (ou déployer via GPO) pour enregistrer le protocole.

Le protocole appellera PowerShell avec `-ExecutionPolicy Bypass` afin d'exécuter le lanceur. Restreignez l'accès au dossier et signez le script si possible.

### Sécurité
- Whitelist stricte dans `launcher.ps1` (table `$allowed`).
- Journalisation dans `windows/launcher/logs/launcher.log`.
- Limitez les arguments acceptés (host, user, port, sshkey pour PuTTY).

### Navigateur (Edge/Chrome) — autoriser l'origine Intranet
Configurer les stratégies (GPO/Intune):
- `ExternalProtocolDialogShowAlwaysOpenCheckbox` : activer la case "Toujours autoriser".
- `AutoLaunchProtocolsFromOrigins` : ajouter `{ protocol: "mylaunch", origin: "https://intranet.votre-domaine.tld" }`.

Références politiques:
- Microsoft Edge: `Computer Configuration/Administrative Templates/Microsoft Edge`
- Chrome: `Computer Configuration/Administrative Templates/Google/Google Chrome`

### Exemple d'usage dans l'app (Next.js)

#### Option 1: Utiliser le composant ExternalToolLauncher

```tsx
import { ExternalToolLauncher, PuttyLauncher, PeopleSoftIDELauncher } from '@/components/ui/external-tool-launcher';

// Lancer PuTTY avec un composant spécialisé
<PuttyLauncher 
  host="10.0.0.1" 
  user="admin" 
  port={22}
  variant="default"
/>

// Lancer PeopleSoft IDE
<PeopleSoftIDELauncher 
  dbname="HR92" 
  server="PSDEV"
  variant="outline"
/>

// Lancer avec le composant générique
<ExternalToolLauncher 
  tool="putty" 
  params={{ host: "10.0.0.1", user: "admin", port: 22 }}
>
  Se connecter au serveur
</ExternalToolLauncher>
```

#### Option 2: Utiliser le hook useExternalTool

```tsx
import { useExternalTool } from '@/hooks/use-external-tool';

function MyComponent() {
  const { launch, isLaunching, error } = useExternalTool();
  
  const handleOpenPutty = () => {
    launch('putty', { host: '10.0.0.1', user: 'admin', port: 22 });
  };
  
  return (
    <button onClick={handleOpenPutty} disabled={isLaunching}>
      {isLaunching ? 'Lancement...' : 'Ouvrir PuTTY'}
      {error && <span>Erreur: {error.message}</span>}
    </button>
  );
}
```

#### Option 3: Utiliser directement les utilitaires

```tsx
import { buildPuttyUrl, launchExternalTool } from '@/lib/mylaunch';

// Construire une URL
const url = buildPuttyUrl({ host: '10.0.0.1', user: 'admin', port: 22 });
// url = "mylaunch://putty?host=10.0.0.1&user=admin&port=22"

// Lancer directement
<a href={buildPuttyUrl({ host: '10.0.0.1', user: 'admin' })}>
  Ouvrir PuTTY
</a>

// Ou programmatiquement
const handleClick = () => {
  launchExternalTool('putty', { host: '10.0.0.1', user: 'admin', port: 22 });
};
```


