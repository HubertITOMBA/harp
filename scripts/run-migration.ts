/**
 * Script pour exécuter la migration de manière répétée
 * Réinitialise les flags et exécute la migration autant de fois que nécessaire
 * 
 * Usage: npm run migration:run
 */

import { ensureUserMigration, resetMigrationFlag } from "@/lib/init-migration";
import { resetFullMigrationFlag } from "@/lib/init-full-migration";

/**
 * Exécute la migration une fois
 */
async function runMigrationOnce() {
  console.log("\n🔄 Démarrage de la migration...");
  
  // Réinitialiser les flags pour permettre une nouvelle exécution
  resetMigrationFlag();
  resetFullMigrationFlag();
  
  try {
    const result = await ensureUserMigration();
    
    if (result.success) {
      console.log("✅ Migration réussie !");
      console.log(`   - ${result.userCount || 0} utilisateur(s)`);
      console.log(`   - ${result.envCount || 0} environnement(s)`);
      if (result.harpTablesStatus) {
        console.log("   - Tables harp*:", result.harpTablesStatus);
      }
      return true;
    } else if (result.skipped) {
      console.log(`⏭️  Migration ignorée: ${result.reason || "Raison inconnue"}`);
      if (result.userCount !== undefined) {
        console.log(`   - ${result.userCount} utilisateur(s) déjà présents`);
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
 * Exécute la migration en boucle jusqu'à ce qu'elle ne soit plus nécessaire
 */
async function runMigrationLoop() {
  let iteration = 0;
  let shouldContinue = true;
  
  while (shouldContinue) {
    iteration++;
    console.log(`\n${"=".repeat(60)}`);
    console.log(`📦 Itération ${iteration}`);
    console.log(`${"=".repeat(60)}`);
    
    const success = await runMigrationOnce();
    
    // Si la migration a été ignorée (tables non vides), arrêter
    if (!success) {
      console.log("\n⏹️  Migration non nécessaire. Arrêt de la boucle.");
      shouldContinue = false;
    } else {
      // Attendre un peu avant la prochaine itération
      console.log("\n⏳ Attente de 2 secondes avant la prochaine itération...");
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  console.log(`\n✅ Processus terminé après ${iteration} itération(s).`);
}

// Exécuter le script
runMigrationLoop().catch((error) => {
  console.error("❌ Erreur fatale:", error);
  process.exit(1);
});

export { runMigrationOnce, runMigrationLoop };

