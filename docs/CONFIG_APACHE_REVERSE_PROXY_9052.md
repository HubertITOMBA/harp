# Configuration Apache Reverse Proxy - Port 9052

## Architecture

- **Next.js** : Écoute sur le port **9352** (interne/localhost)
- **Apache** : Reverse proxy sur le port **9052** (externe/public) → redirige vers `localhost:9352`

## Configuration Apache

### 1. Créer le fichier de configuration Apache

Créez le fichier `/etc/apache2/sites-available/harp-portal.conf` :

```apache
<VirtualHost *:9052>
    ServerName localhost
    ServerAlias *

    # Configuration du reverse proxy vers Next.js
    ProxyPreserveHost On
    ProxyRequests Off
    
    # Redirection de toutes les requêtes vers Next.js sur le port 9352
    ProxyPass / http://127.0.0.1:9352/
    ProxyPassReverse / http://127.0.0.1:9352/
    
    # Headers nécessaires pour Next.js
    ProxyPassReverse / http://127.0.0.1:9352/
    RequestHeader set X-Forwarded-Proto "https"
    RequestHeader set X-Forwarded-Port "9052"
    
    # Configuration pour les WebSockets (si nécessaire)
    RewriteEngine On
    RewriteCond %{HTTP:Upgrade} =websocket [NC]
    RewriteRule /(.*) ws://127.0.0.1:9352/$1 [P,L]
    RewriteCond %{HTTP:Upgrade} !=websocket [NC]
    RewriteRule /(.*) http://127.0.0.1:9352/$1 [P,L]
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

### 4. Configuration du port 9052 dans Apache

Si Apache n'écoute pas par défaut sur le port 9052, ajoutez-le dans `/etc/apache2/ports.conf` :

```apache
Listen 80
Listen 443
Listen 9052
```

Puis redémarrez Apache :

```bash
sudo systemctl restart apache2
```

## Configuration HTTPS (optionnel)

Si vous souhaitez utiliser HTTPS sur le port 9052 :

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
<VirtualHost *:9052>
    ServerName votre-domaine.com
    
    SSLEngine On
    SSLCertificateFile /etc/letsencrypt/live/votre-domaine.com/fullchain.pem
    SSLCertificateKeyFile /etc/letsencrypt/live/votre-domaine.com/privkey.pem
    
    # Configuration du reverse proxy
    ProxyPreserveHost On
    ProxyRequests Off
    ProxyPass / http://127.0.0.1:9352/
    ProxyPassReverse / http://127.0.0.1:9352/
    
    # Headers nécessaires
    RequestHeader set X-Forwarded-Proto "https"
    RequestHeader set X-Forwarded-Port "9052"
</VirtualHost>
```

### 4. Activer le module SSL

```bash
sudo a2enmod ssl
sudo systemctl restart apache2
```

## Vérification

### 1. Vérifier que Next.js écoute sur le port 9352

```bash
netstat -tlnp | grep 9352
# ou
ss -tlnp | grep 9352
```

Vous devriez voir :
```
tcp  0  0  127.0.0.1:9352  0.0.0.0:*  LISTEN  <pid>/node
```

### 2. Vérifier qu'Apache écoute sur le port 9052

```bash
netstat -tlnp | grep 9052
# ou
ss -tlnp | grep 9052
```

Vous devriez voir :
```
tcp  0  0  0.0.0.0:9052  0.0.0.0:*  LISTEN  <pid>/apache2
```

### 3. Tester l'accès

- **Accès direct à Next.js** : `http://localhost:9352` (devrait fonctionner)
- **Accès via Apache** : `http://localhost:9052` (devrait rediriger vers Next.js)

## Variables d'environnement Next.js

Assurez-vous que votre fichier `.env` contient :

```env
# URL interne (Next.js écoute sur 9352)
AUTH_URL=https://localhost:9352
NEXT_PUBLIC_SERVER_URL=https://localhost:9352

# Si vous utilisez un domaine externe via Apache
# AUTH_URL=https://votre-domaine.com:9052
# NEXT_PUBLIC_SERVER_URL=https://votre-domaine.com:9052

AUTH_TRUST_HOST=true
```

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
   sudo ufw allow 9052/tcp
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
ProxyPass /ws ws://127.0.0.1:9352/ws
ProxyPassReverse /ws ws://127.0.0.1:9352/ws
```

## Notes importantes

- **Port 9352** : Port interne, accessible uniquement depuis localhost
- **Port 9052** : Port externe, accessible depuis l'extérieur via Apache
- **Sécurité** : Le port 9352 ne doit pas être exposé directement sur Internet
- **Firewall** : Configurez le firewall pour autoriser uniquement le port 9052 depuis l'extérieur
- **Variables d'environnement** : Les variables `AUTH_URL` et `NEXT_PUBLIC_SERVER_URL` doivent correspondre à l'URL accessible par les utilisateurs (port 9052 ou domaine)

