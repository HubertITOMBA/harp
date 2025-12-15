-- CreateTable
CREATE TABLE IF NOT EXISTS `harptask` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `identifier` VARCHAR(50) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `descr` TEXT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'EN_ATTENTE',
    `createdBy` INTEGER NULL,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0) ON UPDATE CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `harptask_identifier_key`(`identifier`),
    INDEX `harptask_status_idx`(`status`),
    INDEX `harptask_createdBy_idx`(`createdBy`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `harptaskitem` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `taskId` INTEGER NOT NULL,
    `identifier` VARCHAR(50) NOT NULL,
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

    INDEX `harptaskitem_taskId_idx`(`taskId`),
    INDEX `harptaskitem_status_idx`(`status`),
    INDEX `harptaskitem_resourceNetid_idx`(`resourceNetid`),
    INDEX `harptaskitem_predecessorId_idx`(`predecessorId`),
    INDEX `harptaskitem_order_idx`(`order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `harptaskitem` ADD CONSTRAINT `harptaskitem_taskId_fkey` FOREIGN KEY (`taskId`) REFERENCES `harptask`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `harptaskitem` ADD CONSTRAINT `harptaskitem_predecessorId_fkey` FOREIGN KEY (`predecessorId`) REFERENCES `harptaskitem`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
