-- AlterTable
-- Supprimer la colonne duration si elle existe
SET @exist := (SELECT COUNT(*) FROM information_schema.COLUMNS 
               WHERE TABLE_SCHEMA = DATABASE() 
               AND TABLE_NAME = 'harptaskitem' 
               AND COLUMN_NAME = 'duration');
SET @sqlstmt := IF(@exist > 0, 'ALTER TABLE `harptaskitem` DROP COLUMN `duration`', 'SELECT "Column duration does not exist, skipping"');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

