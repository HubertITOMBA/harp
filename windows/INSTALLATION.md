# Guide d'installation - Protocole mylaunch://

## Vue d'ensemble

Ce système permet de lancer des applications Windows locales (PuTTY, PeopleSoft, etc.) depuis votre application web Next.js via un protocole personnalisé `mylaunch://`.

## Architecture

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│  Next.js    │ ──────> │  Protocole   │ ──────> │ PowerShell  │
│  (navigateur)│         │  mylaunch:// │         │  Launcher   │
└─────────────┘         └──────────────┘         └─────────────┘
                                                        │
                                                        v
                                                ┌─────────────┐
                                                │ Applications│
                                                │ (PuTTY, PS) │
                                                └─────────────┘
```

## Étapes d'installation

### 1. Préparer le script PowerShell

1. Copier `windows/launcher/launcher.ps1` vers `C:\apps\portail\launcher\launcher.ps1`
2. Vérifier les permissions du dossier:
   ```powershell
   # Exécuter en tant qu'administrateur
   icacls "C:\apps\portail\launcher" /grant Users:RX
   ```

3. (Optionnel) Signer le script PowerShell pour éviter les problèmes d'exécution:
   ```powershell
   Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```

### 2. Installer le protocole Windows

#### Option A: Installation manuelle
- Double-cliquer sur `windows/protocol/install-mylaunch.reg`
- Confirmer l'ajout au registre

#### Option B: Déploiement via GPO
1. Importer `windows/protocol/install-mylaunch.reg` dans GPO
2. Cibler: `Computer Configuration > Preferences > Windows Settings > Registry`

### 3. Adapter les chemins d'exécution (si nécessaire)

Éditer `windows/launcher/launcher.ps1` et modifier les chemins dans la table `$allowed`:

```powershell
$allowed = @{
    'putty' = @{ 
        Path = 'C:\\Program Files\\PuTTY\\putty.exe'  # Adapter si nécessaire
        # ...
    }
    'pside' = @{ 
        Path = 'C:\\Program Files\\PeopleSoft\\pside.exe'  # Adapter si nécessaire
        # ...
    }
    # ...
}
```

### 4. Configurer le navigateur (Edge/Chrome)

Pour éviter la boîte de dialogue de confirmation à chaque lancement:

#### Via GPO/Stratégie de groupe

1. **Edge:**
   - `Computer Configuration > Administrative Templates > Microsoft Edge`
   - Activer: `ExternalProtocolDialogShowAlwaysOpenCheckbox`
   - Configurer: `AutoLaunchProtocolsFromOrigins`
     ```json
     [
       {
         "protocol": "mylaunch",
         "allowed_origins": ["https://intranet.votre-domaine.tld"]
       }
     ]
     ```

2. **Chrome:**
   - `Computer Configuration > Administrative Templates > Google > Google Chrome`
   - Même configuration que Edge

#### Via registre Windows (si GPO non disponible)

```reg
[HKEY_LOCAL_MACHINE\SOFTWARE\Policies\Microsoft\Edge]
"ExternalProtocolDialogShowAlwaysOpenCheckbox"=dword:00000001

[HKEY_LOCAL_MACHINE\SOFTWARE\Policies\Microsoft\Edge\AutoLaunchProtocolsFromOrigins]
"1"="{\"protocol\":\"mylaunch\",\"allowed_origins\":[\"https://intranet.votre-domaine.tld\"]}"
```

### 5. Tester l'installation

1. Ouvrir un navigateur
2. Dans la console développeur, tester:
   ```javascript
   window.location.href = 'mylaunch://putty?host=localhost&user=test';
   ```
3. Vérifier les logs dans `C:\apps\portail\launcher\logs\launcher.log`

## Utilisation dans l'application Next.js

Voir `windows/README.md` pour des exemples détaillés.

### Exemple rapide

```tsx
import { PuttyLauncher } from '@/components/ui/external-tool-launcher';

<PuttyLauncher 
  host="10.0.0.1" 
  user="admin" 
  port={22}
/>
```

## Sécurité

### Points d'attention

1. **Whitelist stricte**: Seuls les outils listés dans `$allowed` peuvent être lancés
2. **Validation des arguments**: Les paramètres sont filtrés et validés
3. **Journalisation**: Tous les lancements sont loggés
4. **Permissions**: Limiter l'accès au dossier du launcher

### Améliorations possibles

- Signer le script PowerShell avec un certificat
- Ajouter une authentification au niveau du launcher
- Implémenter un système de tokens pour valider les requêtes

## Dépannage

### Le protocole ne se lance pas

1. Vérifier que le protocole est enregistré:
   ```powershell
   Get-ItemProperty HKCR:\mylaunch
   ```

2. Vérifier les logs:
   ```
   C:\apps\portail\launcher\logs\launcher.log
   ```

3. Tester le script PowerShell directement:
   ```powershell
   .\launcher.ps1 "mylaunch://putty?host=test"
   ```

### L'application externe ne se lance pas

1. Vérifier que l'exécutable existe au chemin spécifié
2. Vérifier les permissions d'exécution
3. Tester manuellement l'exécutable

### La boîte de dialogue apparaît toujours

1. Vérifier la configuration GPO/Stratégie de groupe
2. Vérifier que l'origine de l'application correspond à celle configurée
3. Vider le cache du navigateur

## Support

Pour toute question ou problème, consulter:
- `windows/README.md` - Documentation technique
- `components/examples/ExternalToolExamples.tsx` - Exemples d'utilisation

