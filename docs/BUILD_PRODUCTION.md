# Build et Déploiement en Production

## Problème : Erreurs 404 sur les routes RSC

Si vous voyez des erreurs comme :
```
:9352/harp/envs?_rsc=1kmhl:1 Failed to load resource: the server responded with a status of 404 (Not Found)
:9352/profile?_rsc=17hqa:1 Failed to load resource: the server responded with a status of 404 (Not Found)
```

Cela signifie que le build a été fait **sans** les variables d'environnement de production définies.

## Solution : Rebuild avec les bonnes variables

### ⚡ Solution rapide (recommandée)

Utilisez le script de rebuild automatique qui fait tout pour vous :

```bash
npm run rebuild:production
```

Ce script :
- ✅ Vérifie que toutes les variables d'environnement sont définies
- ✅ Supprime automatiquement le dossier `.next`
- ✅ Rebuild avec les bonnes variables
- ✅ Vérifie que le build utilise les bonnes URLs

### Solution manuelle

Si vous préférez faire le rebuild manuellement :

### 1. Définir les variables d'environnement AVANT le build

**IMPORTANT** : Les variables `NEXT_PUBLIC_*` doivent être définies **au moment du build**, pas seulement au runtime.

Créez un fichier `.env.production` ou définissez les variables dans votre environnement :

```env
# URL de base de l'application (sans slash final)
# HTTPS est maintenant activé par défaut (certificats installés)
AUTH_URL=https://portails.orange-harp.fr:9352

# URL publique du serveur (pour Next.js RSC) - OBLIGATOIRE pour le build
# HTTPS est maintenant activé par défaut (certificats installés)
NEXT_PUBLIC_SERVER_URL=https://portails.orange-harp.fr:9352

# Trust host (requis pour NextAuth en production)
AUTH_TRUST_HOST=true

# Secret pour chiffrer les sessions (obligatoire)
AUTH_SECRET=votre-secret-très-long-et-aléatoire

# ... autres variables
```

### 2. Build avec les variables définies

**Sur Windows (PowerShell)** :
```powershell
# Définir les variables pour cette session
$env:AUTH_URL="https://portails.orange-harp.fr:9352"
$env:NEXT_PUBLIC_SERVER_URL="https://portails.orange-harp.fr:9352"
$env:AUTH_TRUST_HOST="true"
$env:AUTH_SECRET="votre-secret"

# Build
npm run build
```

**Sur Linux/Mac** :
```bash
# Définir les variables pour cette session
export AUTH_URL="https://portails.orange-harp.fr:9352"
export NEXT_PUBLIC_SERVER_URL="https://portails.orange-harp.fr:9352"
export AUTH_TRUST_HOST="true"
export AUTH_SECRET="votre-secret"

# Build
npm run build
```

**Avec un fichier .env.production** :
```bash
# Créer .env.production avec les variables
# Next.js chargera automatiquement ce fichier lors du build en production
npm run build
```

### 3. Vérifier que le build utilise les bonnes URLs

Après le build, vérifiez dans `.next/server/app-paths-manifest.json` ou dans les fichiers générés que les URLs utilisent bien `https://portails.orange-harp.fr:9352` et non `localhost:9352`.

### 4. Déployer et démarrer

```bash
# Démarrer l'application
npm start
# ou
pm2 start npm --name "harp" -- start
```

## Pourquoi c'est important ?

Next.js génère les URLs RSC (React Server Components) **au moment du build**. Ces URLs sont ensuite utilisées côté client pour charger les composants serveur.

Si `NEXT_PUBLIC_SERVER_URL` n'est pas défini au moment du build :
- Next.js génère des URLs relatives (`:9352/...`) qui ne fonctionnent pas
- Les requêtes RSC échouent avec des erreurs 404
- L'application redirige vers la page de login à chaque clic

## Configuration PM2 avec variables d'environnement

Si vous utilisez PM2, créez un fichier `ecosystem.config.js` :

```javascript
module.exports = {
  apps: [{
    name: 'harp',
    script: 'npm',
    args: 'start',
    env: {
      NODE_ENV: 'production',
      AUTH_URL: 'https://portails.orange-harp.fr:9352',
      NEXT_PUBLIC_SERVER_URL: 'https://portails.orange-harp.fr:9352',
      AUTH_TRUST_HOST: 'true',
      AUTH_SECRET: 'votre-secret',
      // ... autres variables
    }
  }]
};
```

Puis build et démarrez :
```bash
# Build avec les variables définies
export NEXT_PUBLIC_SERVER_URL="https://portails.orange-harp.fr:9352"
npm run build

# Démarrer avec PM2
pm2 start ecosystem.config.js
```

## Vérification après déploiement

1. **Vérifier les cookies** :
   - Ouvrir la console développeur (F12)
   - Aller dans Application > Cookies
   - Vérifier que les cookies NextAuth sont présents

2. **Vérifier les requêtes réseau** :
   - Ouvrir l'onglet Network
   - Naviguer dans l'application
   - Vérifier que les requêtes RSC utilisent `https://portails.orange-harp.fr:9352` et non `:9352`

3. **Tester la navigation** :
   - Se connecter
   - Naviguer vers différentes pages
   - Vérifier qu'il n'y a pas de redirection vers login à chaque clic

## Dépannage

### Les erreurs 404 persistent après rebuild

1. Vider le cache du navigateur (Ctrl+Shift+Delete)
2. Vérifier que le build a bien utilisé les bonnes variables :
   ```bash
   # Chercher dans les fichiers générés
   grep -r "portails.orange-harp.fr" .next/
   ```
3. Vérifier que l'application utilise bien le build de production :
   ```bash
   # Vérifier que NODE_ENV=production
   echo $NODE_ENV
   ```

### Les URLs utilisent encore localhost:9352

1. Vérifier que `NEXT_PUBLIC_SERVER_URL` est bien défini avant le build
2. Vérifier que `.env.production` existe et contient les bonnes valeurs
3. Rebuild complètement :
   ```bash
   rm -rf .next
   npm run build
   ```

## Notes importantes

- **NEXT_PUBLIC_* variables** : Sont intégrées dans le bundle JavaScript au moment du build
- **Variables normales** : Peuvent être définies au runtime
- **Rebuild requis** : Si vous changez `NEXT_PUBLIC_SERVER_URL`, vous devez rebuild l'application
- **Cache du navigateur** : Vider le cache après un nouveau déploiement

