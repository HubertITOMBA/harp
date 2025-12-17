-- Script de correction pour les valeurs orphelines dans envsharp.typenvid
-- Ce script doit être exécuté AVANT le prisma db push

-- Étape 1: Diagnostic - Identifier les valeurs orphelines
-- Cette requête montre les valeurs typenvid dans envsharp qui n'existent pas dans harptypenv
SELECT DISTINCT e.typenvid, COUNT(*) as count
FROM envsharp e
WHERE e.typenvid IS NOT NULL
  AND e.typenvid NOT IN (SELECT typenvid FROM harptypenv WHERE typenvid IS NOT NULL)
GROUP BY e.typenvid;

-- Étape 2: Option A - Mettre à NULL les valeurs orphelines (recommandé si les données ne sont pas critiques)
-- Décommenter cette section si vous voulez mettre les valeurs orphelines à NULL
/*
UPDATE envsharp
SET typenvid = NULL
WHERE typenvid IS NOT NULL
  AND typenvid NOT IN (SELECT typenvid FROM harptypenv WHERE typenvid IS NOT NULL);
*/

-- Étape 2: Option B - Créer les entrées manquantes dans harptypenv
-- Décommenter cette section si vous voulez créer les entrées manquantes
-- ATTENTION: Cette option nécessite de connaître la valeur de typenv pour chaque typenvid orphelin
/*
-- D'abord, identifier les typenvid orphelins et leurs valeurs possibles
-- Vous devrez peut-être ajuster cette requête selon votre logique métier
INSERT INTO harptypenv (typenv, typenvid, descr)
SELECT 
  CONCAT('TYPE_', e.typenvid) as typenv,  -- À ajuster selon votre logique
  e.typenvid,
  CONCAT('Type d''environnement créé automatiquement pour typenvid ', e.typenvid) as descr
FROM (
  SELECT DISTINCT typenvid
  FROM envsharp
  WHERE typenvid IS NOT NULL
    AND typenvid NOT IN (SELECT typenvid FROM harptypenv WHERE typenvid IS NOT NULL)
) e
ON DUPLICATE KEY UPDATE descr = VALUES(descr);
*/

-- Étape 3: Vérification finale - S'assurer qu'il n'y a plus de valeurs orphelines
SELECT 
  CASE 
    WHEN COUNT(*) = 0 THEN 'OK: Aucune valeur orpheline trouvée'
    ELSE CONCAT('ATTENTION: ', COUNT(*), ' valeur(s) orpheline(s) encore présente(s)')
  END as status
FROM envsharp e
WHERE e.typenvid IS NOT NULL
  AND e.typenvid NOT IN (SELECT typenvid FROM harptypenv WHERE typenvid IS NOT NULL);

