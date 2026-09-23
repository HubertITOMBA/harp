/**
 * Lance la charge GO LIVE une fois.
 * Sans argument : mode initial, destinations modernes vides.
 * Avec --reprise : termine une charge interrompue, sans purge.
 *
 * Usage: npm run migration:init
 *        npm run migration:init -- --reprise
 */

import { ensureFullDatabaseMigration, resetFullMigrationFlag, type GoLiveMode } from "@/lib/init-full-migration";
import { resetMigrationFlag } from "@/lib/init-migration";

function goLiveModeFromArgs(): GoLiveMode {
  return process.argv.includes("--reprise") ? "reprise" : "initial";
}

/**
 * Exécute la charge GO LIVE une fois, dans le mode demandé.
 */
async function runInitMigrationOnce() {
  const mode = goLiveModeFromArgs();
  console.log(`\nDémarrage de la charge GO LIVE en mode ${mode}.`);
  
  // Réinitialiser les flags pour permettre une nouvelle exécution
  resetMigrationFlag();
  resetFullMigrationFlag();
  
  try {
    const result = await ensureFullDatabaseMigration(mode);
    
    if (result.success) {
      console.log("✅ Migration complète réussie !");
      console.log(`   - ${result.userCount || 0} utilisateur(s)`);
      console.log(`   - ${result.envCount || 0} environnement(s)`);
      if (result.harpTablesStatus) {
        console.log("   - Tables harp*:", result.harpTablesStatus);
      }
      if (result.totalSteps && result.completedSteps !== undefined) {
        console.log(`   - ${result.completedSteps}/${result.totalSteps} étapes complétées`);
      }
      return true;
    } else if (result.skipped) {
      console.log(`⏭️  Migration ignorée: ${result.reason || "Raison inconnue"}`);
      if (result.userCount !== undefined) {
        console.log(`   - ${result.userCount} utilisateur(s) déjà présents`);
      }
      if (result.harpTablesStatus) {
        console.log("   - Tables harp*:", result.harpTablesStatus);
      }
      return false;
    } else if (result.error) {
      console.error(`❌ Erreur lors de la migration: ${result.error}`);
      if (result.requiresPrismaMigration) {
        console.error("💡 Veuillez exécuter: npx prisma db push");
      }
      return false;
    }
    
    return false;
  } catch (error) {
    console.error("❌ Erreur critique:", error);
    return false;
  }
}

/**
 * Exécute la migration complète en boucle jusqu'à ce qu'elle ne soit plus nécessaire
 */
async function runInitMigrationLoop() {
  let iteration = 0;
  let shouldContinue = true;
  
  while (shouldContinue) {
    iteration++;
    console.log(`\n${"=".repeat(60)}`);
    console.log(`📦 Itération ${iteration} - Migration complète (comme /init)`);
    console.log(`${"=".repeat(60)}`);
    
    const success = await runInitMigrationOnce();

    // Une seule passe. Le succès ne relance pas la charge.
    // Un échec ne purge rien : la reprise se fait avec --reprise.
    if (success) {
      console.log("\nCharge GO LIVE terminée.");
    } else {
      console.log("\nCharge GO LIVE arrêtée. Aucune purge. Reprise possible avec --reprise.");
    }
    shouldContinue = false;
  }
  
  console.log(`\n✅ Processus terminé après ${iteration} itération(s).`);
}

// Exécuter le script
runInitMigrationLoop().catch((error) => {
  console.error("❌ Erreur fatale:", error);
  process.exit(1);
});

export { runInitMigrationOnce, runInitMigrationLoop };

