# Guide d'installation pour utilisateurs (sans droits admin)

## Vue d'ensemble

Ce guide explique comment installer le launcher HARP **sans nécessiter de droits administrateur** pour chaque utilisateur. La configuration est stockée dans le dossier utilisateur et dans la base de données.

## Installation en 2 étapes

### Étape 1 : Installation du launcher (SANS droits admin) ✅

**Chaque utilisateur peut faire cette étape lui-même** :

```powershell
# Ouvrir PowerShell (pas besoin d'admin)
cd C:\TOOLS\devportal\harp\windows\launcher
.\install-launcher-user.ps1
```

Ce script installe le launcher dans `%LOCALAPPDATA%\HARP\launcher\` :
- ✅ Script `launcher.ps1`
- ✅ Wrapper batch `launcher-wrapper.bat`
- ✅ Fichier de configuration `launcher-config.json`
- ✅ Dossier `logs\`
- ✅ **Ne nécessite PAS de droits administrateur**

### Étape 2 : Installation du protocole (UNE SEULE FOIS par admin) 🔧

**Cette étape nécessite des droits administrateur** et doit être faite une seule fois :

#### Option A : Via GPO (recommandé pour entreprises)

L'administrateur système installe le protocole `mylaunch://` via GPO :

1. Créer un script GPO qui exécute `install-mylaunch-user.ps1` pour chaque utilisateur
2. Ou utiliser un fichier .reg avec le chemin résolu par utilisateur

#### Option B : Installation manuelle par admin

L'administrateur exécute pour chaque utilisateur (ou crée un script qui le fait automatiquement) :

```powershell
# En tant qu'administrateur
cd C:\TOOLS\devportal\harp\windows\launcher
.\install-mylaunch-user.ps1
```

Ce script :
- ✅ Vérifie que le launcher est installé dans le dossier utilisateur
- ✅ Génère un fichier .reg avec le chemin résolu de l'utilisateur
- ✅ Installe le protocole dans le registre Windows

## Fichier de configuration

Le fichier `%LOCALAPPDATA%\HARP\launcher\launcher-config.json` peut être modifié par chaque utilisateur :

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

- **apiUrl** : URL de l'API (peut être différente par environnement)
- **keepWindowOpenOnError** : Garder la fenêtre ouverte en cas d'erreur
- **keepWindowOpenOnSuccess** : Garder la fenêtre ouverte en cas de succès
- **windowCloseDelay** : Délai avant fermeture automatique (secondes)

## Configuration dans la base de données

Les outils sont configurés dans la table `harptools` via l'interface web `/list/tools` :

- **tool** : Nom de l'outil (ex: `sqldeveloper`, `putty`)
- **cmdpath** : Chemin du répertoire (ex: `D:\apps\oracle\SQL_Developer`)
- **cmd** : Nom de l'exécutable (ex: `sqldeveloper.exe`)
- **cmdarg** : Arguments par défaut (optionnel)

**Aucune modification de script n'est nécessaire** - tout est géré depuis la base de données !

## Avantages

### ✅ Pas besoin de droits admin pour chaque utilisateur
- Chaque utilisateur installe le launcher dans son dossier personnel
- Configuration personnalisable par utilisateur

### ✅ Configuration centralisée dans la base de données
- Les chemins des applications sont dans `harptools`
- Modification via l'interface web `/list/tools`
- Pas besoin de modifier les scripts sur chaque poste

### ✅ Installation simplifiée
- Script d'installation automatique
- Pas de manipulation manuelle du registre par utilisateur

## Dépannage

### Le protocole ne fonctionne pas

1. **Vérifier que le protocole est installé** :
   ```powershell
   Get-ItemProperty -Path "HKCR:\mylaunch" -ErrorAction SilentlyContinue
   ```
   Si rien ne s'affiche, contactez votre administrateur.

2. **Vérifier que le launcher est installé** :
   ```powershell
   Test-Path "$env:LOCALAPPDATA\HARP\launcher\launcher.ps1"
   ```
   Si `False`, exécutez `install-launcher-user.ps1`.

### L'application ne se lance pas

1. **Consulter les logs** :
   ```
   %LOCALAPPDATA%\HARP\launcher\logs\launcher.log
   ```

2. **Vérifier la configuration** :
   ```powershell
   Get-Content "$env:LOCALAPPDATA\HARP\launcher\launcher-config.json"
   ```

3. **Vérifier que l'outil existe dans la base de données** :
   - Aller sur `/list/tools` dans l'application web
   - Vérifier que l'outil est configuré

## Migration depuis l'ancienne installation

Si vous aviez déjà installé dans `C:\apps\portail\launcher` ou `D:\apps\portail\launcher` :

1. **Installer la nouvelle version** :
   ```powershell
   .\install-launcher-user.ps1
   ```

2. **Copier les logs existants** (optionnel) :
   ```powershell
   Copy-Item "C:\apps\portail\launcher\logs\*" "$env:LOCALAPPDATA\HARP\launcher\logs\" -Force
   ```

3. **Mettre à jour le protocole** :
   L'administrateur doit exécuter `install-mylaunch-user.ps1` pour mettre à jour le registre.

