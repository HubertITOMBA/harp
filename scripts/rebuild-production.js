#!/usr/bin/env node

/**
 * Script de rebuild pour la production
 * 
 * Ce script :
 * 1. Vérifie que les variables d'environnement sont définies
 * 2. Supprime le dossier .next
 * 3. Rebuild avec les bonnes variables
 * 4. Vérifie que le build utilise les bonnes URLs
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PRODUCTION_URL = 'https://portails.orange-harp.fr:9352';

/**
 * Charge les variables d'environnement depuis un fichier .env
 */
function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return false;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // Ignorer les lignes vides et les commentaires
    if (!trimmedLine || trimmedLine.startsWith('#')) {
      continue;
    }

    // Parser KEY=VALUE
    const match = trimmedLine.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      let value = match[2].trim();
      
      // Supprimer les guillemets au début et à la fin si présents
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      
      // Ne pas écraser les variables déjà définies dans l'environnement
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  }

  return true;
}

console.log('🔨 Rebuild pour la production\n');

// 0. Charger les variables d'environnement depuis .env.production ou .env
console.log('📋 Étape 0 : Chargement des variables d\'environnement...\n');

const envFiles = [
  path.join(process.cwd(), '.env.production'),
  path.join(process.cwd(), '.env.local'),
  path.join(process.cwd(), '.env'),
];

let envLoaded = false;
for (const envFile of envFiles) {
  if (loadEnvFile(envFile)) {
    console.log(`  ✅ Variables chargées depuis ${path.basename(envFile)}`);
    envLoaded = true;
    break; // Charger seulement le premier fichier trouvé (priorité)
  }
}

if (!envLoaded) {
  console.log('  ⚠️  Aucun fichier .env trouvé (.env.production, .env.local, ou .env)');
  console.log('     Les variables doivent être définies dans l\'environnement système\n');
} else {
  console.log('');
}

// 1. Vérifier les variables d'environnement
console.log('📋 Étape 1 : Vérification des variables d\'environnement...\n');

const requiredVars = {
  'AUTH_URL': process.env.AUTH_URL,
  'NEXT_PUBLIC_SERVER_URL': process.env.NEXT_PUBLIC_SERVER_URL,
  'AUTH_SECRET': process.env.AUTH_SECRET,
  'AUTH_TRUST_HOST': process.env.AUTH_TRUST_HOST,
};

let hasErrors = false;
let hasWarnings = false;

// Vérifier chaque variable
for (const [varName, value] of Object.entries(requiredVars)) {
  if (!value) {
    console.log(`  ❌ ${varName}: NON DÉFINIE`);
    hasErrors = true;
  } else {
    const displayValue = varName.includes('SECRET') 
      ? '***' + value.slice(-4) 
      : value;
    console.log(`  ✅ ${varName}: ${displayValue}`);
    
    // Vérifications spécifiques
    if (varName === 'AUTH_URL' && !value.startsWith('https://')) {
      console.log(`     ⚠️  L'URL devrait utiliser HTTPS en production`);
      hasWarnings = true;
    }
    
    if (varName === 'NEXT_PUBLIC_SERVER_URL') {
      if (!value.startsWith('https://')) {
        console.log(`     ⚠️  L'URL devrait utiliser HTTPS en production`);
        hasWarnings = true;
      }
      if (value !== PRODUCTION_URL && !value.includes('localhost')) {
        console.log(`     ⚠️  L'URL ne correspond pas à l'URL de production attendue (${PRODUCTION_URL})`);
        hasWarnings = true;
      }
    }
    
    if (varName === 'AUTH_TRUST_HOST' && value !== 'true') {
      console.log(`     ⚠️  Doit être 'true' en production`);
      hasWarnings = true;
    }
  }
}

if (hasErrors) {
  console.log('\n❌ Des variables requises sont manquantes !');
  console.log('\n💡 Solution :');
  console.log('  1. Créez ou modifiez le fichier .env.production à la racine du projet');
  console.log('     (ou .env.local ou .env si .env.production n\'existe pas)');
  console.log('  2. Ajoutez les variables requises :');
  console.log(`     AUTH_URL=${PRODUCTION_URL}`);
  console.log(`     NEXT_PUBLIC_SERVER_URL=${PRODUCTION_URL}`);
  console.log('     AUTH_TRUST_HOST=true');
  console.log('     AUTH_SECRET=votre-secret-très-long-et-aléatoire');
  console.log('  3. Relancez ce script : npm run rebuild:production');
  process.exit(1);
}

if (hasWarnings) {
  console.log('\n⚠️  Des avertissements ont été détectés (voir ci-dessus)');
  console.log('   Le build continuera, mais vérifiez votre configuration.\n');
} else {
  console.log('\n✅ Toutes les variables sont correctement configurées !\n');
}

// 2. Supprimer le dossier .next
console.log('🗑️  Étape 2 : Suppression du dossier .next...\n');

const nextDir = path.join(process.cwd(), '.next');
if (fs.existsSync(nextDir)) {
  try {
    fs.rmSync(nextDir, { recursive: true, force: true });
    console.log('  ✅ Dossier .next supprimé\n');
  } catch (error) {
    console.log(`  ❌ Erreur lors de la suppression de .next : ${error.message}`);
    console.log('  💡 Essayez de supprimer manuellement le dossier .next');
    process.exit(1);
  }
} else {
  console.log('  ℹ️  Le dossier .next n\'existe pas (c\'est normal pour un premier build)\n');
}

// 3. Vérifier que NODE_ENV est en production
if (process.env.NODE_ENV !== 'production') {
  console.log('⚠️  NODE_ENV n\'est pas défini à "production"');
  console.log('   Le build utilisera le mode production par défaut\n');
}

// 4. Build
console.log('🔨 Étape 3 : Build de l\'application...\n');
console.log(`   AUTH_URL=${requiredVars.AUTH_URL}`);
console.log(`   NEXT_PUBLIC_SERVER_URL=${requiredVars.NEXT_PUBLIC_SERVER_URL}`);
console.log(`   NODE_ENV=${process.env.NODE_ENV || 'production'}\n`);

try {
  // S'assurer que NODE_ENV est en production
  process.env.NODE_ENV = 'production';
  
  // Exécuter le build
  execSync('npm run build', {
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: 'production',
    },
  });
  
  console.log('\n✅ Build terminé avec succès !\n');
} catch (error) {
  console.log('\n❌ Erreur lors du build');
  console.log('   Vérifiez les erreurs ci-dessus');
  process.exit(1);
}

// 5. Vérifier que le build utilise les bonnes URLs
console.log('🔍 Étape 4 : Vérification du build...\n');

const manifestPath = path.join(process.cwd(), '.next', 'server', 'app-paths-manifest.json');
if (fs.existsSync(manifestPath)) {
  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    const manifestContent = JSON.stringify(manifest);
    
    if (manifestContent.includes(PRODUCTION_URL)) {
      console.log(`  ✅ Le build utilise l'URL de production : ${PRODUCTION_URL}`);
    } else if (manifestContent.includes('localhost')) {
      console.log(`  ⚠️  Le build utilise encore localhost au lieu de ${PRODUCTION_URL}`);
      console.log('     Le build doit être refait avec les bonnes variables');
    } else {
      console.log(`  ℹ️  Impossible de vérifier l'URL dans le manifest`);
    }
  } catch (error) {
    console.log(`  ⚠️  Impossible de lire le manifest : ${error.message}`);
  }
} else {
  console.log('  ⚠️  Le fichier manifest n\'existe pas');
}

console.log('\n✅ Rebuild terminé !');
console.log('\n📝 Prochaines étapes :');
console.log('  1. Redémarrer l\'application : pm2 restart harp (ou npm start)');
console.log('  2. Vérifier dans le navigateur que les URLs utilisent https://portails.orange-harp.fr:9352');
console.log('  3. Vérifier qu\'il n\'y a plus d\'erreurs 404 sur les routes RSC\n');

