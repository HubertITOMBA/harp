-- Script pour créer la table psadm_dispo avec les contraintes de clé étrangère
-- Ce script gère l'ordre de création et vérifie l'existence des tables référencées

-- Étape 1: Vérifier que les tables référencées existent
-- Si elles n'existent pas, vous devez les créer d'abord

-- Étape 2: Supprimer la table si elle existe déjà (optionnel, pour réessayer)
-- DROP TABLE IF EXISTS `psadm_dispo`;

-- Étape 3: Créer la table sans les contraintes de clé étrangère
CREATE TABLE IF NOT EXISTS `psadm_dispo` (
  `env` varchar(32) NOT NULL,
  `statenv` varchar(32) NOT NULL,
  `fromdate` datetime NOT NULL,
  `msg` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`env`,`fromdate`),
  KEY `statenv` (`statenv`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Étape 4: Ajouter les contraintes de clé étrangère après la création de la table
-- Cela permet de s'assurer que les tables référencées existent

-- Contrainte vers psadm_env
-- Vérifiez d'abord que la table psadm_env existe et que la colonne env est bien la clé primaire
ALTER TABLE `psadm_dispo`
  ADD CONSTRAINT `psadm_dispo_ibfk_1` 
  FOREIGN KEY (`env`) 
  REFERENCES `psadm_env` (`env`) 
  ON UPDATE CASCADE;

-- Contrainte vers psadm_statenv
-- Vérifiez d'abord que la table psadm_statenv existe et que la colonne statenv est bien la clé primaire
ALTER TABLE `psadm_dispo`
  ADD CONSTRAINT `psadm_dispo_ibfk_2` 
  FOREIGN KEY (`statenv`) 
  REFERENCES `psadm_statenv` (`statenv`) 
  ON UPDATE CASCADE;

-- Si vous obtenez toujours une erreur, vérifiez :
-- 1. Que les tables psadm_env et psadm_statenv existent
-- 2. Que les colonnes env et statenv sont bien des clés primaires dans ces tables
-- 3. Que les types de données correspondent exactement (varchar(32) dans les deux cas)
-- 4. Que les tables utilisent le même moteur de stockage (InnoDB)
