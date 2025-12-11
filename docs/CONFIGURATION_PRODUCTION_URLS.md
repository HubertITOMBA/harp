# Configuration des URLs en Production

## Problème

En production, le navigateur essaie de se connecter à `localhost:9352` au lieu de l'URL de production, causant des erreurs `ERR_CONNECTION_REFUSED`.

## Solution

### 1. Variables d'environnement requises

Ajoutez ces variables dans votre fichier `.env` en production :

```env
# URL de base de l'application (sans slash final)
# HTTPS est maintenant activé par défaut (certificats installés)
AUTH_URL=https://portails.orange-harp.fr:9352
# Si vous utilisez encore HTTP (non recommandé) :
# AUTH_URL=http://portails.orange-harp.fr:9352

# URL publique du serveur (pour Next.js RSC)
# HTTPS est maintenant activé par défaut (certificats installés)
NEXT_PUBLIC_SERVER_URL=https://portails.orange-harp.fr:9352
# Si vous utilisez encore HTTP (non recommandé) :
# NEXT_PUBLIC_SERVER_URL=http://portails.orange-harp.fr:9352

# Trust host (requis pour NextAuth en production)
AUTH_TRUST_HOST=true
```

### 2. Configuration Next.js (optionnel mais recommandé)

Si le problème persiste, ajoutez dans `next.config.ts` :

```typescript
const nextConfig: NextConfig = {
  // ... autres configurations
  
  // Configuration pour la production
  env: {
    NEXT_PUBLIC_SERVER_URL: process.env.NEXT_PUBLIC_SERVER_URL || 'https://portails.orange-harp.fr:9352',
  },
  
  // Si vous utilisez un reverse proxy
  // basePath: '', // Si votre app est à la racine
  // trailingSlash: false,
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
      AUTH_URL: 'http://portails.orange-harp.fr:9352',
      NEXT_PUBLIC_SERVER_URL: 'http://portails.orange-harp.fr:9352',
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
Environment="AUTH_URL=http://portails.orange-harp.fr:9352"
Environment="NEXT_PUBLIC_SERVER_URL=http://portails.orange-harp.fr:9352"
Environment="AUTH_TRUST_HOST=true"
ExecStart=/usr/bin/npm start
Restart=always

[Install]
WantedBy=multi-user.target
```

## Notes importantes

- **AUTH_URL** : Utilisé par NextAuth pour générer les URLs de callback
- **NEXT_PUBLIC_SERVER_URL** : Utilisé par Next.js pour les requêtes RSC côté client
- **AUTH_TRUST_HOST** : Doit être `true` en production pour que NextAuth accepte l'host
- Les variables `NEXT_PUBLIC_*` sont exposées au client, ne pas y mettre de secrets
- Après modification des variables d'environnement, **toujours redémarrer l'application**

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

