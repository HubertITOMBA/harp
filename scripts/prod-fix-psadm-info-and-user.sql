-- ============================================================
-- Script PROD : à exécuter une seule fois (base dbportal)
-- ============================================================
-- 1) Ajouter la colonne statut à psadm_info (page /list/messages)
-- 2) Nettoyer les lastlogin invalides dans psadm_user (page /list/users)
--
-- Exécution : mysql -h HOST -u USER -p dbportal < prod-fix-psadm-info-and-user.sql
-- Ou coller le contenu dans MySQL Workbench / DBeaver et exécuter.
-- Si l'ALTER échoue avec "Duplicate column name 'statut'", la colonne
-- existe déjà : ignorer et exécuter uniquement la partie 2.

-- ----------------------------------------
-- 1) psadm_info : colonne statut
-- ----------------------------------------
ALTER TABLE psadm_info
  ADD COLUMN statut VARCHAR(10) NOT NULL DEFAULT 'ACTIF';

-- ----------------------------------------
-- 2) psadm_user : lastlogin invalides (évite P2020 au build)
-- ----------------------------------------
UPDATE psadm_user
SET lastlogin = NULL
WHERE lastlogin < '1900-01-01' OR lastlogin = '0000-00-00 00:00:00';

UPDATE user SET role = 'PSADMIN' WHERE netid = 'hitomba';
