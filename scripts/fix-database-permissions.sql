-- Script SQL pour autoriser l'hôte à se connecter à MariaDB
-- À exécuter sur le serveur MariaDB (192.168.1.49) en tant qu'administrateur

-- ÉTAPE 1: Vérifier comment MariaDB voit les connexions actuelles
SELECT User, Host FROM mysql.user WHERE User = 'root';

-- ÉTAPE 2: Vérifier les connexions actives (pour voir comment votre machine se connecte)
SHOW PROCESSLIST;

-- ÉTAPE 3: Essayer plusieurs options pour autoriser la connexion

-- Option A: Autoriser par adresse IP (192.168.1.48 - votre IP locale)
GRANT ALL PRIVILEGES ON mars.* TO 'root'@'192.168.1.48' IDENTIFIED BY 'axel2014';
FLUSH PRIVILEGES;

-- Option B: Autoriser par nom d'hôte complet
GRANT ALL PRIVILEGES ON mars.* TO 'root'@'fr-pf5mhblb.home' IDENTIFIED BY 'axel2014';
FLUSH PRIVILEGES;

-- Option C: Autoriser par nom d'hôte court
GRANT ALL PRIVILEGES ON mars.* TO 'root'@'FR-PF5MHBLB' IDENTIFIED BY 'axel2014';
FLUSH PRIVILEGES;

-- Option D: Autoriser par nom d'hôte en minuscules
GRANT ALL PRIVILEGES ON mars.* TO 'root'@'fr-pf5mhblb' IDENTIFIED BY 'axel2014';
FLUSH PRIVILEGES;

-- Option E: Autoriser tous les hôtes du réseau local (192.168.1.%) - plus sécurisé que '%'
GRANT ALL PRIVILEGES ON mars.* TO 'root'@'192.168.1.%' IDENTIFIED BY 'axel2014';
FLUSH PRIVILEGES;

-- Option F: Autoriser tous les hôtes (moins sécurisé, à utiliser en dernier recours)
GRANT ALL PRIVILEGES ON mars.* TO 'root'@'%' IDENTIFIED BY 'axel2014';
FLUSH PRIVILEGES;

-- ÉTAPE 4: Vérifier les permissions après modification
SELECT User, Host FROM mysql.user WHERE User = 'root' AND Db = 'mars';

