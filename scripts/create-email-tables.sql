-- Script SQL pour créer les tables du système d'historisation des emails
-- À exécuter en production si Prisma migrate ne fonctionne pas

-- Créer la table harpsentemail
CREATE TABLE IF NOT EXISTS `harpsentemail` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `subject` VARCHAR(255) NOT NULL,
  `message` TEXT NOT NULL,
  `sentBy` INT NOT NULL,
  `sentAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `harpsentemail_sentBy_idx` (`sentBy`),
  CONSTRAINT `harpsentemail_sentBy_fkey` FOREIGN KEY (`sentBy`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Créer la table harpsentemailrecipient
CREATE TABLE IF NOT EXISTS `harpsentemailrecipient` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `emailId` INT NOT NULL,
  `recipientType` VARCHAR(10) NOT NULL,
  `recipientId` INT NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `name` VARCHAR(255) NULL DEFAULT NULL,
  `sent` BOOLEAN NOT NULL DEFAULT FALSE,
  `sentAt` TIMESTAMP(0) NULL DEFAULT NULL,
  `error` TEXT NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  INDEX `harpsentemailrecipient_emailId_idx` (`emailId`),
  INDEX `harpsentemailrecipient_recipientType_recipientId_idx` (`recipientType`, `recipientId`),
  INDEX `harpsentemailrecipient_email_idx` (`email`),
  CONSTRAINT `harpsentemailrecipient_emailId_fkey` FOREIGN KEY (`emailId`) REFERENCES `harpsentemail` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Vérifier que les tables ont été créées
SHOW TABLES LIKE 'harpsentemail%';

