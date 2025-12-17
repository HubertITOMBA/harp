# Guide d'installation sans droits administrateur

## Vue d'ensemble

Ce guide explique comment installer le launcher HARP **sans nécessiter de droits administrateur** pour chaque utilisateur. La configuration est stockée dans le dossier utilisateur et dans la base de données.

## Architecture

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│  Next.js    │ ──────> │  Protocole   │ ──────> │ PowerShell  │
│  (navigateur)│         │  mylaunch:// │         │  Launcher   │
└─────────────┘         └──────────────┘         └─────────────┘
                                                        │
                                                        v
                                                ┌─────────────┐
                                                │ Fichier JSON│
                                                │ (AppData)   │
                                                └─────────────┘
                                                        │
                                                        v
                                                ┌─────────────┐
                                                │ Base de     │
                                                │ données     │
                                                └─────────────┘
```

## Installation en 3 étapes

### Étape 1 : Installation du launcher (SANS droits admin)

Chaque utilisateur peut installer le launcher dans son dossier personnel :

```powershell
# Ouvrir PowerShell (pas besoin d'admin)
cd C:\TOOLS\devportal\harp\windows\launcher
.\install-launcher-user.ps1
```

Ce script :
- ✅ Crée le dossier `%LOCALAPPDATA%\HARP\launcher`
- ✅ Copie le script `launcher.ps1`
- ✅ Crée le fichier de configuration `launcher-config.json`
- ✅ Crée le dossier `logs`
- ✅ **Ne nécessite PAS de droits administrateur**

### Étape 2 : Installation du protocole (UNE SEULE FOIS par admin)

**Option A : Via GPO (recommandé pour entreprises)**

L'administrateur système installe le protocole `mylaunch://` une seule fois via GPO :

1. Importer `windows/protocol/install-mylaunch-D.reg` dans la GPO
2. Cibler : `Computer Configuration > Preferences > Windows Settings > Registry`
3. Modifier le chemin pour pointer vers `%LOCALAPPDATA%\HARP\launcher\launcher.ps1`

**Option B : Installation manuelle par admin**

L'administrateur exécute une seule fois :

```powershell
# En tant qu'administrateur
cd C:\TOOLS\devportal\harp\windows\launcher
.\install-mylaunch-user.ps1
```

Ce script installe le protocole dans le registre Windows (nécessite admin).

### Étape 3 : Configuration dans la base de données

Les outils sont déjà configurés dans la base de données (table `harptools`). Aucune action supplémentaire n'est nécessaire.

## Fichier de configuration utilisateur

Le fichier `%LOCALAPPDATA%\HARP\launcher\launcher-config.json` contient :

```json
{
  "version": "1.0",
  "apiUrl": "https://localhost:9352",
  "logLevel": "info",
  "keepWindowOpenOnError": true,
  "keepWindowOpenOnSuccess": false,
  "windowCloseDelay": 2
}
```

### Personnalisation

Chaque utilisateur peut modifier ce fichier pour :
- Changer l'URL de l'API
- Activer/désactiver les logs détaillés
- Configurer le comportement de la fenêtre PowerShell

## Avantages de cette approche

### ✅ Pas besoin de droits admin pour chaque utilisateur
- Chaque utilisateur installe le launcher dans son dossier personnel
- Aucune modification du registre par utilisateur

### ✅ Configuration centralisée dans la base de données
- Les chemins des applications sont dans la table `harptools`
- Modification via l'interface web `/list/tools`
- Pas besoin de modifier les scripts sur chaque poste

### ✅ Configuration personnalisable par utilisateur
- Fichier JSON dans le dossier utilisateur
- Chaque utilisateur peut adapter sa configuration

### ✅ Installation simplifiée
- Script d'installation automatique
- Pas de manipulation manuelle du registre

## Dépannage

### Le protocole ne fonctionne pas

1. **Vérifier que le protocole est installé** :
   ```powershell
   Get-ItemProperty -Path "HKCR:\mylaunch" -ErrorAction SilentlyContinue
   ```
   Si rien ne s'affiche, le protocole n'est pas installé. Contactez votre administrateur.

2. **Vérifier que le launcher est installé** :
   ```powershell
   Test-Path "$env:LOCALAPPDATA\HARP\launcher\launcher.ps1"
   ```
   Si `False`, exécutez `install-launcher-user.ps1`.

### L'application ne se lance pas

1. **Vérifier les logs** :
   ```
   %LOCALAPPDATA%\HARP\launcher\logs\launcher.log
   ```

2. **Vérifier la configuration** :
   ```powershell
   Get-Content "$env:LOCALAPPDATA\HARP\launcher\launcher-config.json"
   ```

3. **Vérifier que l'outil existe dans la base de données** :
   - Aller sur `/list/tools` dans l'application web
   - Vérifier que l'outil est configuré avec les bons chemins

## Migration depuis l'ancienne installation

Si vous aviez déjà installé le launcher dans `C:\apps\portail\launcher` ou `D:\apps\portail\launcher` :

1. **Installer la nouvelle version** :
   ```powershell
   .\install-launcher-user.ps1
   ```

2. **Copier les logs existants** (optionnel) :
   ```powershell
   Copy-Item "C:\apps\portail\launcher\logs\*" "$env:LOCALAPPDATA\HARP\launcher\logs\" -Force
   ```

3. **Mettre à jour le protocole** :
   L'administrateur doit mettre à jour le registre pour pointer vers le nouveau chemin.

## Sécurité

- ✅ Le launcher est dans le dossier utilisateur (pas accessible par les autres utilisateurs)
- ✅ Les logs sont dans le dossier utilisateur
- ✅ La configuration est personnalisable par utilisateur
- ✅ Les chemins des applications sont validés depuis la base de données

## Support

Pour toute question :
1. Consulter les logs : `%LOCALAPPDATA%\HARP\launcher\logs\launcher.log`
2. Vérifier la configuration : `%LOCALAPPDATA%\HARP\launcher\launcher-config.json`
3. Contacter l'administrateur système pour l'installation du protocole

