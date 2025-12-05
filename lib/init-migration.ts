/**
 * Système d'initialisation automatique de la migration des utilisateurs
 * S'exécute une seule fois au premier démarrage de l'application
 * lorsque la table User est vide
 */

import prisma from "@/lib/prisma";
import { migrerLesUtilisateurs, migrerLesUtilisateursNEW, migrerLesRolesUtilisateurs } from "@/actions/importharp";
import { ensureFullDatabaseMigration } from "./init-full-migration";

// Variables de contrôle pour éviter les exécutions multiples
let migrationExecuted = false;
let migrationInProgress = false;
let migrationPromise: Promise<any> | null = null;

/**
 * Vérifie si la migration doit être exécutée et l'exécute si nécessaire
 * Cette fonction est idempotente et thread-safe
 */
export async function ensureUserMigration() {
  // Si une migration est déjà en cours, retourner la même promesse
  if (migrationInProgress && migrationPromise) {
    console.log("[Migration] Migration déjà en cours, réutilisation de la promesse...");
    return migrationPromise;
  }

  // Si la migration a déjà été exécutée avec succès, ne pas réessayer
  if (migrationExecuted) {
    return { skipped: true, reason: "Migration déjà exécutée" };
  }

  // Créer une promesse unique pour cette migration
  migrationPromise = (async () => {
    try {
      migrationInProgress = true;

    // Vérifier si la table User existe et si elle est vide
    let userCount = 0;
    try {
      userCount = await prisma.user.count();
    } catch (error) {
      // Si la table n'existe pas, on doit d'abord créer les tables avec Prisma
      console.error("[Migration] ❌ La table User n'existe pas encore dans la base de données.");
      console.error("[Migration] 💡 Veuillez exécuter: npx prisma db push");
      migrationInProgress = false;
      migrationPromise = null;
      return {
        success: false,
        error: "La table User n'existe pas encore. Veuillez exécuter 'npx prisma db push' ou 'npx prisma migrate dev' pour créer les tables.",
        requiresPrismaMigration: true
      };
    }
    
    // FORCER l'import des utilisateurs manquants même si la table User n'est pas vide
    // La table User contient les authentifications, donc on doit toujours synchroniser
    if (userCount > 0) {
      console.log(`[Migration] La table User contient déjà ${userCount} utilisateur(s). Synchronisation des utilisateurs manquants...`);
      
      // Utiliser migrerLesUtilisateurs() qui force l'import des utilisateurs manquants
      const usersResult = await migrerLesUtilisateurs();
      
      if (usersResult.error) {
        console.error(`[Migration] Erreur lors de la synchronisation des utilisateurs: ${usersResult.error}`);
        // Ne pas bloquer si l'erreur est que psadm_user est vide
        if (usersResult.error.includes("psadm_user est vide")) {
          return { skipped: true, reason: "Table psadm_user vide, aucun utilisateur à synchroniser", userCount };
        }
      } else if (usersResult.success) {
        console.log(`[Migration] ${usersResult.success}`);
      } else if (usersResult.info) {
        console.log(`[Migration] ${usersResult.info}`);
      }
      
      // Migrer aussi les rôles des utilisateurs
      try {
        const rolesResult = await migrerLesRolesUtilisateurs();
        if (rolesResult.success) {
          console.log(`[Migration] ${rolesResult.success}`);
        } else if (rolesResult.info) {
          console.log(`[Migration] ${rolesResult.info}`);
        }
      } catch (rolesError) {
        console.warn(`[Migration] Avertissement lors de la migration des rôles:`, rolesError);
      }
      
      // Mettre à jour le compteur après synchronisation
      const newUserCount = await prisma.user.count();
      migrationExecuted = true;
      migrationInProgress = false;
      migrationPromise = null;
      
      return { 
        success: true, 
        reason: "Synchronisation des utilisateurs terminée", 
        userCount: newUserCount,
        usersMigration: usersResult,
        rolesMigration: { success: true }
      };
    }

    // Si la base est vide, utiliser la migration complète au lieu de seulement les utilisateurs
    console.log("[Migration] ⚠️  La base de données est vide. Démarrage de la migration complète...");
    
    // Déléguer à la migration complète qui gère tous les imports
    const fullMigrationResult = await ensureFullDatabaseMigration();
    
    migrationExecuted = true;
    migrationInProgress = false;
    migrationPromise = null;

    return fullMigrationResult;

    } catch (error) {
      console.error("[Migration] ❌ Erreur critique lors de la migration:", error);
      migrationInProgress = false;
      migrationPromise = null;
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erreur inconnue"
      };
    }
  })();

  return migrationPromise;
}

/**
 * Réinitialise le flag de migration (utile pour les tests)
 */
export function resetMigrationFlag() {
  migrationExecuted = false;
  migrationInProgress = false;
}

