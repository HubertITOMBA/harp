#!/usr/bin/env tsx
/**
 * Script pour exécuter la migration des utilisateurs depuis psadm_user vers User
 * 
 * Usage: npx tsx scripts/run-migrate-users.ts
 */

import { migrerLesUtilisateurs } from "@/lib/harp-import-core";

async function main() {
  console.log("🚀 Démarrage de la migration des utilisateurs...");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  
  try {
    const result = await migrerLesUtilisateurs();
    
    if ("error" in result && result.error) {
      console.error("❌ Erreur:", result.error);
      process.exit(1);
    } else if ("success" in result && result.success) {
      console.log("✅ Succès:", result.success);
      process.exit(0);
    } else if ("info" in result && result.info) {
      console.log("ℹ️  Info:", result.info);
      process.exit(0);
    } else {
      console.log("⚠️  Résultat inattendu:", result);
      process.exit(1);
    }
  } catch (error) {
    console.error("❌ Erreur lors de l'exécution:", error);
    process.exit(1);
  }
}

main();

