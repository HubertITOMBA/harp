/**
 * Composant serveur pour initialiser la migration automatique
 * S'exécute uniquement côté serveur dans le Node.js runtime
 * 
 * Ce composant vérifie si la migration est nécessaire et redirige vers /init
 * si la table User et toutes les tables harp* sont vides
 * 
 * IMPORTANT: Ce composant s'exécute sur Node.js runtime, pas Edge runtime,
 * donc Prisma Client fonctionne correctement ici.
 */

import { ensureUserMigration } from "@/lib/init-migration";
import { isMigrationInProgress } from "@/lib/init-full-migration";
import { redirect } from "next/navigation";

/**
 * Composant qui initialise la migration au chargement de la page
 * Redirige vers /init si la migration est nécessaire ou en cours
 * 
 * Ce composant synchronise automatiquement les utilisateurs pour garantir
 * que l'authentification fonctionne, même si la table User n'est pas vide.
 */
export async function MigrationInit() {
  // Vérifier si une migration complète est en cours
  if (isMigrationInProgress()) {
    redirect("/init");
  }

  // Vérifier et synchroniser les utilisateurs
  // Cette fonction force l'import des utilisateurs manquants même si la table User n'est pas vide
  // Elle s'exécute sur Node.js runtime, donc Prisma fonctionne correctement
  const result = await ensureUserMigration();
  
  // Si la migration est nécessaire (base vide), rediriger vers /init
  // La page /init exécutera la migration complète
  if (result && !result.success && !result.skipped) {
    // Si la table n'existe pas, on laisse l'utilisateur voir la page d'accueil
    // car il devra d'abord exécuter prisma db push
    if (!result.requiresPrismaMigration) {
      redirect("/init");
    }
  }

  // Si la migration est en cours, rediriger vers /init
  if (isMigrationInProgress()) {
    redirect("/init");
  }

  // Ce composant ne rend rien visuellement
  return null;
}

