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
window.location.href = 'mylaunch://putty?token=<TOKEN_SIGNE>';
```

### Test 2: Vérifier les logs

Les logs sont disponibles dans :
```
C:\apps\portail\launcher\logs\launcher.log
```

### Test 3: Tester le script directement

```powershell
C:\apps\portail\launcher\launcher.ps1 "mylaunch://putty?token=<TOKEN_SIGNE>"
```

## Utilisation dans l'application Next.js

Les boutons du portail envoient un jeton signé au launcher local. Une URL sans jeton, ou qui ne fournit que `host`, `user` ou `sshkey`, est refusée.

## Applications supportées

Le portail décide de la commande. Le launcher local transporte le jeton, puis exécute le chemin et les arguments renvoyés par `/api/launcher/tool`.

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
- Script launcher : `windows/launcher/launcher.ps1`
- Script launcher : `windows/launcher/launcher.ps1`

