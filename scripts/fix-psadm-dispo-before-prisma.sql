-- Script à exécuter AVANT d'appliquer la migration Prisma pour psadm_dispo
-- Ce script prépare les tables référencées et crée psadm_dispo correctement

-- ============================================
-- ÉTAPE 1: Vérifier et corriger psadm_env
-- ============================================

-- Vérifier si psadm_env existe et a la bonne structure
-- Si la table n'existe pas, vous devez la créer d'abord avec Prisma ou manuellement

-- S'assurer que la colonne env est bien la clé primaire
-- (Normalement déjà fait si la table a été créée avec Prisma)

-- ============================================
-- ÉTAPE 2: Vérifier et corriger psadm_statenv
-- ============================================

-- Vérifier si psadm_statenv existe et a la bonne structure
-- Si la table n'existe pas, vous devez la créer d'abord avec Prisma ou manuellement

-- S'assurer que la colonne statenv est bien la clé primaire
-- (Normalement déjà fait si la table a été créée avec Prisma)

-- ============================================
-- ÉTAPE 3: Supprimer psadm_dispo si elle existe déjà (avec ses contraintes)
-- ============================================

-- Supprimer les contraintes de clé étrangère si elles existent
SET @constraint_exists_1 = (
    SELECT COUNT(*) 
    FROM information_schema.table_constraints 
    WHERE table_schema = DATABASE() 
      AND table_name = 'psadm_dispo' 
      AND constraint_name = 'psadm_dispo_ibfk_1'
);

SET @constraint_exists_2 = (
    SELECT COUNT(*) 
    FROM information_schema.table_constraints 
    WHERE table_schema = DATABASE() 
      AND table_name = 'psadm_dispo' 
      AND constraint_name = 'psadm_dispo_ibfk_2'
);

SET @sql1 = IF(@constraint_exists_1 > 0, 
    'ALTER TABLE `psadm_dispo` DROP FOREIGN KEY `psadm_dispo_ibfk_1`', 
    'SELECT "Contrainte psadm_dispo_ibfk_1 n''existe pas" AS message');
PREPARE stmt1 FROM @sql1;
EXECUTE stmt1;
DEALLOCATE PREPARE stmt1;

SET @sql2 = IF(@constraint_exists_2 > 0, 
    'ALTER TABLE `psadm_dispo` DROP FOREIGN KEY `psadm_dispo_ibfk_2`', 
    'SELECT "Contrainte psadm_dispo_ibfk_2 n''existe pas" AS message');
PREPARE stmt2 FROM @sql2;
EXECUTE stmt2;
DEALLOCATE PREPARE stmt2;

-- Supprimer la table si elle existe
DROP TABLE IF EXISTS `psadm_dispo`;

-- ============================================
-- ÉTAPE 4: Vérifier que les tables référencées existent
-- ============================================

-- Vérifier psadm_env
SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN '✓ Table psadm_env existe'
        ELSE '✗ ERREUR: Table psadm_env N''EXISTE PAS - Créez-la d''abord!'
    END AS status_env
FROM information_schema.tables 
WHERE table_schema = DATABASE() 
  AND table_name = 'psadm_env';

-- Vérifier psadm_statenv
SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN '✓ Table psadm_statenv existe'
        ELSE '✗ ERREUR: Table psadm_statenv N''EXISTE PAS - Créez-la d''abord!'
    END AS status_statenv
FROM information_schema.tables 
WHERE table_schema = DATABASE() 
  AND table_name = 'psadm_statenv';

-- ============================================
-- ÉTAPE 5: Vérifier que les colonnes référencées sont des clés primaires
-- ============================================

-- Vérifier que env est une clé primaire dans psadm_env
SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN '✓ Colonne env est une clé primaire dans psadm_env'
        ELSE '✗ ERREUR: Colonne env N''EST PAS une clé primaire dans psadm_env'
    END AS status_env_pk
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
WHERE tc.table_schema = DATABASE()
  AND tc.table_name = 'psadm_env'
  AND tc.constraint_type = 'PRIMARY KEY'
  AND kcu.column_name = 'env';

-- Vérifier que statenv est une clé primaire dans psadm_statenv
SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN '✓ Colonne statenv est une clé primaire dans psadm_statenv'
        ELSE '✗ ERREUR: Colonne statenv N''EST PAS une clé primaire dans psadm_statenv'
    END AS status_statenv_pk
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
WHERE tc.table_schema = DATABASE()
  AND tc.table_name = 'psadm_statenv'
  AND tc.constraint_type = 'PRIMARY KEY'
  AND kcu.column_name = 'statenv';

-- ============================================
-- ÉTAPE 6: Vérifier les types de données
-- ============================================

SELECT 
    'psadm_env.env' AS table_column,
    COLUMN_TYPE,
    CHARACTER_SET_NAME,
    COLLATION_NAME
FROM information_schema.columns 
WHERE table_schema = DATABASE() 
  AND table_name = 'psadm_env'
  AND column_name = 'env'
UNION ALL
SELECT 
    'psadm_statenv.statenv' AS table_column,
    COLUMN_TYPE,
    CHARACTER_SET_NAME,
    COLLATION_NAME
FROM information_schema.columns 
WHERE table_schema = DATABASE() 
  AND table_name = 'psadm_statenv'
  AND column_name = 'statenv';

-- ============================================
-- ÉTAPE 7: Vérifier le moteur de stockage (doit être InnoDB)
-- ============================================

SELECT 
    table_name,
    engine,
    CASE 
        WHEN engine = 'InnoDB' THEN '✓ Moteur InnoDB (compatible clés étrangères)'
        ELSE CONCAT('✗ ERREUR: Moteur ', engine, ' (InnoDB requis pour clés étrangères)')
    END AS status_engine
FROM information_schema.tables 
WHERE table_schema = DATABASE() 
  AND table_name IN ('psadm_env', 'psadm_statenv');

-- ============================================
-- NOTE IMPORTANTE
-- ============================================
-- Si toutes les vérifications sont OK (✓), vous pouvez maintenant :
-- 1. Exécuter: npx prisma migrate dev
-- 2. Ou appliquer la migration manuellement avec le script create-psadm-dispo.sql
-- 
-- Si des erreurs apparaissent (✗), corrigez-les d'abord avant de continuer.
