CREATE TABLE `harpora` (
    `id` VARCHAR(191) NOT NULL,
    `oracle_sid` CHAR(8) NOT NULL,
    `aliasql` VARCHAR(32) NOT NULL,
    `oraschema` CHAR(8) NOT NULL,
    `descr` VARCHAR(50) NOT NULL,
    `orarelease` VARCHAR(32) NULL,
    `typenvid` INTEGER NULL,

    UNIQUE INDEX `harpora_oracle_sid_aliasql_oraschema_key`(`oracle_sid`, `aliasql`, `oraschema`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Copier les données existantes (si la table psadm_oracle existe)
-- Note: Cette migration nécessite que la table psadm_oracle existe déjà
-- Si elle n'existe pas, cette étape sera ignorée
SET @table_exists = (SELECT COUNT(*) FROM information_schema.tables 
                     WHERE table_schema = DATABASE() AND table_name = 'psadm_oracle');

SET @sql = IF(@table_exists > 0,
    'INSERT INTO `harpora` (id, oracle_sid, aliasql, oraschema, descr, orarelease, typenvid)
     SELECT UUID(), oracle_sid, aliasql, oraschema, descr, orarelease, typenvid
     FROM `psadm_oracle`',
    'SELECT 1');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Mettre à jour les relations (si la table psadm_env existe)
SET @env_table_exists = (SELECT COUNT(*) FROM information_schema.tables 
                         WHERE table_schema = DATABASE() AND table_name = 'psadm_env');

SET @fk_exists = (SELECT COUNT(*) FROM information_schema.table_constraints 
                  WHERE table_schema = DATABASE() 
                  AND table_name = 'psadm_env' 
                  AND constraint_name = 'psadm_env_ibfk_2');

SET @sql_env = IF(@env_table_exists > 0 AND @fk_exists > 0,
    'ALTER TABLE `psadm_env` DROP FOREIGN KEY `psadm_env_ibfk_2`',
    'SELECT 1');

PREPARE stmt_env FROM @sql_env;
EXECUTE stmt_env;
DEALLOCATE PREPARE stmt_env;

SET @sql_env_fk = IF(@env_table_exists > 0,
    'ALTER TABLE `psadm_env` ADD CONSTRAINT `psadm_env_oracle_fk` 
     FOREIGN KEY (`oracle_sid`, `aliasql`, `oraschema`) 
     REFERENCES `harpora`(`oracle_sid`, `aliasql`, `oraschema`)',
    'SELECT 1');

PREPARE stmt_env_fk FROM @sql_env_fk;
EXECUTE stmt_env_fk;
DEALLOCATE PREPARE stmt_env_fk;