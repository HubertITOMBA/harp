-- Migration pour aligner la table `harptools` avec le schéma Prisma actuel.
-- Si la table n'existe pas (cas d'une nouvelle base ou d'un reset), on la crée
-- directement avec la bonne structure (tous les champs optionnels sauf `tool`).

CREATE TABLE IF NOT EXISTS `harptools` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `tool` VARCHAR(255) NOT NULL,
  `cmdpath` VARCHAR(255) NULL,
  `cmd` VARCHAR(255) NULL,
  `version` VARCHAR(10) NULL,
  `descr` VARCHAR(50) NULL,
  `tooltype` VARCHAR(5) NULL,
  `cmdarg` VARCHAR(255) NULL,
  `mode` VARCHAR(10) NULL,
  `output` CHAR(1) NULL,

  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
