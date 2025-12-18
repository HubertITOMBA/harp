# Résolution des erreurs Jest Worker et WebSocket HMR en production

## Problème

En production, l'application affiche les erreurs suivantes :

1. **Jest worker error** :
   ```
   Uncaught Error: Jest worker encountered 2 child process exceptions, exceeding retry limit
   ```

2. **WebSocket HMR error** :
   ```
   WebSocket connection to 'wss://portails.orange-harp.fr:9052/_next/webpack-hmr' failed: 
   Error during WebSocket handshake: Unexpected response code: 404
   ```

## Causes

Ces erreurs indiquent que :

1. **L'application est lancée en mode développement** au lieu de production
2. **Les workers Next.js héritent de `NODE_OPTIONS`** depuis un processus parent (Dynatrace)
3. **Turbopack/HMR est actif** alors qu'il ne devrait pas l'être en production
4. **Le WebSocket HMR** tente de se connecter alors qu'il n'est pas disponible en production

## Solution

### 1. Utiliser le script de démarrage en production

**⚠️ IMPORTANT** : Ne jamais utiliser `npm start` directement en production. Utiliser les scripts dédiés :

**Sur Linux/Mac** :
```bash
npm run start:production
```

**Sur Windows (PowerShell)** :
```powershell
npm run start:production:ps1
```

Ces scripts :
- Forcent `NODE_ENV=production`
- Désactivent Dynatrace
- Nettoient `NODE_OPTIONS`
- Désactivent les workers Next.js (`NEXT_PRIVATE_WORKER=0`)
- Désactivent Turbopack (`NEXT_TURBOPACK=0`)
- Vérifient que le build existe avant de démarrer

### 2. Vérifier que le build est en mode production

Avant de démarrer, s'assurer que le build a été fait en mode production :

```bash
# Vérifier que NODE_ENV est défini
export NODE_ENV=production

# Build en production
npm run build

# Vérifier que le dossier .next existe
ls -la .next
```

### 3. Variables d'environnement requises

Les scripts de démarrage définissent automatiquement :

```bash
NODE_ENV=production
DT_DISABLE_INJECTION=true
DT_AGENT_DISABLED=true
DT_ONEAGENT_DISABLED=true
NODE_OPTIONS=""
NEXT_PRIVATE_WORKER=0
NEXT_PRIVATE_STANDALONE=true
NEXT_TURBOPACK=0
```

### 4. Vérifier le mode de l'application

Après le démarrage, vérifier dans les logs :

```
🚀 Démarrage de l'application HARP en PRODUCTION...
   Port: 9352
   Mode: Production
   Dynatrace: Désactivé
   Workers: Désactivés
   NODE_OPTIONS: vide
   NODE_ENV: production
```

### 5. Si l'erreur persiste

#### Vérifier que NODE_ENV est bien défini

```bash
# Dans le terminal où l'application tourne
echo $NODE_ENV
# Doit afficher: production
```

#### Vérifier que les workers sont désactivés

```bash
# Vérifier les variables d'environnement
env | grep NEXT_PRIVATE
# Doit afficher:
# NEXT_PRIVATE_WORKER=0
# NEXT_PRIVATE_STANDALONE=true
```

#### Vérifier que NODE_OPTIONS est vide

```bash
echo "NODE_OPTIONS: [$NODE_OPTIONS]"
# Doit afficher: NODE_OPTIONS: []
```

#### Redémarrer complètement l'application

1. Arrêter l'application (Ctrl+C)
2. Vérifier qu'aucun processus Node.js ne tourne :
   ```bash
   ps aux | grep node
   # ou sur Windows
   tasklist | findstr node
   ```
3. Tuer les processus si nécessaire
4. Relancer avec le script de production :
   ```bash
   npm run start:production
   ```

## Configuration PM2 (si utilisé)

Si vous utilisez PM2, créer un fichier `ecosystem.config.js` :

```javascript
module.exports = {
  apps: [{
    name: 'harp',
    script: 'npm',
    args: 'run start:production',
    env: {
      NODE_ENV: 'production',
      DT_DISABLE_INJECTION: 'true',
      DT_AGENT_DISABLED: 'true',
      DT_ONEAGENT_DISABLED: 'true',
      NODE_OPTIONS: '',
      NEXT_PRIVATE_WORKER: '0',
      NEXT_PRIVATE_STANDALONE: 'true',
      NEXT_TURBOPACK: '0',
      AUTH_URL: 'https://localhost:9352',
      NEXT_PUBLIC_SERVER_URL: 'https://localhost:9352',
      AUTH_TRUST_HOST: 'true',
    },
    // Désactiver le watch en production
    watch: false,
    // Redémarrer automatiquement en cas de crash
    autorestart: true,
    // Nombre max de redémarrages
    max_restarts: 10,
    // Délai entre les redémarrages
    min_uptime: '10s',
  }]
};
```

Puis démarrer avec :
```bash
pm2 start ecosystem.config.js
```

## Dépannage avancé

### Le WebSocket HMR continue d'essayer de se connecter

Cela indique que l'application pense être en mode développement. Vérifier :

1. Que `NODE_ENV=production` est défini **avant** le build
2. Que le build a été fait avec `npm run build` (pas `npm run dev`)
3. Que le dossier `.next` contient les fichiers de production (pas de fichiers de développement)

### Les workers continuent de s'exécuter

1. Vérifier que `NEXT_PRIVATE_WORKER=0` est défini
2. Vérifier que `experimental.workerThreads: false` est dans `next.config.ts`
3. Redémarrer complètement l'application

### Dynatrace continue d'injecter NODE_OPTIONS

1. Vérifier que les variables `DT_*` sont bien définies
2. Vérifier que `NODE_OPTIONS` est bien vidé dans le script de démarrage
3. Si le problème persiste, contacter l'équipe infrastructure pour désactiver Dynatrace pour cette application

## Notes importantes

- **Ne jamais utiliser `npm start` directement** en production sans les variables d'environnement appropriées
- **Toujours utiliser les scripts `start:production`** qui gèrent automatiquement toutes les configurations
- **Le WebSocket HMR n'est disponible qu'en développement** - les erreurs 404 sont normales si l'application est en production
- **Les workers Next.js sont désactivés en production** pour éviter les problèmes avec Dynatrace et NODE_OPTIONS

## Références

- `scripts/start-production.sh` : Script de démarrage Linux/Mac
- `scripts/start-production.ps1` : Script de démarrage Windows
- `docs/RESOLUTION_ERREURS_HARP_ENVS.md` : Documentation sur les erreurs Dynatrace
- `next.config.ts` : Configuration Next.js avec `workerThreads: false`

