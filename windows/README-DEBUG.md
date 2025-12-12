# Guide de débogage - Launcher PowerShell

## Problème : La fenêtre PowerShell se ferme trop vite

Si la fenêtre PowerShell s'ouvre et se referme immédiatement sans laisser le temps de lire les messages, voici les solutions :

## Solution 1 : Utiliser la version DEBUG (recommandé pour le débogage)

1. **Installer la version DEBUG du protocole** :
   - Double-cliquer sur `windows/protocol/install-mylaunch-D-debug.reg`
   - Cette version utilise `-NoExit` pour garder la fenêtre ouverte

2. **Tester le lancement** :
   - Cliquer sur un lien dans l'application
   - La fenêtre PowerShell restera ouverte pour voir tous les messages

3. **Une fois le problème résolu, passer à la version PRODUCTION** :
   - Double-cliquer sur `windows/protocol/install-mylaunch-D-production.reg`
   - Cette version ferme automatiquement la fenêtre en cas de succès

## Solution 2 : Activer le mode DEBUG via variable d'environnement

1. **Définir la variable d'environnement** (en tant qu'administrateur) :
   ```powershell
   [System.Environment]::SetEnvironmentVariable("HARP_LAUNCHER_DEBUG", "1", "User")
   ```

2. **Redémarrer le navigateur** pour que la variable soit prise en compte

3. **Tester le lancement** :
   - La fenêtre restera ouverte même en cas de succès si DEBUG est activé

## Solution 3 : Consulter les logs

Les logs sont toujours disponibles même si la fenêtre se ferme :

```
D:\apps\portail\launcher\logs\launcher.log
```

Ouvrir ce fichier pour voir tous les messages, même si la fenêtre PowerShell s'est fermée.

## Vérification de l'installation

Pour vérifier que le protocole est correctement installé :

```powershell
Get-ItemProperty -Path "HKCR:\mylaunch\shell\open\command"
```

Vous devriez voir la commande PowerShell avec les bons chemins.

## Dépannage

### La fenêtre se ferme toujours trop vite

1. Vérifier que vous avez bien installé la version DEBUG
2. Vérifier que le fichier `.reg` a bien été appliqué (redémarrer peut être nécessaire)
3. Consulter les logs dans `D:\apps\portail\launcher\logs\launcher.log`

### L'application ne se lance pas

1. Vérifier que l'outil existe dans la table `harptools` (page `/list/tools`)
2. Vérifier que le chemin de l'exécutable est correct dans la base de données
3. Vérifier que l'exécutable existe bien au chemin indiqué
4. Consulter les logs pour voir l'erreur exacte

### Erreur "Exécutable introuvable"

1. Vérifier le chemin dans `/list/tools` pour l'outil concerné
2. Vérifier que `cmdpath` et `cmd` sont correctement remplis
3. Tester manuellement le chemin :
   ```powershell
   Test-Path "D:\apps\PuTTY\putty.exe"  # Remplacer par le chemin de votre outil
   ```

### Erreur "Impossible de récupérer les informations de l'outil"

1. Vérifier que l'API est accessible :
   ```powershell
   Invoke-WebRequest -Uri "https://portails.orange-harp.fr:9352/api/launcher/tool?tool=putty&netid=VOTRE_NETID"
   ```
2. Vérifier que votre NetID Windows correspond à un utilisateur dans la table `User`
3. Vérifier que l'outil existe dans la table `harptools`

