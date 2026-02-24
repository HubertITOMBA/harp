# Création du fichier .env

## Problème

Si vous voyez des erreurs comme :
- `Failed to load resource: the server responded with a status of 404`
- Chaque clic redirige vers la page de login
- Les requêtes utilisent `localhost:9352` au lieu de l'URL de production

Cela signifie que les variables d'environnement ne sont pas définies.

## Solution : Créer le fichier .env

### Choix du fichier d'environnement

- **Pour les tests locaux** : Utilisez `.env.local` (voir `docs/CONFIGURATION_LOCAL.md`)
- **Pour la production** : Utilisez `.env` ou `.env.production`

### 1. Créer le fichier `.env` à la racine du projet

Créez un fichier nommé `.env` (sans extension) à la racine du projet `C:\TOOLS\devportal\harp\.env`

### 2. Ajouter les variables requises

**Pour la production**, copiez ce contenu dans votre fichier `.env` et adaptez les valeurs. L'application est configurée pour **HTTP uniquement** (voir [`CONFIGURATION_HTTP_UNIQUEMENT.md`](CONFIGURATION_HTTP_UNIQUEMENT.md)) :

```env
# ============================================
# AUTHENTIFICATION (OBLIGATOIRE)
# ============================================

# URL de base de l'application (sans slash final) - HTTP uniquement
AUTH_URL="http://localhost:9352"
# En production : AUTH_URL="http://votre-serveur:9352"

# URL publique du serveur (pour Next.js RSC) - OBLIGATOIRE pour le build
# Doit être identique à AUTH_URL
NEXT_PUBLIC_SERVER_URL="http://localhost:9352"

# Trust host (requis pour NextAuth en production)
AUTH_TRUST_HOST=true

# Secret pour chiffrer les sessions (obligatoire)
# Générez un secret aléatoire avec : openssl rand -base64 32
# Ou utilisez un générateur en ligne : https://generate-secret.vercel.app/32
AUTH_SECRET=votre-secret-très-long-et-aléatoire-ici

# ============================================
# BASE DE DONNÉES (OBLIGATOIRE)
# ============================================

# URL de connexion à la base de données PostgreSQL
# Remplacez user, password, localhost, 5432 et harp par vos valeurs
DATABASE_URL="postgresql://user:password@localhost:5432/harp?schema=public"

# ============================================
# CONFIGURATION EMAIL (OPTIONNEL)
# ============================================

# Serveur SMTP
MAIL_HOST=smtp.example.com
MAIL_PORT=25
MAIL_USER=
MAIL_PASSWORD=
MAIL_SECURE=false
MAIL_REQUIRE_TLS=false
MAIL_IGNORE_TLS_ERRORS=false

# Adresse email expéditrice
MAIL_FROM=noreply@example.com

# Utiliser sendmail au lieu de SMTP (Linux uniquement)
# USE_SENDMAIL=true
# SENDMAIL_PATH=/usr/sbin/sendmail

# ============================================
# ENVIRONNEMENT
# ============================================

# Environnement d'exécution (development, production, test)
NODE_ENV=production
```

### 3. Vérifier les variables

Avant de rebuild, vérifiez que les variables sont bien définies :

```powershell
# Windows PowerShell
npm run check-env
```

Si des variables sont manquantes, le script vous indiquera lesquelles.

### 4. Rebuild l'application

**IMPORTANT** : Les variables `NEXT_PUBLIC_*` doivent être définies **avant** le build.

```powershell
# Windows PowerShell
npm run build
```

Ou avec vérification automatique :

```powershell
npm run build:check
```

### 5. Redémarrer l'application

```powershell
npm start
```

## Vérification après déploiement

1. **Vérifier les cookies** :
   - Ouvrir la console développeur (F12)
   - Aller dans Application > Cookies
   - Vérifier que les cookies NextAuth sont présents

2. **Vérifier les requêtes réseau** :
   - Ouvrir l'onglet Network
   - Naviguer dans l'application
   - Vérifier que les requêtes RSC utilisent `https://localhost:9352` et non `:9352` ou `localhost:9352`

3. **Tester la navigation** :
   - Se connecter
   - Naviguer vers différentes pages
   - Vérifier qu'il n'y a pas de redirection vers login à chaque clic

## Notes importantes

- Le fichier `.env` ne doit **JAMAIS** être commité dans Git (il est dans `.gitignore`)
- Les variables `NEXT_PUBLIC_*` sont exposées au client, ne pas y mettre de secrets
- Après modification des variables d'environnement, **toujours rebuild et redémarrer** l'application
- En production, assurez-vous que le fichier `.env` existe sur le serveur avec les bonnes valeurs

## Génération d'un AUTH_SECRET

**Sur Windows (PowerShell)** :
```powershell
# Générer un secret aléatoire de 32 caractères
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})
```

**Sur Linux/Mac** :
```bash
openssl rand -base64 32
```

**En ligne** :
https://generate-secret.vercel.app/32

