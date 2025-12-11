-- Script SQL pour créer les tables du système de notifications
-- À exécuter en production si Prisma migrate ne fonctionne pas

-- Créer la table harpnotification
CREATE TABLE IF NOT EXISTS `harpnotification` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(255) NOT NULL,
  `message` TEXT NOT NULL,
  `createdBy` INT NOT NULL,
  `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `harpnotification_createdBy_idx` (`createdBy`),
  CONSTRAINT `harpnotification_createdBy_fkey` FOREIGN KEY (`createdBy`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Créer la table harpnotificationrecipient
CREATE TABLE IF NOT EXISTS `harpnotificationrecipient` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `notificationId` INT NOT NULL,
  `recipientType` VARCHAR(10) NOT NULL,
  `recipientId` INT NOT NULL,
  `read` BOOLEAN NOT NULL DEFAULT FALSE,
  `readAt` TIMESTAMP(0) NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `harpnotifrecip_uniq` (`notificationId`, `recipientType`, `recipientId`),
  INDEX `harpnotificationrecipient_notificationId_idx` (`notificationId`),
  INDEX `harpnotificationrecipient_recipientType_recipientId_idx` (`recipientType`, `recipientId`),
  CONSTRAINT `harpnotificationrecipient_notificationId_fkey` FOREIGN KEY (`notificationId`) REFERENCES `harpnotification` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Vérifier que les tables ont été créées
SHOW TABLES LIKE 'harpnotification%';

