-- Script de migration complet pour typenvid
-- Ce script doit être exécuté AVANT le prisma db push
-- Il corrige les valeurs orphelines et configure correctement la colonne typenvid

-- ============================================
-- PARTIE 1: Préparation de harptypenv.typenvid
-- ============================================

-- Étape 1.1: Ajouter la colonne typenvid comme nullable (si elle n'existe pas déjà)
-- Cette commande échouera si la colonne existe déjà, c'est normal
SET @col_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'harptypenv' 
    AND COLUMN_NAME = 'typenvid'
);

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `harptypenv` ADD COLUMN `typenvid` INT NULL AFTER `descr`',
  'SELECT "Colonne typenvid existe déjà" as message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Étape 1.2: Remplir les valeurs existantes avec l'id
UPDATE `harptypenv` 
SET `typenvid` = `id` 
WHERE `typenvid` IS NULL;

-- Étape 1.3: Ajouter la contrainte unique (si elle n'existe pas déjà)
SET @uk_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
  WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'harptypenv' 
    AND CONSTRAINT_NAME = 'harptypenv_typenvid_key'
);

SET @sql = IF(@uk_exists = 0,
  'ALTER TABLE `harptypenv` ADD UNIQUE KEY `harptypenv_typenvid_key` (`typenvid`)',
  'SELECT "Contrainte unique existe déjà" as message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================
-- PARTIE 2: Correction des valeurs orphelines dans envsharp
-- ============================================

-- Étape 2.1: Identifier et compter les valeurs orphelines
SELECT 
  'Diagnostic: Valeurs orphelines dans envsharp.typenvid' as info,
  COUNT(DISTINCT e.typenvid) as orphan_count,
  GROUP_CONCAT(DISTINCT e.typenvid ORDER BY e.typenvid) as orphan_values
FROM envsharp e
WHERE e.typenvid IS NOT NULL
  AND e.typenvid NOT IN (SELECT typenvid FROM harptypenv WHERE typenvid IS NOT NULL);

-- Étape 2.2: Mettre à NULL les valeurs orphelines dans envsharp
-- Cette approche est la plus sûre car elle évite de créer des données invalides
UPDATE envsharp
SET typenvid = NULL
WHERE typenvid IS NOT NULL
  AND typenvid NOT IN (SELECT typenvid FROM harptypenv WHERE typenvid IS NOT NULL);

-- Étape 2.3: Vérification finale
SELECT 
  CASE 
    WHEN COUNT(*) = 0 THEN 'OK: Aucune valeur orpheline restante'
    ELSE CONCAT('ATTENTION: ', COUNT(*), ' valeur(s) orpheline(s) encore présente(s)')
  END as verification_status
FROM envsharp e
WHERE e.typenvid IS NOT NULL
  AND e.typenvid NOT IN (SELECT typenvid FROM harptypenv WHERE typenvid IS NOT NULL);

-- ============================================
-- PARTIE 3: Finalisation de harptypenv.typenvid
-- ============================================

-- Étape 3.1: Rendre la colonne NOT NULL (requis pour la contrainte de clé étrangère)
-- ATTENTION: Cette étape échouera si des valeurs NULL existent encore
ALTER TABLE `harptypenv` 
MODIFY COLUMN `typenvid` INT NOT NULL;

-- ============================================
-- Vérification finale
-- ============================================
SELECT 
  'Migration terminée avec succès' as status,
  (SELECT COUNT(*) FROM harptypenv WHERE typenvid IS NOT NULL) as harptypenv_count,
  (SELECT COUNT(*) FROM envsharp WHERE typenvid IS NOT NULL) as envsharp_with_typenvid,
  (SELECT COUNT(*) FROM envsharp WHERE typenvid IS NULL) as envsharp_without_typenvid;

