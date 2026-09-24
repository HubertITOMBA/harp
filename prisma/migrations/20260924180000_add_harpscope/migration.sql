-- Socle périmètres HARP.
-- Généré par prisma migrate diff entre le schéma de HEAD et le schéma de travail.
-- Non appliqué. N'inclut pas l'écart entre la base DEV et le schéma historique.

-- AlterTable
ALTER TABLE `envsharp` ADD COLUMN `scopeId` INTEGER NULL;

-- CreateTable
CREATE TABLE `harpscope` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(16) NOT NULL,
    `descr` VARCHAR(50) NOT NULL,

    UNIQUE INDEX `harpscope_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `harpuserscope` (
    `userId` INTEGER NOT NULL,
    `scopeId` INTEGER NOT NULL,
    `datmaj` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `harpuserscope_scopeId_idx`(`scopeId`),
    INDEX `harpuserscope_userId_idx`(`userId`),
    PRIMARY KEY (`userId`, `scopeId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `envsharp_scopeId_idx` ON `envsharp`(`scopeId`);

-- AddForeignKey
ALTER TABLE `envsharp` ADD CONSTRAINT `envsharp_scopeId_fkey` FOREIGN KEY (`scopeId`) REFERENCES `harpscope`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `harpuserscope` ADD CONSTRAINT `harpuserscope_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `harpuserscope` ADD CONSTRAINT `harpuserscope_scopeId_fkey` FOREIGN KEY (`scopeId`) REFERENCES `harpscope`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
