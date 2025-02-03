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

-- Copier les données existantes
INSERT INTO `harpora` (id, oracle_sid, aliasql, oraschema, descr, orarelease, typenvid)
SELECT UUID(), oracle_sid, aliasql, oraschema, descr, orarelease, typenvid
FROM `psadm_oracle`;

-- Mettre à jour les relations
ALTER TABLE `psadm_env` DROP FOREIGN KEY `psadm_env_ibfk_2`;
ALTER TABLE `psadm_env` ADD CONSTRAINT `psadm_env_oracle_fk` 
FOREIGN KEY (`oracle_sid`, `aliasql`, `oraschema`) 
REFERENCES `harpora`(`oracle_sid`, `aliasql`, `oraschema`);