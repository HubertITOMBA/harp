# Guide pour activer skip-name-resolve dans MariaDB

## Problème
MariaDB fait une résolution DNS inverse qui peut bloquer les connexions même avec les bonnes permissions.

## Solution : Activer skip-name-resolve

### Étape 1 : Trouver le fichier de configuration

Sur le serveur MariaDB (192.168.1.49), le fichier de configuration se trouve généralement dans :
- `/etc/mysql/mariadb.conf.d/50-server.cnf`
- `/etc/my.cnf`
- `/etc/mysql/my.cnf`

### Étape 2 : Modifier la configuration

1. Connectez-vous au serveur en SSH ou directement
2. Éditez le fichier de configuration avec les privilèges root :
   ```bash
   sudo nano /etc/mysql/mariadb.conf.d/50-server.cnf
   # ou
   sudo nano /etc/my.cnf
   ```

3. Trouvez la section `[mysqld]` et ajoutez (ou modifiez) cette ligne :
   ```ini
   [mysqld]
   skip-name-resolve
   ```

   Si la ligne existe déjà mais est commentée, décommentez-la :
   ```ini
   # skip-name-resolve  ← Commenté
   skip-name-resolve    ← Décommenté
   ```

### Étape 3 : Redémarrer MariaDB

```bash
sudo systemctl restart mariadb
# ou
sudo systemctl restart mysql
```

### Étape 4 : Vérifier que c'est activé

Connectez-vous à MariaDB et vérifiez :
```sql
SHOW VARIABLES LIKE 'skip_name_resolve';
```

La valeur doit être `ON`.

### Étape 5 : Tester la connexion

Après le redémarrage, testez à nouveau la création de compte depuis votre application.

## Alternative : Si vous ne pouvez pas modifier la configuration

Si vous n'avez pas les droits d'administration sur le serveur, vous pouvez essayer de créer un utilisateur avec l'adresse IP exacte au lieu du nom d'hôte, mais la meilleure solution reste d'activer `skip-name-resolve`.

