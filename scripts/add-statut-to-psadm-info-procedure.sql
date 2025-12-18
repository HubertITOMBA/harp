-- Script SQL avec procédure stockée pour ajouter le champ statut de manière sécurisée
-- Ce script crée une procédure qui vérifie l'existence de la colonne avant de l'ajouter
-- Compatible MySQL

DELIMITER $$

DROP PROCEDURE IF EXISTS AddStatutColumnIfNotExists$$

CREATE PROCEDURE AddStatutColumnIfNotExists()
BEGIN
    DECLARE column_exists INT DEFAULT 0;
    
    -- Vérifier si la colonne existe
    SELECT COUNT(*) INTO column_exists
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'psadm_info' 
      AND COLUMN_NAME = 'statut';
    
    -- Ajouter la colonne seulement si elle n'existe pas
    IF column_exists = 0 THEN
        ALTER TABLE psadm_info 
        ADD COLUMN statut VARCHAR(10) DEFAULT 'ACTIF' NOT NULL;
        
        SELECT 'Colonne statut ajoutée avec succès' AS result;
    ELSE
        SELECT 'Colonne statut existe déjà' AS result;
    END IF;
    
    -- Mettre à jour les enregistrements existants
    UPDATE psadm_info 
    SET statut = 'ACTIF' 
    WHERE statut IS NULL OR statut = '';
    
    SELECT 'Mise à jour des enregistrements terminée' AS result;
END$$

DELIMITER ;

-- Exécuter la procédure
CALL AddStatutColumnIfNotExists();

-- Supprimer la procédure après utilisation (optionnel)
-- DROP PROCEDURE IF EXISTS AddStatutColumnIfNotExists;

