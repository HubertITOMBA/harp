# Configuration des URLs en Production

> **Protocole** : L'application est configurée pour **HTTP uniquement** (pas de HTTPS). Voir [`docs/CONFIGURATION_HTTP_UNIQUEMENT.md`](CONFIGURATION_HTTP_UNIQUEMENT.md) pour les détails.

## Problème

En production, le navigateur essaie de se connecter à `localhost:9352` au lieu de l'URL de production, causant des erreurs `ERR_CONNECTION_REFUSED`.

## Solution

### 1. Variables d'environnement requises

Ajoutez ces variables dans votre fichier `.env` en production. **Toutes les URLs doivent être en HTTP** (`http://`) :

```env
# URL de base de l'application (sans slash final) - HTTP uniquement
AUTH_URL="http://votre-serveur:9352"
# Exemple : AUTH_URL="http://portails.orange-harp.fr:9352"

# URL publique du serveur (pour Next.js RSC) - même valeur que AUTH_URL
NEXT_PUBLIC_SERVER_URL="http://votre-serveur:9352"

# Trust host (requis pour NextAuth en production)
AUTH_TRUST_HOST=true
```

### 2. Configuration Next.js (optionnel mais recommandé)

Si le problème persiste, ajoutez dans `next.config.ts` (en gardant des URLs **HTTP**) :

```typescript
const nextConfig: NextConfig = {
  // ... autres configurations
  
  env: {
    NEXT_PUBLIC_SERVER_URL: process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:9352',
  },
};
```

### 3. Vérification

Après avoir configuré les variables d'environnement :

1. **Redémarrer l'application** :
   ```bash
   # Arrêter l'application
   pm2 stop harp
   # ou
   systemctl stop harp
   
   # Redémarrer
   pm2 start harp
   # ou
   systemctl start harp
   ```

2. **Vérifier les variables d'environnement** :
   ```bash
   # Vérifier que les variables sont bien chargées
   echo $AUTH_URL
   echo $NEXT_PUBLIC_SERVER_URL
   ```

3. **Tester dans le navigateur** :
   - Ouvrir la console développeur (F12)
   - Vérifier que les requêtes utilisent l'URL de production et non `localhost:9352`

### 4. Configuration PM2 (si utilisé)

Si vous utilisez PM2, créez un fichier `ecosystem.config.js` :

```javascript
module.exports = {
  apps: [{
    name: 'harp',
    script: 'npm',
    args: 'start',
    env: {
      NODE_ENV: 'production',
      AUTH_URL: 'http://votre-serveur:9352',
      NEXT_PUBLIC_SERVER_URL: 'http://votre-serveur:9352',
      AUTH_TRUST_HOST: 'true',
      // ... autres variables
    }
  }]
};
```

### 5. Configuration systemd (si utilisé)

Dans votre fichier de service systemd (ex: `/etc/systemd/system/harp.service`) :

```ini
[Unit]
Description=HARP Portal
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/harp
Environment="NODE_ENV=production"
Environment="AUTH_URL=http://votre-serveur:9352"
Environment="NEXT_PUBLIC_SERVER_URL=http://votre-serveur:9352"
Environment="AUTH_TRUST_HOST=true"
ExecStart=/usr/bin/npm start
Restart=always

[Install]
WantedBy=multi-user.target
```

## Notes importantes

- **Protocole HTTP uniquement** : l'application n'utilise pas HTTPS. Voir [`CONFIGURATION_HTTP_UNIQUEMENT.md`](CONFIGURATION_HTTP_UNIQUEMENT.md).
- **AUTH_URL** : Doit être **exactement** l’URL affichée dans le navigateur (même hôte et port). Sinon, la session peut être ignorée par le middleware et les liens (ex. Paramètres → /settings) rediriger vers la page de connexion, et **erreur CORS sur la déconnexion** (redirection vers localhost bloquée). Détails : dépannage « Erreur CORS sur la déconnexion » dans [`CONFIGURATION_HTTP_UNIQUEMENT.md`](CONFIGURATION_HTTP_UNIQUEMENT.md). Utilisé par NextAuth pour les callbacks et les cookies (toujours en `http://`).
- **NEXT_PUBLIC_SERVER_URL** : Utilisé par Next.js pour les requêtes RSC côté client.
- **AUTH_TRUST_HOST** : Doit être `true` en production pour que NextAuth accepte l'host.
- Les variables `NEXT_PUBLIC_*` sont exposées au client, ne pas y mettre de secrets.
- Après modification des variables d'environnement, **toujours redémarrer l'application**.

## Dépannage

Si le problème persiste après configuration :

1. Vérifier que le serveur écoute sur le bon port :
   ```bash
   netstat -tlnp | grep 9352
   ```

2. Vérifier les logs de l'application :
   ```bash
   pm2 logs harp
   # ou
   journalctl -u harp -f
   ```

3. Vérifier que les variables sont bien chargées au démarrage :
   ```bash
   # Dans les logs, chercher les variables d'environnement
   ```

4. Vider le cache du navigateur et tester en navigation privée

