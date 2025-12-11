# Configuration pour les Tests Locaux

## Configuration pour développement local

Si vous testez l'application en local sur `localhost:9352`, voici la configuration à utiliser.

### 1. Créer le fichier `.env.local`

Créez un fichier `.env.local` à la racine du projet (ce fichier sera ignoré par Git) :

```env
# ============================================
# AUTHENTIFICATION (OBLIGATOIRE)
# ============================================

# URL de base de l'application en local
AUTH_URL=http://localhost:9352

# URL publique du serveur (pour Next.js RSC) - OBLIGATOIRE pour le build
NEXT_PUBLIC_SERVER_URL=http://localhost:9352

# Trust host (requis pour NextAuth)
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

# ============================================
# ENVIRONNEMENT
# ============================================

# Environnement d'exécution (development pour local)
NODE_ENV=development
```

### 2. Vérifier les variables

```powershell
# Windows PowerShell
npm run check-env
```

### 3. Build en mode développement

Pour les tests locaux, vous pouvez utiliser le mode développement (pas de build nécessaire) :

```powershell
npm run dev
```

Ou si vous voulez tester le build de production en local :

```powershell
npm run build
npm start
```

## Différences entre local et production

| Variable | Local | Production |
|----------|-------|------------|
| `AUTH_URL` | `http://localhost:9352` | `http://portails.orange-harp.fr:9352` |
| `NEXT_PUBLIC_SERVER_URL` | `http://localhost:9352` | `http://portails.orange-harp.fr:9352` |
| `NODE_ENV` | `development` | `production` |

## Fichiers d'environnement

Next.js charge les fichiers d'environnement dans cet ordre (le dernier écrase les précédents) :

1. `.env` - Variables partagées
2. `.env.local` - Variables locales (ignoré par Git)
3. `.env.development` - Variables pour le mode développement
4. `.env.production` - Variables pour le mode production

**Recommandation** :
- Utilisez `.env.local` pour vos tests locaux (ne sera pas commité)
- Utilisez `.env.production` pour la production (ou définissez les variables dans votre système de déploiement)

## Vérification après démarrage

1. **Vérifier les cookies** :
   - Ouvrir la console développeur (F12)
   - Aller dans Application > Cookies
   - Vérifier que les cookies NextAuth sont présents sur `localhost:9352`

2. **Vérifier les requêtes réseau** :
   - Ouvrir l'onglet Network
   - Naviguer dans l'application
   - Vérifier que les requêtes RSC utilisent `http://localhost:9352` et non `:9352`

3. **Tester la navigation** :
   - Se connecter
   - Naviguer vers différentes pages
   - Vérifier qu'il n'y a pas de redirection vers login à chaque clic

## Problèmes courants en local

### Les requêtes utilisent `:9352` au lieu de `http://localhost:9352`

**Cause** : `NEXT_PUBLIC_SERVER_URL` n'est pas défini ou le build a été fait sans cette variable.

**Solution** :
1. Vérifier que `.env.local` contient `NEXT_PUBLIC_SERVER_URL=http://localhost:9352`
2. Rebuild : `npm run build`
3. Redémarrer : `npm start`

### Chaque clic redirige vers la page de login

**Cause** : Les cookies ne sont pas correctement configurés ou la session n'est pas persistée.

**Solution** :
1. Vérifier que `AUTH_URL` et `AUTH_TRUST_HOST=true` sont définis
2. Vider le cache du navigateur (Ctrl+Shift+Delete)
3. Tester en navigation privée
4. Vérifier les cookies dans Application > Cookies

### Erreur "AUTH_SECRET is missing"

**Cause** : Le secret d'authentification n'est pas défini.

**Solution** :
1. Générer un secret : `openssl rand -base64 32` ou https://generate-secret.vercel.app/32
2. Ajouter `AUTH_SECRET=votre-secret` dans `.env.local`
3. Redémarrer l'application

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

