# Configuration SMTP - Guide pour l'Administrateur Système

## Problème observé

L'application indique que les emails sont envoyés avec succès (toast de confirmation), mais les utilisateurs ne reçoivent pas les emails.

## Diagnostic

### 1. Vérifier les logs de l'application

Les logs de l'application contiennent des informations détaillées sur chaque envoi d'email :

```bash
# Vérifier les logs PM2
pm2 logs harp --lines 100 | grep "\[MAIL\]"

# Ou logs systemd
journalctl -u harp -f | grep "\[MAIL\]"
```

Les logs affichent :
- `messageId` : ID du message retourné par le serveur SMTP
- `accepted` : Liste des emails acceptés par le serveur
- `rejected` : Liste des emails rejetés par le serveur
- `response` : Réponse complète du serveur SMTP

### 2. Vérifier la configuration SMTP actuelle

Configuration actuelle dans `.env` :
```env
MAIL_HOST=138.35.24.152
MAIL_PORT=25
MAIL_USER=ftharp-technical-support@dxc.com
MAIL_PASSWORD=
MAIL_SECURE=false
MAIL_IGNORE_TLS_ERRORS=true
MAIL_FROM=ftharp-technical-support@dxc.com
```

## Points à vérifier côté serveur SMTP

### 1. Le serveur SMTP accepte-t-il les connexions ?

Tester la connexion depuis le serveur de l'application :

```bash
# Tester la connexion SMTP
telnet 138.35.24.152 25

# Ou avec openssl pour TLS
openssl s_client -connect 138.35.24.152:25 -starttls smtp
```

### 2. Le serveur SMTP relaye-t-il les emails ?

Le serveur peut accepter l'email mais ne pas le relayer. Vérifier :

```bash
# Tester l'envoi direct depuis le serveur
echo "Test email" | sendmail -v -f ftharp-technical-support@dxc.com destinataire@example.com

# Ou avec telnet
telnet 138.35.24.152 25
EHLO portails.orange-harp.fr
MAIL FROM:<ftharp-technical-support@dxc.com>
RCPT TO:<destinataire@example.com>
DATA
Subject: Test
Test email
.
QUIT
```

### 3. Configuration du serveur SMTP (Postfix/Sendmail)

#### Pour Postfix

Vérifier `/etc/postfix/main.cf` :

```ini
# Autoriser le relais depuis l'application
mynetworks = 127.0.0.0/8 [::ffff:127.0.0.0]/104 [::1]/128 IP_DU_SERVEUR_APP/32

# Autoriser le relais pour certains domaines
relay_domains = dxc.com orange-harp.fr

# Ne pas restreindre les destinataires
smtpd_recipient_restrictions = permit_mynetworks, permit_sasl_authenticated, reject_unauth_destination
```

#### Pour Sendmail

Vérifier `/etc/mail/sendmail.mc` et `/etc/mail/access` :

```bash
# Ajouter l'IP du serveur dans /etc/mail/access
IP_DU_SERVEUR_APP    RELAY

# Reconstruire la base de données
makemap hash /etc/mail/access < /etc/mail/access
```

### 4. Vérifier les logs du serveur SMTP

#### Postfix

```bash
# Logs Postfix
tail -f /var/log/maillog | grep postfix
# ou
tail -f /var/log/mail.log | grep postfix
```

#### Sendmail

```bash
# Logs Sendmail
tail -f /var/log/maillog | grep sendmail
```

### 5. Vérifier les restrictions de sécurité

Le serveur SMTP peut bloquer les emails pour plusieurs raisons :

- **SPF (Sender Policy Framework)** : Vérifier que le domaine `dxc.com` autorise l'IP `138.35.24.152` à envoyer des emails
- **DKIM** : Vérifier que les signatures DKIM sont correctes
- **DMARC** : Vérifier la politique DMARC du domaine
- **Blacklists** : Vérifier que l'IP n'est pas blacklistée

### 6. Vérifier les emails en spam

Les emails peuvent être envoyés mais arriver dans le dossier spam. Vérifier :
- Les en-têtes des emails (SPF, DKIM, DMARC)
- La réputation de l'IP expéditrice
- Le contenu de l'email (éviter les mots déclencheurs de spam)

## Solutions possibles

### Solution 1 : Configurer le relais SMTP

Si le serveur SMTP nécessite une authentification pour le relais :

```env
# Dans .env
MAIL_HOST=138.35.24.152
MAIL_PORT=25
MAIL_USER=ftharp-technical-support@dxc.com
MAIL_PASSWORD=votre-mot-de-passe-si-requis
MAIL_SECURE=false
MAIL_REQUIRE_TLS=false
MAIL_IGNORE_TLS_ERRORS=true
MAIL_FROM=ftharp-technical-support@dxc.com
```

### Solution 2 : Utiliser un port avec authentification

Si le port 25 ne fonctionne pas, essayer le port 587 avec STARTTLS :

```env
MAIL_HOST=138.35.24.152
MAIL_PORT=587
MAIL_USER=ftharp-technical-support@dxc.com
MAIL_PASSWORD=votre-mot-de-passe
MAIL_SECURE=false
MAIL_REQUIRE_TLS=true
MAIL_IGNORE_TLS_ERRORS=true
MAIL_FROM=ftharp-technical-support@dxc.com
```

### Solution 3 : Utiliser sendmail local

Si le serveur a sendmail installé, utiliser sendmail directement :

```env
USE_SENDMAIL=true
SENDMAIL_PATH=/usr/sbin/sendmail
MAIL_FROM=ftharp-technical-support@dxc.com
```

Puis configurer sendmail pour utiliser le serveur SMTP comme relais :

```bash
# Dans /etc/mail/sendmail.mc
define(`SMART_HOST', `138.35.24.152')dnl
define(`RELAY_MAILER_ARGS', `TCP $h 25')dnl

# Reconstruire la configuration
m4 /etc/mail/sendmail.mc > /etc/mail/sendmail.cf
systemctl restart sendmail
```

## Commandes de diagnostic

### Tester l'envoi d'email depuis le serveur

```bash
# Avec sendmail
echo "Test email" | sendmail -v -f ftharp-technical-support@dxc.com destinataire@example.com

# Avec telnet
telnet 138.35.24.152 25
EHLO portails.orange-harp.fr
MAIL FROM:<ftharp-technical-support@dxc.com>
RCPT TO:<destinataire@example.com>
DATA
Subject: Test SMTP
Test email depuis le serveur
.
QUIT
```

### Vérifier les DNS (SPF, DKIM, DMARC)

```bash
# Vérifier SPF
dig TXT dxc.com | grep spf

# Vérifier DKIM
dig TXT default._domainkey.dxc.com

# Vérifier DMARC
dig TXT _dmarc.dxc.com
```

### Vérifier si l'IP est blacklistée

```bash
# Vérifier sur plusieurs blacklists
host 138.35.24.152
# ou utiliser des outils en ligne comme mxtoolbox.com
```

## Informations à fournir pour le diagnostic

Si le problème persiste, fournir à l'admin système :

1. **Logs de l'application** :
   ```bash
   pm2 logs harp --lines 200 | grep "\[MAIL\]"
   ```

2. **Logs du serveur SMTP** :
   ```bash
   tail -100 /var/log/maillog | grep "138.35.24.152"
   ```

3. **Résultat du test de connexion** :
   ```bash
   telnet 138.35.24.152 25
   ```

4. **Configuration actuelle** :
   - IP du serveur de l'application
   - Domaine d'envoi (dxc.com)
   - Port utilisé (25)
   - Authentification requise ou non

## Notes importantes

- Le port 25 est souvent bloqué par les FAI pour éviter le spam
- Les emails peuvent être acceptés par le serveur SMTP mais rejetés plus tard par le serveur de destination
- Vérifier toujours les logs du serveur SMTP pour voir si les emails sont bien relayés
- Les emails peuvent arriver avec un délai (file d'attente du serveur SMTP)

