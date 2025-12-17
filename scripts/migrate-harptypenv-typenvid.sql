-- Script de migration pour ajouter et remplir la colonne typenvid dans harptypenv
-- Ce script doit être exécuté AVANT le prisma db push

-- Étape 1: Ajouter la colonne typenvid comme nullable
ALTER TABLE `harptypenv` 
ADD COLUMN `typenvid` INT NULL AFTER `descr`;

-- Étape 2: Remplir les valeurs existantes avec l'id (ou une valeur unique)
-- Utiliser l'id comme valeur initiale pour typenvid
UPDATE `harptypenv` 
SET `typenvid` = `id` 
WHERE `typenvid` IS NULL;

-- Étape 3: Ajouter la contrainte unique
ALTER TABLE `harptypenv` 
ADD UNIQUE KEY `harptypenv_typenvid_key` (`typenvid`);

-- Étape 4: Rendre la colonne NOT NULL (requis)
ALTER TABLE `harptypenv` 
MODIFY COLUMN `typenvid` INT NOT NULL;

