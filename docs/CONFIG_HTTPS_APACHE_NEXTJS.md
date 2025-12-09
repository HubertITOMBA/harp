Pour qu’une application **Next.js** servie par **Apache** sur Linux passe en **HTTPS** sans afficher « site non sécurisé », il faut :

1. **Installer un certificat SSL valide** (Let’s Encrypt, autorité reconnue)
2. **Configurer Apache** pour servir le site en HTTPS
3. (Si besoin) **configurer un reverse proxy** vers l’app Next.js

Voici les étapes complètes et fiables :

---

# ✅ 1. Installer un certificat SSL valide (Let’s Encrypt / Certbot)

### ➤ Installation de Certbot (Debian/Ubuntu)

```bash
sudo apt update
sudo apt install certbot python3-certbot-apache
```

### ➤ Génération du certificat SSL

```bash
sudo certbot --apache -d monsite.com -d www.monsite.com
```

Certbot :

* génère un certificat TLS signé par Let's Encrypt
* configure automatiquement Apache pour HTTPS
* met en place le renouvellement automatique

👉 Après cela, **le message "site non sécurisé" disparaît**, car le certificat est reconnu par les navigateurs.

---

# ✅ 2. Configuration Apache pour Next.js (reverse proxy)

Next.js ne tourne pas nativement dans Apache :
on lance Next.js sur un port (ex : 3000), puis Apache fait proxy vers ce port.

### Exemple de config Apache

Fichier : `/etc/apache2/sites-available/monsite.conf`

```apache
<VirtualHost *:80>
    ServerName monsite.com
    ServerAlias www.monsite.com

    RewriteEngine On
    RewriteRule ^ https://%{SERVER_NAME}%{REQUEST_URI} [END,NE,R=permanent]
</VirtualHost>

<VirtualHost *:443>
    ServerName monsite.com
    ServerAlias www.monsite.com

    SSLEngine On
    SSLCertificateFile /etc/letsencrypt/live/monsite.com/fullchain.pem
    SSLCertificateKeyFile /etc/letsencrypt/live/monsite.com/privkey.pem

    ProxyPreserveHost On
    ProxyRequests Off
    ProxyPass / http://127.0.0.1:3000/
    ProxyPassReverse / http://127.0.0.1:3000/
</VirtualHost>
```

### Activer les modules Apache nécessaires

```bash
sudo a2enmod ssl proxy proxy_http rewrite
sudo systemctl restart apache2
```

---

# ✅ 3. Lancer l'app Next.js en production

Dans votre dossier Next.js :

```bash
npm run build
npm start
```

Par défaut Next.js écoute sur `http://localhost:3000`.

---

# ⚠️ 4. Vérification

### Dans votre navigateur :

* l’icône cadenas doit apparaître
* aucune alerte « site non sécurisé »
* certificat émis par Let’s Encrypt

### Vérification avec OpenSSL :

```bash
openssl s_client -connect monsite.com:443 -servername monsite.com
```

---

# 🎉 Résultat

Votre site Next.js est maintenant accessible en HTTPS avec un certificat valide, sans l’avertissement « site non sécurisé ».

---

Si tu veux, je peux te :
✅ vérifier ta configuration Apache
✅ écrire ta config complète en fonction de ton domaine
✅ ajouter la configuration pour Next.js via PM2 (production)

Souhaites-tu que je t’aide à configurer ton fichier Apache exact ?
