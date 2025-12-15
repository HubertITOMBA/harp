-- Script SQL pour créer la table harpitems et modifier harptaskitem
-- À exécuter manuellement dans MySQL

-- 1. Créer la table harpitems
CREATE TABLE IF NOT EXISTS `harpitems` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `descr` VARCHAR(255) NOT NULL,
  `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `harpitems_descr_key` (`descr`),
  INDEX `harpitems_descr_idx` (`descr`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Ajouter la colonne harpitemId à harptaskitem
ALTER TABLE `harptaskitem` 
ADD COLUMN IF NOT EXISTS `harpitemId` INT NULL AFTER `taskId`,
ADD INDEX IF NOT EXISTS `harptaskitem_harpitemId_idx` (`harpitemId`);

-- 3. Ajouter la contrainte de clé étrangère
-- Note: MySQL ne supporte pas IF NOT EXISTS pour les clés étrangères, donc vérifiez d'abord
-- ou supprimez la clé si elle existe déjà avant de la recréer

-- Vérifier si la clé existe (à exécuter manuellement si nécessaire)
-- SELECT CONSTRAINT_NAME 
-- FROM information_schema.TABLE_CONSTRAINTS 
-- WHERE TABLE_SCHEMA = DATABASE() 
--   AND TABLE_NAME = 'harptaskitem' 
--   AND CONSTRAINT_NAME = 'harptaskitem_harpitemId_fkey';

-- Ajouter la clé étrangère
ALTER TABLE `harptaskitem`
ADD CONSTRAINT `harptaskitem_harpitemId_fkey` 
FOREIGN KEY (`harpitemId`) 
REFERENCES `harpitems`(`id`) 
ON DELETE SET NULL 
ON UPDATE CASCADE;
