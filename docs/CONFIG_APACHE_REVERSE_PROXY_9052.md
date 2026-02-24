# Configuration Apache Reverse Proxy - Port 9352

## Architecture

- **Next.js** : Écoute sur le port **9352** (ou 3000 si derrière Apache, voir ci‑dessous)
- **Apache** (optionnel) : Reverse proxy sur le port **9352** → redirige vers `localhost:3000` (si Next.js est en 3000)
- **Sans Apache** : Next.js écoute directement sur le port **9352** (recommandé)

## Configuration Apache

### 1. Créer le fichier de configuration Apache

Créez le fichier `/etc/apache2/sites-available/harp-portal.conf` :

```apache
<VirtualHost *:9352>
    ServerName localhost
    ServerAlias *

    # Configuration du reverse proxy vers Next.js (écoutant sur 3000 dans ce cas)
    ProxyPreserveHost On
    ProxyRequests Off
    
    ProxyPass / http://127.0.0.1:3000/
    ProxyPassReverse / http://127.0.0.1:3000/
    
    RequestHeader set X-Forwarded-Proto "http"
    RequestHeader set X-Forwarded-Port "9352"
    
    RewriteEngine On
    RewriteCond %{HTTP:Upgrade} =websocket [NC]
    RewriteRule /(.*) ws://127.0.0.1:3000/$1 [P,L]
    RewriteCond %{HTTP:Upgrade} !=websocket [NC]
    RewriteRule /(.*) http://127.0.0.1:3000/$1 [P,L]
</VirtualHost>
```

### 2. Activer les modules Apache nécessaires

```bash
sudo a2enmod proxy
sudo a2enmod proxy_http
sudo a2enmod rewrite
sudo a2enmod headers
sudo systemctl restart apache2
```

### 3. Activer le site

```bash
sudo a2ensite harp-portal.conf
sudo systemctl reload apache2
```

### 4. Configuration du port 9352 dans Apache

Si Apache n'écoute pas par défaut sur le port 9352, ajoutez-le dans `/etc/apache2/ports.conf` :

```apache
Listen 80
Listen 443
Listen 9352
```

Puis redémarrez Apache :

```bash
sudo systemctl restart apache2
```

## Configuration HTTPS (optionnel)

Si vous souhaitez utiliser HTTPS sur le port 9352 :

### 1. Installer Certbot (si pas déjà fait)

```bash
sudo apt update
sudo apt install certbot python3-certbot-apache
```

### 2. Générer le certificat SSL

```bash
sudo certbot --apache -d votre-domaine.com
```

### 3. Configuration Apache avec HTTPS

```apache
<VirtualHost *:9352>
    ServerName votre-domaine.com
    
    SSLEngine On
    SSLCertificateFile /etc/letsencrypt/live/votre-domaine.com/fullchain.pem
    SSLCertificateKeyFile /etc/letsencrypt/live/votre-domaine.com/privkey.pem
    
    # Configuration du reverse proxy
    ProxyPreserveHost On
    ProxyRequests Off
    ProxyPass / http://127.0.0.1:3000/
    ProxyPassReverse / http://127.0.0.1:3000/
    
    # Headers nécessaires
    RequestHeader set X-Forwarded-Proto "https"
    RequestHeader set X-Forwarded-Port "9352"
</VirtualHost>
```

### 4. Activer le module SSL

```bash
sudo a2enmod ssl
sudo systemctl restart apache2
```

## Vérification

### 1. Vérifier que Next.js écoute sur le port 9352

Lorsque vous démarrez Next.js avec `npm run start`, vous verrez un message comme :

```
▲ Next.js 15.5.9
- Local:        http://localhost:9352
- Network:      http://10.173.8.125:9352

✓ Starting...
✓ Ready in 1219ms
```

**⚠️ Ce message est normal et informatif** - Il indique simplement où Next.js écoute en interne. Cela ne signifie **PAS** que les utilisateurs doivent accéder directement à ce port.

- **Local** : Accès depuis la machine locale uniquement
- **Network** : Adresse IP de la machine sur le réseau local (pour information)

**Sans Apache** : les utilisateurs accèdent directement à Next.js sur le port **9352**. **Avec Apache** : ils accèdent à Apache sur 9352, qui proxy vers Next.js (sur 3000 dans ce cas).

Pour vérifier que Next.js écoute bien :

```bash
netstat -tlnp | grep 9352
# ou
ss -tlnp | grep 9352
```

Vous devriez voir :
```
tcp  0  0  127.0.0.1:9352  0.0.0.0:*  LISTEN  <pid>/node
```

Cela confirme que Next.js écoute uniquement sur localhost (127.0.0.1), ce qui est correct pour un reverse proxy.

### 2. Vérifier qu'Apache écoute sur le port 9352

```bash
netstat -tlnp | grep 9352
# ou
ss -tlnp | grep 9352
```

Vous devriez voir :
```
tcp  0  0  0.0.0.0:9352  0.0.0.0:*  LISTEN  <pid>/apache2
```

### 3. Tester l'accès

- **Accès direct à Next.js** : `http://localhost:9352` (devrait fonctionner, accès interne uniquement)
- **Accès via Apache** : `http://10.173.8.125:9352` ou `http://localhost:9352` (devrait rediriger vers Next.js)

### 4. Vérifier la configuration des variables d'environnement

Vérifiez que votre fichier `.env.production` contient bien le port 9352 :

```bash
# Vérifier les variables d'environnement
grep -E "AUTH_URL|NEXT_PUBLIC_SERVER_URL" .env.production
```

Vous devriez voir :
```env
AUTH_URL=http://10.173.8.125:9352
NEXT_PUBLIC_SERVER_URL=http://10.173.8.125:9352
```

Les variables d'environnement doivent utiliser le port **9352** (URL d'accès au site).

### 5. Checklist de configuration

Avant de déployer, vérifiez que :

- [ ] Next.js démarre sur le port 9352 (vérifier avec `netstat -tlnp | grep 9352`)
- [ ] Apache écoute sur le port 9352 (vérifier avec `netstat -tlnp | grep 9352`)
- [ ] Les scripts dans `package.json` utilisent le port 9352
- [ ] Les scripts `start-production.sh` et `start-production.ps1` utilisent le port 9352
- [ ] Le fichier `.env.production` contient `AUTH_URL` avec le port 9352
- [ ] Le fichier `.env.production` contient `NEXT_PUBLIC_SERVER_URL` avec le port 9352
- [ ] Les deux variables d'environnement utilisent la même URL (même IP/domaine, même port)
- [ ] `AUTH_TRUST_HOST=true` est défini dans `.env.production`

## Variables d'environnement Next.js

### ⚠️ IMPORTANT : Distinction entre port interne et port externe

Il y a une distinction cruciale à comprendre :

- **Port 9352 (interne)** : Utilisé par les scripts et la configuration Next.js pour démarrer l'application
- **Port 9352 (externe)** : Utilisé dans les variables d'environnement car c'est l'URL accessible par les utilisateurs

### Configuration dans les fichiers de code (port 9352)

Les fichiers suivants doivent **rester sur le port 9352** (port interne) :

- `package.json` : `"dev": "next dev --turbopack -p 9352"` et `"start": "next start -p 9352"`
- `scripts/start-production.sh` : `npx next start -p 9352`
- `scripts/start-production.ps1` : `npx next start -p 9352`
- `next.config.ts` : Valeur par défaut `'https://localhost:9352'` (sera surchargée par les variables d'environnement)

**Ces fichiers ne doivent PAS être modifiés** - ils définissent où Next.js écoute en interne.

### Configuration dans `.env.production` (port 9352)

Le fichier `.env.production` doit utiliser le **port 9352** (port externe accessible par les utilisateurs) :

```env
# ⚠️ IMPORTANT : Utiliser le port 9352 (externe) et non le port 9352 (interne)
# Ces URLs doivent correspondre à l'URL accessible par les utilisateurs via Apache

# Si vous utilisez une IP avec le port 9352
AUTH_URL=http://10.173.8.125:9352
NEXT_PUBLIC_SERVER_URL=http://10.173.8.125:9352

# OU si vous utilisez un nom de domaine avec le port 9352
# AUTH_URL=http://votre-domaine.com:9352
# NEXT_PUBLIC_SERVER_URL=http://votre-domaine.com:9352

# OU si vous utilisez HTTPS avec un nom de domaine
# AUTH_URL=https://votre-domaine.com:9352
# NEXT_PUBLIC_SERVER_URL=https://votre-domaine.com:9352

AUTH_TRUST_HOST=true
```

### Pourquoi cette distinction ?

1. **Next.js écoute en interne sur le port 9352** : Les scripts de démarrage lancent Next.js sur ce port
2. **Les utilisateurs accèdent via Apache sur le port 9352** : Apache fait le reverse proxy vers Next.js
3. **Les variables d'environnement doivent pointer vers l'URL utilisateur** : `AUTH_URL` et `NEXT_PUBLIC_SERVER_URL` sont utilisées pour générer les URLs dans le navigateur et les callbacks d'authentification

### Exemple de configuration complète

**Fichier `.env.production`** :
```env
# URL accessible par les utilisateurs (via Apache sur le port 9352)
AUTH_URL=http://10.173.8.125:9352
NEXT_PUBLIC_SERVER_URL=http://10.173.8.125:9352
AUTH_TRUST_HOST=true
```

**Résultat** :
- Next.js démarre sur `localhost:9352` (interne, via les scripts)
- Apache écoute sur `0.0.0.0:9352` (externe)
- Les utilisateurs accèdent via `http://10.173.8.125:9352`
- Les URLs générées par Next.js utilisent `http://10.173.8.125:9352` (depuis les variables d'environnement)

### ❌ Configuration incorrecte (à éviter)

```env
# ❌ INCORRECT : Utiliser le port 9352 dans les variables d'environnement
AUTH_URL=http://10.173.8.125:9352
NEXT_PUBLIC_SERVER_URL=http://localhost:9352
```

**Problèmes** :
- Les utilisateurs accèdent via le port 9352, mais les URLs générées pointent vers 9352
- Les callbacks d'authentification échouent car ils pointent vers le mauvais port
- Les requêtes RSC (React Server Components) échouent car elles utilisent le mauvais port

## Dépannage

### Problème : Apache ne démarre pas

Vérifiez les logs :
```bash
sudo tail -f /var/log/apache2/error.log
```

### Problème : Erreur 502 Bad Gateway

1. Vérifiez que Next.js est bien démarré sur le port 9352
2. Vérifiez les logs Apache : `sudo tail -f /var/log/apache2/error.log`
3. Vérifiez que les modules proxy sont activés : `apache2ctl -M | grep proxy`

### Problème : Les requêtes ne passent pas

1. Vérifiez la configuration du firewall :
   ```bash
   sudo ufw allow 9352/tcp
   sudo ufw allow 9352/tcp
   ```

2. Vérifiez que `ProxyPreserveHost` est activé dans la configuration Apache

### Problème : Les WebSockets ne fonctionnent pas

Assurez-vous que le module `proxy_wstunnel` est activé :
```bash
sudo a2enmod proxy_wstunnel
sudo systemctl restart apache2
```

Puis ajoutez dans la configuration :
```apache
ProxyPass /ws ws://127.0.0.1:3000/ws
ProxyPassReverse /ws ws://127.0.0.1:3000/ws
```

## Notes importantes

### Ports

- **Port 9352 (interne)** : 
  - Port utilisé par Next.js pour écouter en interne
  - Configuré dans `package.json`, `scripts/start-production.sh`, `scripts/start-production.ps1`
  - Accessible uniquement depuis localhost
  - **Ne doit PAS être modifié** dans les fichiers de code

- **Port 9352 (externe)** : 
  - Port utilisé par Apache pour le reverse proxy
  - Accessible depuis l'extérieur
  - **Doit être utilisé** dans les variables d'environnement (`.env.production`)

### Sécurité

- **Le port 9352 ne doit pas être exposé directement sur Internet**
- **Firewall** : Configurez le firewall pour autoriser uniquement le port 9352 depuis l'extérieur
- Le port 9352 doit être accessible uniquement depuis localhost (127.0.0.1)

### Variables d'environnement

- **Règle importante** : Les variables `AUTH_URL` et `NEXT_PUBLIC_SERVER_URL` doivent :
  - ✅ Pointer vers l'URL accessible par les utilisateurs (port 9352 ou domaine)
  - ✅ Être identiques entre elles
  - ✅ Utiliser le même protocole (http ou https)
  - ✅ Utiliser le port 9352 (URL d'accès)

### Résumé de l'architecture

```
┌─────────────────────────────────────────┐
│  Utilisateurs                           │
│  Accès via : http://10.173.8.125:9352  │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  Apache Reverse Proxy                   │
│  Port 9352 (externe)                    │
│  → Redirige vers localhost:3000         │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  Next.js Application                    │
│  Port 9352 (interne)                    │
│  Scripts : package.json, start-*.sh/ps1 │
└─────────────────────────────────────────┘

Configuration :
- Fichiers de code : Port 9352 (interne)
- .env.production : Port 9352 (externe)
```

