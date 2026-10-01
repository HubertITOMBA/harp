-- RBAC HARP : sous-rôles et accès aux types d'environnement.
-- SQL isolé. Non appliqué.
-- N'inclut pas le drift historique (psadm_env, envsharp, User, tables @@ignore).
-- Les index de préfixe déjà couverts par les clés primaires sont conservés
-- parce qu'ils sont déclarés dans schema.prisma (@@index).

-- CreateTable
CREATE TABLE `harpsubrole` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(32) NOT NULL,
    `descr` VARCHAR(100) NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `datmaj` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `harpsubrole_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `harprolesubrole` (
    `roleId` INTEGER NOT NULL,
    `subroleId` INTEGER NOT NULL,
    `datmaj` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `harprolesubrole_roleId_idx`(`roleId`),
    INDEX `harprolesubrole_subroleId_idx`(`subroleId`),
    PRIMARY KEY (`roleId`, `subroleId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `harpsubroletypenv` (
    `subroleId` INTEGER NOT NULL,
    `typenvid` INTEGER NOT NULL,
    `datmaj` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `harpsubroletypenv_subroleId_idx`(`subroleId`),
    INDEX `harpsubroletypenv_typenvid_idx`(`typenvid`),
    PRIMARY KEY (`subroleId`, `typenvid`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `harprolesubrole` ADD CONSTRAINT `harprolesubrole_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `harproles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `harprolesubrole` ADD CONSTRAINT `harprolesubrole_subroleId_fkey` FOREIGN KEY (`subroleId`) REFERENCES `harpsubrole`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `harpsubroletypenv` ADD CONSTRAINT `harpsubroletypenv_subroleId_fkey` FOREIGN KEY (`subroleId`) REFERENCES `harpsubrole`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `harpsubroletypenv` ADD CONSTRAINT `harpsubroletypenv_typenvid_fkey` FOREIGN KEY (`typenvid`) REFERENCES `harptypenv`(`typenvid`) ON DELETE CASCADE ON UPDATE CASCADE;
