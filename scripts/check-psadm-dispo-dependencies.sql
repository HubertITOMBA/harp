-- Script de diagnostic pour vérifier les dépendances de psadm_dispo
-- Exécutez ce script avant de créer psadm_dispo pour identifier les problèmes

-- 1. Vérifier l'existence de la table psadm_env
SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN '✓ Table psadm_env existe'
        ELSE '✗ Table psadm_env N''EXISTE PAS'
    END AS status_env
FROM information_schema.tables 
WHERE table_schema = DATABASE() 
  AND table_name = 'psadm_env';

-- 2. Vérifier la structure de psadm_env (colonne env)
SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN '✓ Colonne env existe dans psadm_env'
        ELSE '✗ Colonne env N''EXISTE PAS dans psadm_env'
    END AS status_env_col,
    COLUMN_TYPE,
    IS_NULLABLE,
    COLUMN_KEY
FROM information_schema.columns 
WHERE table_schema = DATABASE() 
  AND table_name = 'psadm_env'
  AND column_name = 'env';

-- 3. Vérifier si env est une clé primaire dans psadm_env
SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN '✓ Colonne env est une clé primaire dans psadm_env'
        ELSE '✗ Colonne env N''EST PAS une clé primaire dans psadm_env'
    END AS status_env_pk
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_schema = DATABASE()
  AND tc.table_name = 'psadm_env'
  AND tc.constraint_type = 'PRIMARY KEY'
  AND kcu.column_name = 'env';

-- 4. Vérifier l'existence de la table psadm_statenv
SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN '✓ Table psadm_statenv existe'
        ELSE '✗ Table psadm_statenv N''EXISTE PAS'
    END AS status_statenv
FROM information_schema.tables 
WHERE table_schema = DATABASE() 
  AND table_name = 'psadm_statenv';

-- 5. Vérifier la structure de psadm_statenv (colonne statenv)
SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN '✓ Colonne statenv existe dans psadm_statenv'
        ELSE '✗ Colonne statenv N''EXISTE PAS dans psadm_statenv'
    END AS status_statenv_col,
    COLUMN_TYPE,
    IS_NULLABLE,
    COLUMN_KEY
FROM information_schema.columns 
WHERE table_schema = DATABASE() 
  AND table_name = 'psadm_statenv'
  AND column_name = 'statenv';

-- 6. Vérifier si statenv est une clé primaire dans psadm_statenv
SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN '✓ Colonne statenv est une clé primaire dans psadm_statenv'
        ELSE '✗ Colonne statenv N''EST PAS une clé primaire dans psadm_statenv'
    END AS status_statenv_pk
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_schema = DATABASE()
  AND tc.table_name = 'psadm_statenv'
  AND tc.constraint_type = 'PRIMARY KEY'
  AND kcu.column_name = 'statenv';

-- 7. Vérifier les types de données pour s'assurer qu'ils correspondent
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

-- 8. Vérifier le moteur de stockage (doit être InnoDB pour les clés étrangères)
SELECT 
    table_name,
    engine,
    CASE 
        WHEN engine = 'InnoDB' THEN '✓ Moteur InnoDB (compatible clés étrangères)'
        ELSE '✗ Moteur ' || engine || ' (InnoDB requis pour clés étrangères)'
    END AS status_engine
FROM information_schema.tables 
WHERE table_schema = DATABASE() 
  AND table_name IN ('psadm_env', 'psadm_statenv', 'psadm_dispo');
