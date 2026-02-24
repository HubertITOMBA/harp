# Installation du launcher HARP en production (D:\apps\portal\launcher)

Ce document décrit la procédure pour installer le launcher HARP sur un poste ou serveur de production dans **D:\apps\portal\launcher**. Le launcher utilise **uniquement le port 9352** (HTTP), pas le 9052.

---

## Prérequis

- Windows avec PowerShell 5.1 ou supérieur.
- Droits d’écriture sur **D:\apps\portal\** (création du dossier `launcher` si besoin).
- Politique d’exécution PowerShell autorisant l’exécution des scripts (ou utilisation de `-ExecutionPolicy Bypass`).

---

## Étape 1 : Créer le répertoire et copier les fichiers

1. Créer le dossier (si nécessaire) :
   ```batch
   mkdir D:\apps\portal\launcher
   ```

2. Copier depuis le dépôt HARP (dossier `windows/launcher/`) vers **D:\apps\portal\launcher** les fichiers suivants :
   - `launcher.ps1`
   - `launcher-server.ps1`
   - `launcher-config.json`
   - `start-launcher-server.bat`
   - `launcher-wrapper.bat` (si utilisation du protocole `mylaunch://`)
   - `install-launcher-server.ps1`
   - `install-launcher-user.ps1` (optionnel, pour installation par utilisateur)
   - `check-installation.ps1` (optionnel, pour vérification)

   Exemple (depuis la racine du dépôt) :
   ```batch
   xcopy /Y windows\launcher\*.ps1 D:\apps\portal\launcher\
   xcopy /Y windows\launcher\*.bat D:\apps\portal\launcher\
   xcopy /Y windows\launcher\launcher-config.json D:\apps\portal\launcher\
   ```

---

## Étape 2 : Installer le launcher dans D:\apps\portal\launcher

Ouvrir PowerShell (ou Invite de commandes) et exécuter :

```powershell
cd D:\apps\portal\launcher
.\install-launcher-server.ps1 -InstallPath "D:\apps\portal\launcher" -AddToStartup
```

- **`-InstallPath "D:\apps\portal\launcher"`** : installe (et crée la config par défaut) dans ce dossier. Sans ce paramètre, le script installerait dans W:\portal\HARP\launcher ou LOCALAPPDATA.
- **`-AddToStartup`** : ajoute un lancement automatique du serveur launcher au démarrage Windows (optionnel).

Résultat attendu :
- Fichiers nécessaires présents dans `D:\apps\portal\launcher\`.
- Fichier `launcher-config.json` créé ou conservé avec **apiUrl** en `http://...:9352` (pas de 9052).
- Serveur launcher démarré sur **http://localhost:8765** (port local du serveur HTTP du launcher).
- Si `-AddToStartup` a été utilisé : raccourci ou script dans le dossier Démarrage Windows.

---

## Étape 3 : Adapter l’URL de l’API (production)

En production, le portail HARP n’est en général pas sur `localhost` mais sur un serveur (ex. `http://portails.orange-harp.fr:9352` ou `http://10.173.8.125:9352`).

1. Ouvrir **D:\apps\portal\launcher\launcher-config.json**.
2. Mettre à jour **apiUrl** avec l’URL réelle du portail (HTTP, port **9352**) :
   ```json
   {
     "version": "1.0",
     "apiUrl": "http://votre-serveur:9352",
     "logLevel": "info",
     "keepWindowOpenOnError": true,
     "keepWindowOpenOnSuccess": false,
     "windowCloseDelay": 2
   }
   ```
   Remplacer `votre-serveur` par le nom d’hôte ou l’IP du serveur (ex. `portails.orange-harp.fr` ou `10.173.8.125`).

3. **Important** : n’utiliser **jamais** le port **9052** ; tout est en **9352** et en **HTTP**.

Alternative : définir la variable d’environnement **HARP_API_URL** (ex. `http://votre-serveur:9352`) sur le poste ; le launcher l’utilise en priorité sur le fichier de config.

---

## Étape 4 : Vérifier l’installation

Exécuter le script de vérification (si copié) :

```powershell
cd D:\apps\portal\launcher
.\check-installation.ps1
```

Vérifier que :
- **D:\apps\portal\launcher** est détecté et que tous les fichiers requis sont présents.
- Aucune référence au port **9052** dans **launcher-config.json** ni dans les messages (tout en **9352**).

Tester le serveur launcher :
- Ouvrir un navigateur et aller sur **http://localhost:8765/health**.
- La réponse doit contenir `"apiUrl": "http://...:9352"` (ou l’URL que vous avez configurée), jamais 9052.

---

## Démarrer / arrêter le serveur launcher

- **Démarrage manuel** : exécuter **D:\apps\portal\launcher\start-launcher-server.bat** (ou double-clic).
- **Démarrage automatique** : si `-AddToStartup` a été utilisé à l’installation, le serveur démarre à la connexion Windows.
- **Arrêt** : fermer la fenêtre PowerShell du serveur ou arrêter le processus correspondant.

---

## Ordre de recherche du launcher (rappels)

Les scripts **start-launcher-server.bat** et **launcher-wrapper.bat** cherchent le launcher dans cet ordre :

1. **D:\apps\portal\launcher** (production)
2. W:\portal\HARP\launcher
3. %LOCALAPPDATA%\HARP\launcher
4. %TEMP%\HARP\launcher

Une installation dans **D:\apps\portal\launcher** est donc prioritaire.

---

## Dépannage : message ou URL qui affiche encore le port 9052

Si un message ou une URL affiche le **9052** alors que vous n’utilisez que le **9352** :

- Vérifier **D:\apps\portal\launcher\launcher-config.json** : **apiUrl** doit être en `http://...:9352`.
- Vérifier la variable d’environnement **HARP_API_URL** sur le poste (elle doit aussi pointer vers `http://...:9352`).
- Réexécuter l’installation (étape 2) pour repartir sur une config à jour ; vérifier ensuite à nouveau **launcher-config.json**.

Voir aussi : **docs/CONFIGURATION_HTTP_UNIQUEMENT.md** (section « Dépannage : message ou URL qui affiche le port 9052 (launcher) »).

---

## Résumé des commandes (production)

| Action | Commande |
|--------|----------|
| Installer dans D:\apps\portal\launcher | `cd D:\apps\portal\launcher` puis `.\install-launcher-server.ps1 -InstallPath "D:\apps\portal\launcher" -AddToStartup` |
| Vérifier l’installation | `.\check-installation.ps1` |
| Démarrer le serveur manuellement | `D:\apps\portal\launcher\start-launcher-server.bat` |
| Vérifier que le serveur répond | Ouvrir **http://localhost:8765/health** dans un navigateur |

Port utilisé pour l’API du portail : **9352** (HTTP). Aucune utilisation du port **9052** dans le launcher.
