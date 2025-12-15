-- Script SQL pour restructurer la table harptaskitem
-- 1. Supprimer la colonne title (redondante avec harpitems.descr)
-- 2. Supprimer la colonne predecessorNetid (remplacée par predecessorId)
-- 3. Ajouter la contrainte de clé étrangère vers User via resourceNetid

-- 1. Supprimer la colonne title si elle existe
ALTER TABLE `harptaskitem` 
DROP COLUMN IF EXISTS `title`;

-- 2. Supprimer la colonne predecessorNetid si elle existe
ALTER TABLE `harptaskitem` 
DROP COLUMN IF EXISTS `predecessorNetid`;

-- 3. S'assurer que resourceNetid peut être NULL (déjà le cas normalement)
-- ALTER TABLE `harptaskitem` MODIFY COLUMN `resourceNetid` VARCHAR(32) NULL;

-- 4. Ajouter la contrainte de clé étrangère vers User
-- Note: La relation se fait via resourceNetid -> User.netid
-- On doit d'abord s'assurer que tous les resourceNetid existants dans harptaskitem
-- correspondent à des netid valides dans User, ou sont NULL

-- Vérifier les données avant d'ajouter la FK
-- SELECT DISTINCT a.resourceNetid 
-- FROM harptaskitem a 
-- LEFT JOIN User d ON a.resourceNetid = d.netid 
-- WHERE a.resourceNetid IS NOT NULL AND d.netid IS NULL;

-- Ajouter la contrainte de clé étrangère (si toutes les données sont valides)
ALTER TABLE `harptaskitem`
ADD CONSTRAINT `harptaskitem_resourceNetid_fkey`
FOREIGN KEY (`resourceNetid`)
REFERENCES `User`(`netid`)
ON DELETE SET NULL
ON UPDATE CASCADE;
