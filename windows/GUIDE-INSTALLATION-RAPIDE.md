# Guide d'installation rapide - Exécution d'applications Windows côté client

## Vue d'ensemble

Ce système permet de lancer des applications Windows locales (PuTTY, PeopleSoft, etc.) depuis votre application web Next.js via un protocole personnalisé `mylaunch://`.

## Installation automatique (Recommandé)

### Étape 1: Ouvrir PowerShell en tant qu'administrateur

1. Appuyez sur `Windows + X`
2. Sélectionnez "Windows PowerShell (Admin)" ou "Terminal (Admin)"
3. Confirmez l'élévation des privilèges

### Étape 2: Exécuter le script d'installation

```powershell
cd C:\TOOLS\devportal\harp\windows
.\install.ps1
```

Le script va :
- ✅ Créer le répertoire `C:\apps\portail\launcher`
- ✅ Copier le script `launcher.ps1`
- ✅ Configurer les permissions
- ✅ Installer le protocole `mylaunch://` dans le registre Windows

### Étape 3: Vérifier l'installation

Dans PowerShell (en tant qu'administrateur) :
```powershell
Get-ItemProperty -Path "HKCR:\mylaunch"
```

Vous devriez voir les clés du protocole.

## Installation manuelle

Si le script automatique ne fonctionne pas :

### 1. Copier les fichiers

```powershell
# Créer le répertoire
New-Item -ItemType Directory -Path "C:\apps\portail\launcher" -Force

# Copier le script
Copy-Item "C:\TOOLS\devportal\harp\windows\launcher\launcher.ps1" -Destination "C:\apps\portail\launcher\launcher.ps1"
```

### 2. Modifier le fichier .reg

Éditez `windows/protocol/install-mylaunch.reg` et modifiez le chemin si nécessaire :
```reg
[HKEY_CLASSES_ROOT\mylaunch\shell\open\command]
@="\"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe\" -ExecutionPolicy Bypass -WindowStyle Hidden -File \"C:\\apps\\portail\\launcher\\launcher.ps1\" \"%1\""
```

### 3. Installer le protocole

Double-cliquez sur `windows/protocol/install-mylaunch.reg` et confirmez l'ajout au registre.

## Test de l'installation

### Test 1: Dans la console du navigateur

Ouvrez la console développeur (F12) et exécutez :
```javascript
window.location.href = 'mylaunch://putty?host=192.168.1.49&user=root&port=22';
```

### Test 2: Vérifier les logs

Les logs sont disponibles dans :
```
C:\apps\portail\launcher\logs\launcher.log
```

### Test 3: Tester le script directement

```powershell
C:\apps\portail\launcher\launcher.ps1 "mylaunch://putty?host=test"
```

## Utilisation dans l'application Next.js

### Méthode 1: Utiliser le composant PuttyLauncher

```tsx
import { PuttyLauncher } from '@/components/ui/external-tool-launcher';

<PuttyLauncher 
  host="192.168.1.49" 
  user="root" 
  port={22}
/>
```

### Méthode 2: Utiliser la fonction launchExternalTool

```tsx
import { launchExternalTool } from '@/lib/mylaunch';

const handleLaunch = () => {
  launchExternalTool('putty', {
    host: '192.168.1.49',
    user: 'root',
    port: 22,
    sshkey: 'C:\\ssh\\key.ppk'
  });
};
```

### Méthode 3: Utiliser le hook useExternalTool

```tsx
import { useExternalTool } from '@/hooks/use-external-tool';

const { launch, isLaunching, error } = useExternalTool();

const handleLaunch = () => {
  launch('putty', { host: '192.168.1.49', user: 'root', port: 22 });
};
```

## Applications supportées

- **PuTTY** : `mylaunch://putty?host=...&user=...&port=...&sshkey=...`
- **PeopleSoft IDE** : `mylaunch://pside?dbname=...&server=...`
- **PeopleSoft PTSMT** : `mylaunch://ptsmt?dbname=...&server=...`

## Dépannage

### Le protocole ne se lance pas

1. Vérifier que le protocole est installé :
   ```powershell
   Get-ItemProperty -Path "HKCR:\mylaunch"
   ```

2. Vérifier les logs :
   ```
   C:\apps\portail\launcher\logs\launcher.log
   ```

3. Vérifier la politique d'exécution PowerShell :
   ```powershell
   Get-ExecutionPolicy
   Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```

### L'application externe ne se lance pas

1. Vérifier que l'exécutable existe au chemin spécifié dans `launcher.ps1`
2. Vérifier les permissions d'exécution
3. Tester manuellement l'exécutable

### La boîte de dialogue du navigateur apparaît toujours

C'est normal la première fois. Le navigateur demande confirmation pour lancer le protocole personnalisé.

Pour éviter cela, configurez le navigateur via GPO ou stratégie de groupe (voir `INSTALLATION.md`).

## Configuration des chemins

Si vos applications sont installées ailleurs, modifiez `C:\apps\portail\launcher\launcher.ps1` :

```powershell
$allowed = @{
    'putty' = @{ 
        Path = 'C:\\Program Files\\PuTTY\\putty.exe'  # Modifier ici
        # ...
    }
}
```

## Support

- Documentation complète : `windows/INSTALLATION.md`
- Exemples de code : `components/examples/ExternalToolExamples.tsx`
- Script launcher : `windows/launcher/launcher.ps1`

