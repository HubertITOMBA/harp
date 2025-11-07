# Mode d'emploi Administrateur - Portail HARP

## Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Architecture technique](#architecture-technique)
3. [Installation et configuration](#installation-et-configuration)
4. [Gestion des utilisateurs](#gestion-des-utilisateurs)
5. [Gestion des environnements](#gestion-des-environnements)
6. [Configuration du protocole mylaunch://](#configuration-du-protocole-mylaunch)
7. [Maintenance et dépannage](#maintenance-et-dépannage)
8. [Sécurité](#sécurité)
9. [Annexes](#annexes)

---

## Vue d'ensemble

### Description

Le **Portail HARP** (Human Resources & Payroll) est une application web Next.js permettant de :
- Gérer les environnements PeopleSoft
- Consulter les informations serveurs et bases de données Oracle
- Lancer des applications Windows locales (PuTTY, SQL Developer, PeopleSoft, etc.) depuis le navigateur
- Administrer les utilisateurs et leurs rôles
- Suivre l'état des environnements et des serveurs

### Technologies utilisées

- **Framework** : Next.js 15.5.6 (React 19)
- **Base de données** : MariaDB/MySQL avec Prisma ORM
- **Authentification** : NextAuth.js v5 (JWT)
- **Protocole personnalisé** : `mylaunch://` pour lancer des applications Windows
- **Langage** : TypeScript
- **Styling** : Tailwind CSS avec Radix UI

---

## Architecture technique

### Structure du projet

```
harp/
├── app/                    # Pages Next.js (App Router)
│   ├── (auth)/             # Pages d'authentification
│   ├── (protected)/        # Pages protégées (nécessitent authentification)
│   ├── (dashboard)/        # Tableaux de bord
│   └── api/                 # Routes API
├── actions/                # Server Actions Next.js
├── components/              # Composants React
│   ├── auth/               # Composants d'authentification
│   ├── harp/               # Composants spécifiques HARP
│   └── ui/                 # Composants UI réutilisables
├── data/                   # Accès aux données
├── lib/                    # Utilitaires et configurations
├── prisma/                 # Schéma Prisma et migrations
├── windows/                # Scripts d'installation Windows
│   ├── launcher/           # Script PowerShell launcher.ps1
│   └── protocol/          # Fichiers .reg pour le protocole
└── scripts/                # Scripts utilitaires
```

### Base de données

Le schéma Prisma définit plusieurs modèles principaux :

- **User** : Utilisateurs de l'application
- **envsharp** : Environnements HARP
- **harpserve** : Serveurs
- **harpenvserv** : Liaison environnements/serveurs
- **harpenvinfo** : Informations détaillées sur les environnements
- **harpinstance** : Instances Oracle
- **harpmenus** : Menus de navigation
- **harproles** : Rôles utilisateurs
- **harpuseroles** : Liaison utilisateurs/rôles

### Authentification

- **Provider** : Credentials (netid + mot de passe)
- **Session** : JWT (JSON Web Token)
- **Adapter** : PrismaAdapter pour la persistance
- **Rôles** : Système de rôles personnalisé (ADMIN, USER, PORTAL_ADMIN, etc.)

---

## Installation et configuration

### Prérequis

- Node.js 20+ et npm
- MariaDB/MySQL
- Windows (pour le protocole mylaunch://)
- PowerShell 5.1+

### 1. Installation des dépendances

```bash
cd C:\TOOLS\devportal\harp
npm install
```

### 2. Configuration de la base de données

#### 2.1. Créer le fichier `.env`

Créer un fichier `.env` à la racine du projet :

```env
# Base de données
DATABASE_URL="mysql://root:axel2014@192.168.1.49:3306/mars?schema=public"

# NextAuth
AUTH_SECRET="votre-secret-tres-long-et-aleatoire"
AUTH_TRUST_HOST=true

# Environnement
NODE_ENV="development"
NEXT_PUBLIC_DEV_MODE="true"  # ou "false" pour la production

# Email (optionnel)
SMTP_HOST="smtp.example.com"
SMTP_PORT=587
SMTP_USER="user@example.com"
SMTP_PASSWORD="password"
```

**Important** : 
- Générer un `AUTH_SECRET` sécurisé : `openssl rand -base64 32`
- Ne pas utiliser de guillemets autour des valeurs dans `.env`
- En production, définir `NEXT_PUBLIC_DEV_MODE="false"`

#### 2.2. Configurer MariaDB

##### Autoriser les connexions depuis votre machine

```sql
-- Se connecter en tant que root
GRANT ALL PRIVILEGES ON mars.* TO 'root'@'%' IDENTIFIED BY 'axel2014';
FLUSH PRIVILEGES;
```

##### Résoudre les problèmes de résolution DNS

Si vous rencontrez l'erreur `Host 'xxx' is not allowed to connect` :

1. Éditer `/etc/mysql/mariadb.conf.d/50-server.cnf`
2. Ajouter dans la section `[mysqld]` :
   ```ini
   skip-name-resolve
   ```
3. Redémarrer MariaDB :
   ```bash
   sudo systemctl restart mariadb
   ```

#### 2.3. Initialiser Prisma

```bash
# Générer le client Prisma
npx prisma generate

# Appliquer les migrations (si nécessaire)
npx prisma migrate dev
```

### 3. Installation du protocole mylaunch://

Le protocole `mylaunch://` permet de lancer des applications Windows depuis le navigateur.

#### 3.1. Installation automatique (recommandé)

```powershell
# Exécuter en tant qu'administrateur
cd C:\TOOLS\devportal\harp\windows
.\install.ps1
```

Le script :
- Crée le répertoire `C:\apps\portail\launcher`
- Copie `launcher.ps1` vers ce répertoire
- Configure les permissions
- Génère et installe le fichier `.reg` dans le registre Windows

#### 3.2. Installation manuelle

1. **Copier le script launcher** :
   ```powershell
   New-Item -ItemType Directory -Path "C:\apps\portail\launcher" -Force
   Copy-Item "C:\TOOLS\devportal\harp\windows\launcher\launcher.ps1" -Destination "C:\apps\portail\launcher\launcher.ps1"
   ```

2. **Configurer les permissions** :
   ```powershell
   icacls "C:\apps\portail\launcher" /grant Users:RX
   ```

3. **Installer le protocole** :
   - Double-cliquer sur `windows/protocol/install-mylaunch-generated.reg`
   - Confirmer l'ajout au registre

#### 3.3. Mettre à jour le launcher

Après modification de `launcher.ps1` :

```powershell
cd C:\TOOLS\devportal\harp\windows
.\update-launcher.ps1
```

### 4. Configuration du serveur de développement

Le serveur est configuré pour écouter sur `192.168.1.48:3000` (voir `package.json`).

Pour modifier l'adresse IP :

```json
{
  "scripts": {
    "dev": "next dev --turbopack -H 192.168.1.48 -p 3000"
  }
}
```

### 5. Lancer l'application

```bash
# Mode développement
npm run dev

# Build de production
npm run build

# Démarrer en production
npm start
```

L'application sera accessible sur `http://192.168.1.48:3000`

---

## Gestion des utilisateurs

### Création d'un utilisateur

#### Via l'interface web

1. Accéder à `/register`
2. Remplir le formulaire :
   - **NetID** : Identifiant unique (ex: `hitomba`)
   - **Email** : Adresse email
   - **Mot de passe** : Mot de passe sécurisé

#### Via l'API de test

Accéder à `/test-login` pour créer un utilisateur rapidement.

#### Via script

```typescript
// scripts/create-user-hitomba.ts
// Exécuter avec: npx ts-node scripts/create-user-hitomba.ts
```

### Attributs utilisateur

Chaque utilisateur possède :
- **netid** : Identifiant unique (utilisé pour la connexion)
- **email** : Adresse email
- **password** : Mot de passe hashé (bcrypt)
- **pkeyfile** : Chemin vers la clé SSH privée (pour PuTTY)
- **role** : Rôle par défaut (USER, ADMIN, etc.)
- **lastlogin** : Date de dernière connexion

### Gestion des rôles

Les rôles sont définis dans `prisma/schema.prisma` :

```prisma
enum UserRole {
  ADMIN
  USER
  PSADMIN
  TMA_LOCAL
  TMA_OFFSHORE
  PORTAL_ADMIN
  PORTAL_SECURITY
  // ... autres rôles
}
```

#### Assigner un rôle à un utilisateur

Via la base de données :

```sql
-- Vérifier l'ID de l'utilisateur
SELECT id, netid FROM User WHERE netid = 'hitomba';

-- Vérifier l'ID du rôle
SELECT id, role FROM harproles WHERE role = 'ADMIN';

-- Assigner le rôle
INSERT INTO harpuseroles (userId, roleId, datmaj)
VALUES (1, 1, NOW());
```

### Permissions des routes

Les routes sont définies dans `routes.ts` :

- **publicRoutes** : Accessibles sans authentification (`/`, `/test-login`)
- **authRoutes** : Routes d'authentification (`/login`, `/register`)
- **Routes protégées** : Toutes les autres routes nécessitent une authentification

Le middleware (`middleware.ts`) gère automatiquement les redirections.

---

## Gestion des environnements

### Structure des données

Un environnement (`envsharp`) contient :
- **env** : Nom de l'environnement (unique)
- **aliasql** : Alias SQL*Net
- **oraschema** : Schéma Oracle
- **orarelease** : Version Oracle
- **psversion** : Version PeopleSoft
- **harprelease** : Version HARP
- **url** : URL de l'environnement
- **statenvId** : Statut de l'environnement

### Ajouter un environnement

#### Via l'interface admin

Accéder à `/admin` (nécessite le rôle ADMIN ou PORTAL_ADMIN).

#### Via la base de données

```sql
-- Créer un environnement
INSERT INTO envsharp (env, aliasql, oraschema, psversion, harprelease, url)
VALUES ('DEV01', 'DEV01', 'PS', '9.2', 'HARP_2024', 'http://dev01.example.com');
```

### Liaison environnement/serveur

```sql
-- Récupérer les IDs
SELECT id FROM envsharp WHERE env = 'DEV01';
SELECT id FROM harpserve WHERE srv = 'SRV01';

-- Créer la liaison
INSERT INTO harpenvserv (envId, serverId, typsrv, status)
VALUES (1, 1, 'APP', 0);
```

### Statuts des environnements

Les statuts sont définis dans la table `statutenv` :
- **0** : Inactif
- **4** : Disponible
- **8** : En maintenance
- etc.

---

## Configuration du protocole mylaunch://

### Applications supportées

Le launcher PowerShell (`windows/launcher/launcher.ps1`) supporte :

- **putty** : PuTTY (SSH client)
- **sqldeveloper** : SQL Developer
- **sqlplus** : SQL*Plus
- **pside** : PeopleSoft IDE
- **psdmt** : PeopleSoft Data Mover
- **pscfg** : PeopleSoft Configuration Manager
- **filezilla** : FileZilla FTP Client
- **winscp** : WinSCP
- **winmerge** : WinMerge
- **perl** : Perl

### Ajouter une nouvelle application

1. **Éditer `windows/launcher/launcher.ps1`** :

```powershell
$allowed = @{
    # ... applications existantes ...
    'nouvelleapp' = @{ 
        Path = 'C:\\Chemin\\Vers\\app.exe'
        BuildArgs = { param($q) 
            # Construire les arguments
            $args = @()
            if ($q.host) { $args += "-host"; $args += $q.host }
            return $args
        }
    }
}
```

2. **Mettre à jour `lib/mylaunch.ts`** :

```typescript
export type ExternalTool = 
    | 'putty' 
    | 'sqldeveloper'
    | 'nouvelleapp'  // Ajouter ici
    // ...
```

3. **Mettre à jour le launcher installé** :

```powershell
.\update-launcher.ps1
```

### Utilisation dans l'application

#### Composants disponibles

- **PuttyLink** : Lance PuTTY avec les paramètres de session
- **SQLDeveloperLink** : Lance SQL Developer
- **SQLPlusLink** : Lance SQL*Plus
- **PSDMTLink** : Lance PSDMT
- **FileZillaLink** : Lance FileZilla

#### Exemple d'utilisation

```tsx
import { PuttyLink } from '@/components/harp/PuttyLink';

<PuttyLink 
  host="192.168.1.49"
  className="text-blue-500 hover:underline"
>
  Se connecter au serveur
</PuttyLink>
```

### Mode développement vs production

Le système détecte automatiquement l'environnement :

- **Développement** (`NEXT_PUBLIC_DEV_MODE="true"`) :
  - Utilise `netid="hubert"` par défaut
  - Ignore la clé SSH (`pkeyfile`)

- **Production** (`NEXT_PUBLIC_DEV_MODE="false"`) :
  - Utilise le `netid` et `pkeyfile` de la session utilisateur
  - Paramètres récupérés depuis la base de données

### Configuration du navigateur

Pour éviter la boîte de dialogue de confirmation :

#### Edge/Chrome via GPO

1. **Edge** :
   - `Computer Configuration > Administrative Templates > Microsoft Edge`
   - Activer : `ExternalProtocolDialogShowAlwaysOpenCheckbox`
   - Configurer : `AutoLaunchProtocolsFromOrigins`

2. **Chrome** :
   - Même configuration dans `Google > Google Chrome`

#### Via registre (si GPO non disponible)

```reg
[HKEY_LOCAL_MACHINE\SOFTWARE\Policies\Microsoft\Edge]
"ExternalProtocolDialogShowAlwaysOpenCheckbox"=dword:00000001
```

---

## Maintenance et dépannage

### Logs

#### Logs de l'application

Les logs Next.js s'affichent dans la console où l'application est lancée.

#### Logs du launcher PowerShell

Les logs sont écrits dans :
```
C:\apps\portail\launcher\logs\launcher.log
```

### Problèmes courants

#### 1. Erreur "Host is not allowed to connect"

**Cause** : MariaDB n'autorise pas les connexions depuis votre machine.

**Solution** :
```sql
GRANT ALL PRIVILEGES ON mars.* TO 'root'@'%' IDENTIFIED BY 'axel2014';
FLUSH PRIVILEGES;
```

Si le problème persiste, activer `skip-name-resolve` dans MariaDB.

#### 2. Le protocole mylaunch:// ne fonctionne pas

**Vérifications** :
1. Le protocole est installé :
   ```powershell
   Get-ItemProperty HKCR:\mylaunch
   ```

2. Le script launcher existe :
   ```powershell
   Test-Path "C:\apps\portail\launcher\launcher.ps1"
   ```

3. Tester manuellement :
   ```powershell
   .\C:\apps\portail\launcher\launcher.ps1 "mylaunch://putty?host=test"
   ```

#### 3. PuTTY utilise les mauvais paramètres en mode dev

**Cause** : `NEXT_PUBLIC_DEV_MODE` n'est pas défini ou mal configuré.

**Solution** : Vérifier le fichier `.env` :
```env
NEXT_PUBLIC_DEV_MODE="true"  # Pour le développement
```

#### 4. Erreur "MissingSecret" NextAuth

**Cause** : `AUTH_SECRET` manquant ou mal formaté dans `.env`.

**Solution** :
```env
AUTH_SECRET="votre-secret-aleatoire-tres-long"
# Pas de guillemets autour de la valeur
```

#### 5. Erreur Prisma "client not initialized"

**Solution** :
```bash
npx prisma generate
```

#### 6. Erreur de build Next.js

**Vérifications** :
- Erreurs TypeScript : Vérifier `tsconfig.json`
- Erreurs ESLint : Vérifier `eslint.config.mjs`
- Erreurs de syntaxe JSX : Vérifier les composants React

Le fichier `next.config.ts` ignore les erreurs de build pour permettre le développement, mais il est recommandé de les corriger.

### Sauvegarde de la base de données

```bash
# Exporter
mysqldump -u root -p mars > backup_$(date +%Y%m%d).sql

# Importer
mysql -u root -p mars < backup_20241106.sql
```

### Mise à jour de l'application

```bash
# Mettre à jour les dépendances
npm update

# Régénérer Prisma
npx prisma generate

# Rebuild
npm run build
```

---

## Sécurité

### Bonnes pratiques

1. **Secrets** :
   - Ne jamais commiter le fichier `.env`
   - Utiliser des secrets forts pour `AUTH_SECRET`
   - Changer les mots de passe par défaut

2. **Base de données** :
   - Limiter les privilèges des utilisateurs
   - Utiliser des comptes dédiés (pas `root` en production)
   - Activer le chiffrement SSL si possible

3. **Authentification** :
   - Mots de passe hashés avec bcrypt (10 rounds)
   - Sessions JWT avec expiration
   - Validation des entrées utilisateur (Zod)

4. **Protocole mylaunch://** :
   - Whitelist stricte des applications autorisées
   - Validation des arguments
   - Journalisation des lancements

### Audit de sécurité

#### Vérifier les utilisateurs actifs

```sql
SELECT id, netid, email, lastlogin, createdAt 
FROM User 
WHERE lastlogin > DATE_SUB(NOW(), INTERVAL 30 DAY)
ORDER BY lastlogin DESC;
```

#### Vérifier les permissions

```sql
-- Utilisateurs avec rôle ADMIN
SELECT u.netid, u.email, r.role, r.descr
FROM User u
JOIN harpuseroles ur ON u.id = ur.userId
JOIN harproles r ON ur.roleId = r.id
WHERE r.role = 'ADMIN';
```

### Recommandations pour la production

1. **Variables d'environnement** :
   - Utiliser un gestionnaire de secrets (Azure Key Vault, AWS Secrets Manager)
   - Ne jamais exposer les secrets dans le code

2. **HTTPS** :
   - Configurer SSL/TLS
   - Utiliser un reverse proxy (nginx, IIS)

3. **Monitoring** :
   - Configurer des logs centralisés
   - Surveiller les erreurs et les tentatives de connexion

4. **Backup** :
   - Automatiser les sauvegardes de la base de données
   - Tester les restaurations régulièrement

---

## Annexes

### A. Structure des rôles

| Rôle | Description | Accès |
|------|-------------|-------|
| ADMIN | Administrateur système | Tous les accès |
| USER | Utilisateur standard | Accès lecture |
| PORTAL_ADMIN | Administrateur du portail | Gestion utilisateurs, environnements |
| PORTAL_SECURITY | Sécurité | Gestion des rôles et permissions |
| PSADMIN | Administrateur PeopleSoft | Accès aux outils PeopleSoft |
| TMA_LOCAL | TMA locale | Accès aux environnements locaux |
| TMA_OFFSHORE | TMA offshore | Accès limité |

### B. Chemins par défaut des applications

| Application | Chemin par défaut |
|------------|-------------------|
| PuTTY | `C:\Program Files\PuTTY\putty.exe` |
| SQL Developer | `C:\apps\sqldeveloper\sqldeveloper.exe` |
| SQL*Plus | `C:\oracle\product\19.0.0\dbhome_1\bin\sqlplus.exe` |
| PSDMT | `C:\Program Files\PeopleSoft\psdmt.exe` |
| PSCFG | `C:\Program Files\PeopleSoft\pscfg.exe` |
| FileZilla | `C:\Program Files\FileZilla FTP Client\filezilla.exe` |
| WinSCP | `C:\Program Files\WinSCP\WinSCP.exe` |
| WinMerge | `C:\Program Files\WinMerge\WinMergeU.exe` |
| Perl | `C:\Perl64\bin\perl.exe` |

### C. Commandes utiles

```bash
# Prisma
npx prisma studio              # Interface graphique pour la base de données
npx prisma migrate dev         # Créer une nouvelle migration
npx prisma migrate deploy      # Appliquer les migrations en production
npx prisma db push             # Pousser le schéma sans migration

# Next.js
npm run dev                    # Démarrer en développement
npm run build                  # Build de production
npm run start                  # Démarrer en production
npm run lint                   # Vérifier le code

# PowerShell (en tant qu'admin)
.\windows\install.ps1          # Installer le protocole mylaunch://
.\windows\update-launcher.ps1 # Mettre à jour le launcher
```

### D. Fichiers de configuration importants

- **`.env`** : Variables d'environnement
- **`package.json`** : Dépendances et scripts
- **`prisma/schema.prisma`** : Schéma de base de données
- **`next.config.ts`** : Configuration Next.js
- **`auth.ts`** : Configuration NextAuth
- **`routes.ts`** : Définition des routes publiques/protégées
- **`middleware.ts`** : Middleware d'authentification
- **`windows/launcher/launcher.ps1`** : Script PowerShell pour lancer les applications

### E. Support et contacts

Pour toute question ou problème :
1. Consulter les logs (`C:\apps\portail\launcher\logs\launcher.log`)
2. Vérifier la documentation dans `windows/INSTALLATION.md`
3. Examiner les erreurs dans la console du navigateur (F12)
4. Vérifier les logs Next.js dans le terminal

---

**Document généré le** : 2025-11-06  
**Version de l'application** : 0.1.0  
**Dernière mise à jour** : 2025-11-06

