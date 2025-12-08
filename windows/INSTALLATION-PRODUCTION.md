# Guide d'installation et mode d'emploi - Production

## ⚠️ IMPORTANT : Configuration dynamique

**Le launcher utilise maintenant une configuration dynamique depuis la base de données.**

Les chemins des applications ne sont plus codés en dur dans `launcher.ps1`. Ils sont récupérés dynamiquement depuis la table `harptools` via l'API `/api/launcher/tool`.

### Avantages

- ✅ **Pas besoin de modifier le registre Windows** : Les utilisateurs n'ont pas besoin de droits administrateur pour modifier les chemins
- ✅ **Configuration centralisée** : Tous les chemins sont gérés depuis la page `/list/tools` de l'application
- ✅ **Mise à jour en temps réel** : Les modifications dans la base de données sont immédiatement prises en compte
- ✅ **Clé SSH automatique** : La clé SSH de l'utilisateur est récupérée automatiquement depuis la table `User`

### Configuration des outils

Les outils doivent être configurés dans la page **`/list/tools`** de l'application avec les colonnes suivantes :

- **tool** : Nom de l'outil (ex: `putty`, `pside`, `sqlplus`)
- **cmdpath** : Chemin du répertoire (ex: `D:\apps\PuTTY`)
- **cmd** : Nom de l'exécutable (ex: `putty.exe`)
- **cmdarg** : Arguments par défaut (optionnel)

### Exemples de configuration

| tool        | cmdpath                                                      | cmd            | cmdarg |
|-------------|--------------------------------------------------------------|----------------|--------|
| putty       | `D:\apps\PuTTY`                                              | `putty.exe`     |        |
| sqlplus     | `D:\apps\oracle\client_full_19c_64b\product\19.3.0\client\winx86` | `sqlplus.exe`  |        |
| sqldeveloper| `D:\apps\oracle\SQL_Developer`                              | `sqldeveloper.exe` |      |
| filezilla   | `D:\apps\FileZilla`                                          | `filezilla.exe` |        |
| psdmt       | `D:\apps\peoplesoft\pt861\bin\client\winx86`                | `psdmt.exe`     |        |
| pside       | `D:\apps\peoplesoft\pt861\bin\client\winx86`                | `pside.exe`     |        |

## Installation en production

### Étape 1: Préparer le script PowerShell

1. **Copier le script launcher.ps1 vers le répertoire de production :**
   ```powershell
   Copy-Item "C:\TOOLS\devportal\harp\windows\launcher\launcher.ps1" -Destination "D:\apps\portail\launcher\launcher.ps1" -Force
   ```

2. **Créer le répertoire si nécessaire :**
   ```powershell
   New-Item -ItemType Directory -Path "D:\apps\portail\launcher" -Force
   ```

3. **Configurer les permissions (en tant qu'administrateur) :**
   ```powershell
   icacls "D:\apps\portail\launcher" /grant Users:RX
   ```

4. **Configurer la politique d'exécution PowerShell (si nécessaire) :**
   ```powershell
   Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```

### Étape 2: Installer le protocole Windows

#### Option A: Installation manuelle (recommandé pour test)

1. Double-cliquer sur `windows/protocol/install-mylaunch.reg`
2. Confirmer l'ajout au registre Windows

#### Option B: Déploiement via GPO (recommandé pour production)

1. Importer `windows/protocol/install-mylaunch.reg` dans la GPO
2. Cibler : `Computer Configuration > Preferences > Windows Settings > Registry`
3. Appliquer la stratégie aux postes utilisateurs

### Étape 3: Configurer l'URL de l'API (optionnel)

Par défaut, le launcher utilise l'URL de production `https://portails.orange-harp.fr:9052`.

Pour utiliser une autre URL (par exemple en développement), configurer la variable d'environnement :

```powershell
# Pour un utilisateur spécifique
[System.Environment]::SetEnvironmentVariable("HARP_API_URL", "http://localhost:3000", "User")

# Pour tous les utilisateurs (nécessite des droits administrateur)
[System.Environment]::SetEnvironmentVariable("HARP_API_URL", "http://localhost:3000", "Machine")
```

### Étape 4: Configurer les outils dans la base de données

**IMPORTANT** : Les outils doivent être configurés dans la page `/list/tools` de l'application avant d'être utilisables.

1. Se connecter à l'application
2. Aller dans `/list/tools`
3. Créer ou modifier les outils avec les bons chemins
4. Vérifier que les chemins sont corrects et que les exécutables existent

### Étape 5: Configurer le navigateur (Edge/Chrome)

Pour éviter la boîte de dialogue de confirmation à chaque lancement :

#### Via GPO/Stratégie de groupe (recommandé)

1. **Microsoft Edge:**
   - `Computer Configuration > Administrative Templates > Microsoft Edge`
   - Activer : `ExternalProtocolDialogShowAlwaysOpenCheckbox`
   - Configurer : `AutoLaunchProtocolsFromOrigins`
     ```json
     [
       {
         "protocol": "mylaunch",
         "allowed_origins": ["https://portails.orange-harp.fr:9052"]
       }
     ]
     ```

2. **Google Chrome:**
   - `Computer Configuration > Administrative Templates > Google > Google Chrome`
   - Même configuration que Edge

#### Via registre Windows (si GPO non disponible)

```reg
[HKEY_LOCAL_MACHINE\SOFTWARE\Policies\Microsoft\Edge]
"ExternalProtocolDialogShowAlwaysOpenCheckbox"=dword:00000001

[HKEY_LOCAL_MACHINE\SOFTWARE\Policies\Microsoft\Edge\AutoLaunchProtocolsFromOrigins]
"1"="{\"protocol\":\"mylaunch\",\"allowed_origins\":[\"https://portails.orange-harp.fr:9052\"]}"
```

## Vérification de l'installation

### Test 1: Vérifier le protocole Windows

```powershell
Get-ItemProperty -Path "HKCR:\mylaunch"
```

Vous devriez voir les clés du protocole enregistré.

### Test 2: Tester le script directement

```powershell
D:\apps\portail\launcher\launcher.ps1 "mylaunch://putty?host=test"
```

### Test 3: Tester depuis le navigateur

Ouvrir la console développeur (F12) et exécuter :
```javascript
window.location.href = 'mylaunch://putty?host=192.168.1.49&user=root&port=22';
```

### Test 4: Vérifier les logs

Les logs sont disponibles dans :
```
D:\apps\portail\launcher\logs\launcher.log
```

## Utilisation dans l'application

### Exemple : Lancer PuTTY

```tsx
import { launchExternalTool } from '@/lib/mylaunch';

// Lancer PuTTY avec les paramètres
launchExternalTool('putty', {
  host: '192.168.1.49',
  user: 'root',
  port: 22,
  sshkey: 'C:\\ssh\\key.ppk'  // Optionnel
});
```

### Exemple : Lancer SQL Developer

```tsx
import { launchExternalTool } from '@/lib/mylaunch';

launchExternalTool('sqldeveloper');
```

### Exemple : Lancer PeopleSoft AppDesigner

```tsx
import { launchExternalTool } from '@/lib/mylaunch';

launchExternalTool('pside', {
  dbname: 'HR92',
  server: 'PSDEV',
  user: 'PS',
  password: 'PS'
});
```

## Dépannage

### Le protocole ne se lance pas

1. **Vérifier que le protocole est installé :**
   ```powershell
   Get-ItemProperty -Path "HKCR:\mylaunch"
   ```

2. **Vérifier les logs :**
   ```
   D:\apps\portail\launcher\logs\launcher.log
   ```

3. **Vérifier la politique d'exécution PowerShell :**
   ```powershell
   Get-ExecutionPolicy
   Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```

### L'application externe ne se lance pas

1. **Vérifier que l'exécutable existe :**
   ```powershell
   Test-Path "D:\apps\PuTTY\putty.exe"  # Remplacer par le chemin de l'application
   ```

2. **Vérifier les permissions d'exécution**

3. **Tester manuellement l'exécutable :**
   ```powershell
   & "D:\apps\PuTTY\putty.exe"
   ```

### Erreur "Exécutable introuvable"

Si vous voyez l'erreur dans les logs, cela signifie que le chemin dans la base de données ne correspond pas à l'emplacement réel de l'application.

**Solution :** 
1. Vérifier que l'exécutable existe au chemin indiqué
2. Modifier l'outil dans `/list/tools` avec le bon chemin
3. Vérifier que `cmdpath` et `cmd` sont correctement remplis

### Erreur "Impossible de récupérer les informations de l'outil"

Si vous voyez cette erreur, cela signifie que :
- L'outil n'existe pas dans la table `harptools`
- L'API n'est pas accessible
- Le netid de l'utilisateur n'est pas correct

**Solution :**
1. Vérifier que l'outil existe dans `/list/tools`
2. Vérifier que l'URL de l'API est correcte (variable `HARP_API_URL` ou valeur par défaut)
3. Vérifier que l'utilisateur Windows correspond à un netid dans la table `User`

### La boîte de dialogue du navigateur apparaît toujours

C'est normal la première fois. Pour éviter cela :
- Configurer le navigateur via GPO (voir Étape 4)
- Cocher "Toujours autoriser" dans la boîte de dialogue

## Mise à jour des chemins

**Les chemins sont maintenant gérés depuis la base de données, pas besoin de modifier le script PowerShell !**

Pour mettre à jour un chemin :

1. Se connecter à l'application
2. Aller dans `/list/tools`
3. Modifier l'outil concerné
4. Mettre à jour les colonnes `cmdpath` et/ou `cmd`
5. Sauvegarder

Les modifications sont immédiatement prises en compte, aucun redéploiement du script n'est nécessaire.

### Mise à jour du script launcher.ps1

Si vous devez mettre à jour le script lui-même (par exemple pour corriger un bug) :

```powershell
Copy-Item "C:\TOOLS\devportal\harp\windows\launcher\launcher.ps1" -Destination "D:\apps\portail\launcher\launcher.ps1" -Force
```

## Sécurité

### Points d'attention

1. **Configuration dynamique sécurisée** : 
   - Le netid est récupéré depuis l'environnement Windows de l'utilisateur
   - Chaque utilisateur ne peut récupérer que sa propre clé SSH (pkeyfile)
   - Les outils sont validés depuis la base de données (whitelist)

2. **API endpoint** :
   - L'API `/api/launcher/tool` est publique mais sécurisée car :
     - Elle nécessite un netid valide
     - Elle ne retourne que les informations de l'outil et la clé SSH de l'utilisateur correspondant
     - Les chemins d'exécutables sont des informations non sensibles

3. **Validation des arguments** : Les paramètres sont filtrés et validés avant le lancement

4. **Journalisation** : Tous les lancements sont loggés dans `D:\apps\portail\launcher\logs\launcher.log`

5. **Permissions** : Limiter l'accès au dossier `D:\apps\portail\launcher`

### Recommandations de sécurité

- **Restreindre l'accès réseau** : L'API devrait être accessible uniquement depuis le réseau interne
- **HTTPS en production** : Utiliser HTTPS pour sécuriser les communications avec l'API
- **Validation du netid** : S'assurer que le netid Windows correspond bien à un utilisateur valide dans la base de données
- **Audit des logs** : Surveiller régulièrement les logs pour détecter des tentatives d'utilisation suspectes

### Améliorations possibles

- Signer le script PowerShell avec un certificat
- Ajouter une authentification au niveau du launcher
- Implémenter un système de tokens pour valider les requêtes

## Support

Pour toute question ou problème :
- Documentation complète : `windows/INSTALLATION.md`
- Guide rapide : `windows/GUIDE-INSTALLATION-RAPIDE.md`
- Script launcher : `windows/launcher/launcher.ps1`
