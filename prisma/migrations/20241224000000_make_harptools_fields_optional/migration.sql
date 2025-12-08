-- Migration pour rendre les champs optionnels dans harptools
-- et changer tooltype de Char(5) à VarChar(5)

-- Modifier tooltype de Char(5) à VarChar(5) et le rendre nullable
ALTER TABLE `harptools` 
MODIFY COLUMN `tooltype` VARCHAR(5) NULL;

-- Rendre les champs optionnels (NULL)
ALTER TABLE `harptools` 
MODIFY COLUMN `cmdpath` VARCHAR(255) NULL,
MODIFY COLUMN `cmd` VARCHAR(255) NULL,
MODIFY COLUMN `descr` VARCHAR(50) NULL,
MODIFY COLUMN `cmdarg` VARCHAR(255) NULL,
MODIFY COLUMN `mode` VARCHAR(10) NULL;
