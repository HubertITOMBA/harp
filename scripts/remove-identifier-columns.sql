-- Script SQL pour supprimer les colonnes identifier des tables harptask et harptaskitem
-- À exécuter manuellement dans MySQL
-- Usage: mysql -u root -p votre_base < scripts/remove-identifier-columns.sql

-- Supprimer l'index unique sur identifier de harptask s'il existe
ALTER TABLE `harptask` DROP INDEX IF EXISTS `harptask_identifier_key`;

-- Supprimer la colonne identifier de harptask
ALTER TABLE `harptask` DROP COLUMN IF EXISTS `identifier`;

-- Supprimer la colonne identifier de harptaskitem
ALTER TABLE `harptaskitem` DROP COLUMN IF EXISTS `identifier`;

-- Vérification
SELECT 'Colonnes identifier supprimées avec succès!' as Status;
DESCRIBE `harptask`;
DESCRIBE `harptaskitem`;
