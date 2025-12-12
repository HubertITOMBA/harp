# Guide d'installation SANS modification du registre Windows

## Vue d'ensemble

Cette solution utilise un **serveur HTTP local** au lieu du protocole `mylaunch://` dans le registre Windows. Aucune modification du registre n'est nécessaire !

## Architecture

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│  Next.js    │ ──────> │  Serveur HTTP│ ──────> │ PowerShell  │
│  (navigateur)│         │  localhost   │         │  Launcher   │
│             │         │  :8765       │         │             │
└─────────────┘         └──────────────┘         └─────────────┘
                                                        │
                                                        v
                                                ┌─────────────┐
                                                │ Applications│
                                                │ (PuTTY, PS) │
                                                └─────────────┘
```

## Installation (SANS droits administrateur) ✅

### Étape unique : Installation du serveur launcher

```powershell
# Ouvrir PowerShell (pas besoin d'admin)
cd C:\TOOLS\devportal\harp\windows\launcher
.\install-launcher-server.ps1
```

Ce script :
- ✅ Installe le launcher dans `%LOCALAPPDATA%\HARP\launcher`
- ✅ Démarre le serveur HTTP local sur le port 8765
- ✅ **Ne nécessite PAS de droits administrateur**
- ✅ **Ne modifie PAS le registre Windows**

### Ajouter au démarrage Windows (optionnel)

Pour que le serveur démarre automatiquement à chaque connexion :

```powershell
.\install-launcher-server.ps1 -AddToStartup
```

## Fonctionnement

1. **Le serveur HTTP local** écoute sur `http://localhost:8765`
2. **L'application web** envoie une requête HTTP au serveur local
3. **Le serveur** lance l'application via PowerShell
4. **Aucun protocole personnalisé** n'est nécessaire !

## Avantages

### ✅ Pas de modification du registre Windows
- Aucune modification du registre nécessaire
- Fonctionne même avec des restrictions administratives strictes

### ✅ Installation simple
- Un seul script à exécuter
- Pas besoin de droits administrateur

### ✅ Configuration centralisée
- Les chemins des applications dans la base de données
- Les chemins sont dans la table `harptools`
- Modification via `/list/tools` dans l'interface web

### ✅ Fallback automatique
- Si le serveur local n'est pas disponible, l'application essaie le protocole `mylaunch://`
- Compatible avec les deux méthodes

## Démarrer/Arrêter le serveur

### Démarrer manuellement

```powershell
cd %LOCALAPPDATA%\HARP\launcher
.\start-launcher-server.bat
```

Ou directement :

```powershell
powershell.exe -ExecutionPolicy Bypass -WindowStyle Hidden -File "%LOCALAPPDATA%\HARP\launcher\launcher-server.ps1"
```

### Arrêter le serveur

```powershell
# Trouver le processus
Get-Process -Name "powershell" | Where-Object { $_.CommandLine -like "*launcher-server.ps1*" }

# Arrêter le processus
Stop-Process -Name "powershell" -Force
```

## Vérification

### Vérifier que le serveur fonctionne

```powershell
# Tester la santé du serveur
Invoke-WebRequest -Uri "http://localhost:8765/health" -UseBasicParsing
```

Vous devriez recevoir :
```json
{
  "status": "ok",
  "service": "HARP Launcher Server",
  "port": 8765,
  "apiUrl": "https://portails.orange-harp.fr:9352"
}
```

### Tester le lancement d'une application

Depuis la console du navigateur (F12) :

```javascript
fetch('http://localhost:8765/launch?tool=sqldeveloper')
  .then(r => r.json())
  .then(console.log);
```

## Dépannage

### Le serveur ne démarre pas

1. **Vérifier que le port 8765 n'est pas utilisé** :
   ```powershell
   netstat -ano | findstr :8765
   ```

2. **Vérifier les logs** :
   ```
   %LOCALAPPDATA%\HARP\launcher\logs\launcher.log
   ```

3. **Démarrer manuellement pour voir les erreurs** :
   ```powershell
   powershell.exe -ExecutionPolicy Bypass -WindowStyle Normal -File "%LOCALAPPDATA%\HARP\launcher\launcher-server.ps1"
   ```

### L'application ne se lance pas depuis le navigateur

1. **Vérifier que le serveur est démarré** :
   ```powershell
   Invoke-WebRequest -Uri "http://localhost:8765/health" -UseBasicParsing
   ```

2. **Vérifier la console du navigateur** pour les erreurs CORS ou de connexion

3. **Vérifier les logs du serveur** dans la fenêtre PowerShell

### Le serveur se ferme automatiquement

Si le serveur se ferme après quelques secondes, vérifier :
- Les erreurs dans la console PowerShell
- Les permissions d'exécution PowerShell
- Les règles de pare-feu Windows

## Sécurité

- ✅ Le serveur écoute uniquement sur `localhost` (127.0.0.1)
- ✅ Aucune exposition sur le réseau externe
- ✅ Les requêtes sont validées avant de lancer les applications
- ✅ Les chemins des applications sont vérifiés depuis la base de données

## Migration depuis le protocole mylaunch://

Si vous aviez déjà installé le protocole `mylaunch://` :

1. **Installer le serveur** :
   ```powershell
   .\install-launcher-server.ps1
   ```

2. **L'application utilisera automatiquement le serveur** si disponible
3. **Le protocole mylaunch:// reste disponible** en fallback

## Support

Pour toute question :
1. Consulter les logs : `%LOCALAPPDATA%\HARP\launcher\logs\launcher.log`
2. Vérifier la configuration : `%LOCALAPPDATA%\HARP\launcher\launcher-config.json`
3. Tester le serveur : `http://localhost:8765/health`

