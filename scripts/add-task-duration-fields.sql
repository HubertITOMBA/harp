-- Script SQL pour ajouter les champs date, estimatedDuration et effectiveDuration à harptask
-- À exécuter manuellement dans MySQL

-- 1. Ajouter la colonne date (date de début prévue)
ALTER TABLE `harptask` 
ADD COLUMN IF NOT EXISTS `date` DATETIME NULL AFTER `status`,
ADD INDEX IF NOT EXISTS `harptask_date_idx` (`date`);

-- 2. Ajouter la colonne estimatedDuration (durée estimée en minutes)
ALTER TABLE `harptask` 
ADD COLUMN IF NOT EXISTS `estimatedDuration` INT NULL AFTER `date`;

-- 3. Ajouter la colonne effectiveDuration (durée effective calculée en minutes)
ALTER TABLE `harptask` 
ADD COLUMN IF NOT EXISTS `effectiveDuration` INT NULL AFTER `estimatedDuration`;

-- 4. Fonction pour calculer et mettre à jour la durée effective d'une chrono-tâche
-- Cette fonction calcule la somme des durées effectives de tous les items (endDate - startDate)
DELIMITER $$

CREATE FUNCTION IF NOT EXISTS `calculate_task_effective_duration`(task_id INT) 
RETURNS INT
READS SQL DATA
DETERMINISTIC
BEGIN
  DECLARE total_duration INT DEFAULT 0;
  
  SELECT COALESCE(SUM(
    CASE 
      WHEN `endDate` IS NOT NULL AND `startDate` IS NOT NULL THEN
        TIMESTAMPDIFF(MINUTE, `startDate`, `endDate`)
      ELSE 0
    END
  ), 0) INTO total_duration
  FROM `harptaskitem`
  WHERE `taskId` = task_id;
  
  RETURN total_duration;
END$$

DELIMITER ;

-- 5. Trigger pour mettre à jour automatiquement effectiveDuration lors de modifications sur harptaskitem
DELIMITER $$

DROP TRIGGER IF EXISTS `update_task_effective_duration_after_insert`$$
CREATE TRIGGER `update_task_effective_duration_after_insert`
AFTER INSERT ON `harptaskitem`
FOR EACH ROW
BEGIN
  UPDATE `harptask`
  SET `effectiveDuration` = `calculate_task_effective_duration`(NEW.`taskId`)
  WHERE `id` = NEW.`taskId`;
END$$

DROP TRIGGER IF EXISTS `update_task_effective_duration_after_update`$$
CREATE TRIGGER `update_task_effective_duration_after_update`
AFTER UPDATE ON `harptaskitem`
FOR EACH ROW
BEGIN
  IF NEW.`taskId` != OLD.`taskId` OR NEW.`startDate` != OLD.`startDate` OR NEW.`endDate` != OLD.`endDate` THEN
    -- Mettre à jour l'ancienne tâche si taskId a changé
    IF NEW.`taskId` != OLD.`taskId` THEN
      UPDATE `harptask`
      SET `effectiveDuration` = `calculate_task_effective_duration`(OLD.`taskId`)
      WHERE `id` = OLD.`taskId`;
    END IF;
    
    -- Mettre à jour la nouvelle tâche
    UPDATE `harptask`
    SET `effectiveDuration` = `calculate_task_effective_duration`(NEW.`taskId`)
    WHERE `id` = NEW.`taskId`;
  END IF;
END$$

DROP TRIGGER IF EXISTS `update_task_effective_duration_after_delete`$$
CREATE TRIGGER `update_task_effective_duration_after_delete`
AFTER DELETE ON `harptaskitem`
FOR EACH ROW
BEGIN
  UPDATE `harptask`
  SET `effectiveDuration` = `calculate_task_effective_duration`(OLD.`taskId`)
  WHERE `id` = OLD.`taskId`;
END$$

DELIMITER ;

-- 6. Calculer la durée effective pour toutes les chrono-tâches existantes
UPDATE `harptask` t
SET t.`effectiveDuration` = (
  SELECT COALESCE(SUM(
    CASE 
      WHEN i.`endDate` IS NOT NULL AND i.`startDate` IS NOT NULL THEN
        TIMESTAMPDIFF(MINUTE, i.`startDate`, i.`endDate`)
      ELSE 0
    END
  ), 0)
  FROM `harptaskitem` i
  WHERE i.`taskId` = t.`id`
);
