-- Script pour accorder les permissions sur la base de données novembre_25
-- À exécuter en tant qu'administrateur MariaDB/MySQL

-- Option 1: Accorder les permissions à root depuis n'importe quel hôte
GRANT ALL PRIVILEGES ON novembre_25.* TO 'root'@'%' IDENTIFIED BY 'axel2014';
FLUSH PRIVILEGES;

-- Option 2: Accorder les permissions à root depuis un hôte spécifique (remplacer par votre IP)
-- GRANT ALL PRIVILEGES ON novembre_25.* TO 'root'@'192.168.1.48' IDENTIFIED BY 'axel2014';
-- FLUSH PRIVILEGES;

-- Option 3: Accorder les permissions à root depuis localhost
-- GRANT ALL PRIVILEGES ON novembre_25.* TO 'root'@'localhost' IDENTIFIED BY 'axel2014';
-- FLUSH PRIVILEGES;

-- Vérifier les permissions accordées
SHOW GRANTS FOR 'root'@'%';

-- Vérifier que la base de données existe
SHOW DATABASES LIKE 'novembre_25';

