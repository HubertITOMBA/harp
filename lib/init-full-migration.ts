/**
 * Système d'initialisation complète de la base de données
 * Exécute toutes les fonctions d'import séquentiellement
 * S'exécute une seule fois lorsque la base est vide
 */

import prisma from "@/lib/prisma";
import {
  initDefaultValues,
  insertTypeBases,
  GenererLesMenus,
  importerLesStatus,
  importerLesPsoftVersions,
  importerLesPToolsVersions,
  migrateReleaseData,
  importerLesTypesEnv,
  lierEnvauTypeEnv,
  importerLesHarproles,
  migrateServers,
  importerOraInstances,
  updateInstanceServerIds,
  importerLesEnvServeurs,
  updateEnvsharpInstanceIds,
  updateEnvsharpOrarelease,
  importListEnvs,
  importInstanceOra,
  importerLesEnvInfos,
  updateDispoEnvIds,
  importerLesEnvDispos,
  migrerLesUtilisateursNEW,
  migrerLesRolesUtilisateurs,
  updateReleaseEnvIds,
  importerLesMonitors,
} from "@/actions/importharp";

// Variables de contrôle pour éviter les exécutions multiples
let migrationExecuted = false;
let migrationInProgress = false;
let migrationPromise: Promise<{
  success?: boolean;
  skipped?: boolean;
  error?: string;
  userCount?: number;
  envCount?: number;
  harpTablesStatus?: Record<string, number>;
  requiresPrismaMigration?: boolean;
  reason?: string;
  results?: Array<{ step: number; name: string; result: { success?: string; error?: string; info?: string } | null; error?: string }>;
  totalSteps?: number;
  completedSteps?: number;
}> | null = null;

/**
 * Définition de l'ordre d'exécution des fonctions d'import
 * L'ordre est important car certaines fonctions dépendent des résultats des précédentes
 */
const IMPORT_FUNCTIONS = [
  { name: "Ajuster les valeurs nulles", func: initDefaultValues, step: 1 },
  { name: "Ajouter les types de bases", func: insertTypeBases, step: 2 },
  { name: "Générer les Menus", func: GenererLesMenus, step: 3 },
  { name: "Importer les statuts d'environnement", func: importerLesStatus, step: 4 },
  { name: "Importer les versions PeopleSoft", func: importerLesPsoftVersions, step: 5 },
  { name: "Importer les versions PeopleTools", func: importerLesPToolsVersions, step: 6 },
  { name: "Importer les Harp Release", func: migrateReleaseData, step: 7 },
  { name: "Importer les types d'environnements", func: importerLesTypesEnv, step: 8 },
  { name: "Lier les types d'environnement", func: lierEnvauTypeEnv, step: 9 },
  { name: "Importer les rôles", func: importerLesHarproles, step: 10 },
  { name: "Importer les serveurs", func: migrateServers, step: 11 },
  { name: "Importer les instances Oracle", func: importerOraInstances, step: 12 },
  { name: "Mettre à jour les IDs serveurs des instances", func: updateInstanceServerIds, step: 13 },
  { name: "Importer les environnements serveurs", func: importerLesEnvServeurs, step: 14 },
  { name: "Mettre à jour les IDs instances dans les environnements", func: updateEnvsharpInstanceIds, step: 15 },
  { name: "Mettre à jour les versions Oracle", func: updateEnvsharpOrarelease, step: 16 },
  { name: "Importer les environnements HARP", func: importListEnvs, step: 17 },
  { name: "Importer les instances d'environnements", func: importInstanceOra, step: 18 },
  { name: "Importer l'historique des environnements", func: importerLesEnvInfos, step: 19 },
  { name: "Mettre à jour les disponibilités", func: updateDispoEnvIds, step: 20 },
  { name: "Importer les indisponibilités", func: importerLesEnvDispos, step: 21 },
  { name: "Importer les données de monitoring", func: importerLesMonitors, step: 22 },
  { name: "Migrer les utilisateurs", func: migrerLesUtilisateursNEW, step: 23 },
  { name: "Migrer les rôles utilisateurs", func: migrerLesRolesUtilisateurs, step: 24 },
  { name: "Lier les environnements aux releases", func: updateReleaseEnvIds, step: 25 },
];

/**
 * Liste des tables commençant par 'harp' à vérifier
 */
const HARP_TABLES = [
  'harpora',
  'harpenvdispo',
  'harpinstance',
  'harptypebase',
  'harpserve',
  'harpenvserv',
  'harptypenv',
  'harpenvinfo',
  'harpmonitor',
  'harpmenus',
  'harpmenurole',
  'harproles',
  'harpuseroles',
  'harpevent',
] as const;

/**
 * Vérifie si la table User et toutes les tables harp* sont vides
 */
async function areTablesEmpty(): Promise<{ isEmpty: boolean; userCount: number; harpTablesStatus: Record<string, number> }> {
  const harpTablesStatus: Record<string, number> = {};
  let userCount = 0;
  
  try {
    // Vérifier la table User
    userCount = await prisma.user.count();
  } catch (error) {
    console.error("[Init Migration] Erreur lors de la vérification de la table User:", error);
    return { isEmpty: false, userCount: 0, harpTablesStatus };
  }

  // Vérifier toutes les tables harp*
  let allHarpTablesEmpty = true;
  for (const tableName of HARP_TABLES) {
    try {
      // Utiliser une requête SQL brute pour compter les lignes
      // Note: Prisma ne permet pas d'utiliser des noms de tables dynamiques dans les template literals
      // On utilise donc $queryRawUnsafe avec une chaîne complète
      const result = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
        `SELECT COUNT(*) as count FROM \`${tableName}\``
      );
      const count = Number(result[0]?.count || 0);
      harpTablesStatus[tableName] = count;
      
      if (count > 0) {
        allHarpTablesEmpty = false;
      }
    } catch (error) {
      // Si la table n'existe pas encore, on la considère comme vide
      console.warn(`[Init Migration] Table ${tableName} non accessible (peut ne pas exister encore):`, error);
      harpTablesStatus[tableName] = 0;
    }
  }

  const isEmpty = userCount === 0 && allHarpTablesEmpty;
  return { isEmpty, userCount, harpTablesStatus };
}

/**
 * Exécute toutes les fonctions d'import séquentiellement
 * S'exécute uniquement si la table User ET toutes les tables harp* sont vides
 */
export async function ensureFullDatabaseMigration() {
  // Si une migration est déjà en cours, retourner la même promesse
  if (migrationInProgress && migrationPromise) {
    console.log("[Init Migration] Migration déjà en cours, réutilisation de la promesse...");
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

      // Vérifier si la table User existe
      try {
        await prisma.user.count();
      } catch {
        // Si la table n'existe pas, on doit d'abord créer les tables avec Prisma
        console.error("[Init Migration] ❌ La table User n'existe pas encore dans la base de données.");
        console.error("[Init Migration] 💡 Veuillez exécuter: npx prisma db push");
        migrationInProgress = false;
        migrationPromise = null;
        return {
          success: false,
          error: "La table User n'existe pas encore. Veuillez exécuter 'npx prisma db push' ou 'npx prisma migrate dev' pour créer les tables.",
          requiresPrismaMigration: true
        };
      }

      // Vérifier si toutes les tables (User + harp*) sont vides
      const { isEmpty, userCount: checkedUserCount, harpTablesStatus } = await areTablesEmpty();
      
      if (!isEmpty) {
        console.log(`[Init Migration] Les tables contiennent déjà des données. Migration non nécessaire.`);
        console.log(`[Init Migration] - User: ${checkedUserCount} enregistrement(s)`);
        console.log(`[Init Migration] - Tables harp*:`, harpTablesStatus);
        migrationExecuted = true;
        migrationInProgress = false;
        migrationPromise = null;
        return { 
          skipped: true, 
          reason: "Tables non vides", 
          userCount: checkedUserCount,
          harpTablesStatus 
        };
      }

      console.log("[Init Migration] ⚠️  La table User et toutes les tables harp* sont vides. Démarrage de l'initialisation complète...");
      console.log(`[Init Migration] ${IMPORT_FUNCTIONS.length} étapes à exécuter`);

      const results: Array<{ step: number; name: string; result: { success?: string; error?: string; info?: string } | null; error?: string }> = [];

      // Exécuter chaque fonction séquentiellement
      for (const { name, func, step } of IMPORT_FUNCTIONS) {
        try {
          console.log(`[Init Migration] Étape ${step}/${IMPORT_FUNCTIONS.length}: ${name}...`);
          
          const result = await func();
          
          results.push({
            step,
            name,
            result,
          });

          if (result && 'error' in result && result.error) {
            console.error(`[Init Migration] ❌ Erreur à l'étape ${step} (${name}):`, result.error);
            // Continuer malgré l'erreur pour ne pas bloquer les autres imports
          } else if (result && 'success' in result && result.success) {
            console.log(`[Init Migration] ✅ Étape ${step} terminée: ${result.success}`);
          } else if (result && 'info' in result && result.info) {
            console.log(`[Init Migration] ℹ️  Étape ${step}: ${result.info}`);
          }

          // Délai entre les étapes pour éviter de surcharger la base et le pool de connexions
          // Délai plus long pour laisser le pool de connexions se récupérer
          await new Promise(resolve => setTimeout(resolve, 500));

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
          console.error(`[Init Migration] ❌ Exception à l'étape ${step} (${name}):`, errorMessage);
          results.push({
            step,
            name,
            result: null,
            error: errorMessage,
          });
          // Continuer malgré l'erreur
        }
      }

      // Vérifier le résultat final
      const finalUserCount = await prisma.user.count().catch(() => 0);
      const finalEnvCount = await prisma.envsharp.count().catch(() => 0);
      
      // Vérifier les tables harp* après migration
      const finalHarpTablesStatus: Record<string, number> = {};
      for (const tableName of HARP_TABLES) {
        try {
          const result = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
            `SELECT COUNT(*) as count FROM \`${tableName}\``
          );
          finalHarpTablesStatus[tableName] = Number(result[0]?.count || 0);
        } catch {
          finalHarpTablesStatus[tableName] = 0;
        }
      }
      
      console.log(`[Init Migration] ✅ Initialisation complète terminée !`);
      console.log(`[Init Migration] - ${finalUserCount} utilisateur(s)`);
      console.log(`[Init Migration] - ${finalEnvCount} environnement(s)`);
      console.log(`[Init Migration] - Tables harp*:`, finalHarpTablesStatus);

      migrationExecuted = true;
      migrationInProgress = false;
      migrationPromise = null;

      return {
        success: true,
        userCount: finalUserCount,
        envCount: finalEnvCount,
        harpTablesStatus: finalHarpTablesStatus,
        results,
        totalSteps: IMPORT_FUNCTIONS.length,
        completedSteps: results.filter(r => !r.error).length,
      };

    } catch (error) {
      console.error("[Init Migration] ❌ Erreur critique lors de l'initialisation:", error);
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
export function resetFullMigrationFlag() {
  migrationExecuted = false;
  migrationInProgress = false;
  migrationPromise = null;
}

/**
 * Vérifie si la migration est en cours
 */
export function isMigrationInProgress(): boolean {
  return migrationInProgress;
}

/**
 * Vérifie si la migration a été exécutée
 */
export function isMigrationExecuted(): boolean {
  return migrationExecuted;
}

