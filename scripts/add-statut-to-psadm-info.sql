-- Script SQL pour ajouter le champ statut à la table psadm_info
-- Ce script ajoute une colonne statut avec une valeur par défaut "ACTIF" pour les enregistrements existants
-- Compatible MySQL (ne supporte pas IF NOT EXISTS dans ALTER TABLE)

-- Vérifier si la colonne existe déjà et l'ajouter si nécessaire
-- Note: Si la colonne existe déjà, cette commande générera une erreur que vous pouvez ignorer
-- ou exécutez d'abord la vérification ci-dessous

-- Option 1: Ajouter directement (générera une erreur si la colonne existe déjà)
-- ALTER TABLE psadm_info 
-- ADD COLUMN statut VARCHAR(10) DEFAULT 'ACTIF' NOT NULL;

-- Option 2: Vérifier d'abord si la colonne existe (recommandé)
-- Exécutez cette requête pour vérifier si la colonne existe :
-- SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
-- WHERE TABLE_SCHEMA = DATABASE() 
-- AND TABLE_NAME = 'psadm_info' 
-- AND COLUMN_NAME = 'statut';

-- Si le résultat est 0, alors exécutez :
ALTER TABLE psadm_info 
ADD COLUMN statut VARCHAR(10) DEFAULT 'ACTIF' NOT NULL;

-- Mettre à jour tous les enregistrements existants pour qu'ils soient ACTIF par défaut
-- (Normalement inutile car DEFAULT 'ACTIF' le fait déjà, mais au cas où)
UPDATE psadm_info 
SET statut = 'ACTIF' 
WHERE statut IS NULL OR statut = '';

