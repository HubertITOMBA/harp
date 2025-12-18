-- Script SQL sécurisé pour ajouter le champ statut à la table psadm_info
-- Ce script vérifie d'abord si la colonne existe avant de l'ajouter
-- Compatible MySQL

-- Étape 1: Vérifier si la colonne existe déjà
-- Exécutez cette requête pour vérifier :
SELECT COUNT(*) as column_exists
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'psadm_info' 
  AND COLUMN_NAME = 'statut';

-- Si le résultat est 0 (colonne n'existe pas), alors exécutez l'ALTER TABLE ci-dessous
-- Si le résultat est 1 (colonne existe déjà), vous pouvez ignorer l'ALTER TABLE

-- Étape 2: Ajouter la colonne statut (uniquement si elle n'existe pas)
ALTER TABLE psadm_info 
ADD COLUMN statut VARCHAR(10) DEFAULT 'ACTIF' NOT NULL;

-- Étape 3: Mettre à jour les enregistrements existants (si nécessaire)
UPDATE psadm_info 
SET statut = 'ACTIF' 
WHERE statut IS NULL OR statut = '';

