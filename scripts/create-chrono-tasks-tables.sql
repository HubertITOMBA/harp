-- Script SQL pour créer les tables de gestion des chrono-tâches
-- À exécuter manuellement dans MySQL
-- Usage: mysql -u root -p votre_base < scripts/create-chrono-tasks-tables.sql

-- Créer la table harptask (chrono-tâches)
CREATE TABLE IF NOT EXISTS `harptask` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(255) NOT NULL,
    `descr` TEXT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'EN_ATTENTE',
    `createdBy` INTEGER NULL,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0) ON UPDATE CURRENT_TIMESTAMP(0),
    PRIMARY KEY (`id`),
    KEY `harptask_status_idx` (`status`),
    KEY `harptask_createdBy_idx` (`createdBy`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Créer la table harptaskitem (tâches individuelles)
-- Note: On crée d'abord la table sans les contraintes de clés étrangères
CREATE TABLE IF NOT EXISTS `harptaskitem` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `taskId` INTEGER NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `duration` INTEGER NULL,
    `startDate` DATETIME(0) NULL,
    `endDate` DATETIME(0) NULL,
    `resourceNetid` VARCHAR(32) NULL,
    `predecessorNetid` VARCHAR(32) NULL,
    `predecessorId` INTEGER NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'EN_ATTENTE',
    `comment` TEXT NULL,
    `order` INTEGER NOT NULL DEFAULT 0,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0) ON UPDATE CURRENT_TIMESTAMP(0),
    PRIMARY KEY (`id`),
    KEY `harptaskitem_taskId_idx` (`taskId`),
    KEY `harptaskitem_status_idx` (`status`),
    KEY `harptaskitem_resourceNetid_idx` (`resourceNetid`),
    KEY `harptaskitem_predecessorId_idx` (`predecessorId`),
    KEY `harptaskitem_order_idx` (`order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Ajouter les contraintes de clés étrangères après la création des tables
-- Vérifier si les contraintes existent déjà avant de les ajouter
SET @exist_taskId_fkey := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS 
    WHERE CONSTRAINT_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'harptaskitem' 
    AND CONSTRAINT_NAME = 'harptaskitem_taskId_fkey');

SET @exist_predecessorId_fkey := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS 
    WHERE CONSTRAINT_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'harptaskitem' 
    AND CONSTRAINT_NAME = 'harptaskitem_predecessorId_fkey');

SET @sql_taskId = IF(@exist_taskId_fkey = 0, 
    'ALTER TABLE `harptaskitem` ADD CONSTRAINT `harptaskitem_taskId_fkey` FOREIGN KEY (`taskId`) REFERENCES `harptask` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;',
    'SELECT "Contrainte harptaskitem_taskId_fkey existe déjà" as message;');

SET @sql_predecessorId = IF(@exist_predecessorId_fkey = 0,
    'ALTER TABLE `harptaskitem` ADD CONSTRAINT `harptaskitem_predecessorId_fkey` FOREIGN KEY (`predecessorId`) REFERENCES `harptaskitem` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;',
    'SELECT "Contrainte harptaskitem_predecessorId_fkey existe déjà" as message;');

PREPARE stmt FROM @sql_taskId;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

PREPARE stmt FROM @sql_predecessorId;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Vérification
SELECT 'Tables créées avec succès!' as Status;
SHOW TABLES LIKE 'harptask%';
