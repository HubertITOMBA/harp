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

/**
 * Nettoie NODE_OPTIONS en supprimant les références à Dynatrace
 */
function cleanNodeOptions() {
  if (!process.env.NODE_OPTIONS) {
    return;
  }

  const nodeOptions = process.env.NODE_OPTIONS;
  
  // Vérifier si NODE_OPTIONS contient des références à Dynatrace
  if (nodeOptions.includes('dynatrace') || nodeOptions.includes('pl-nodejsagent')) {
    console.log('  ⚠️  NODE_OPTIONS contient des références à Dynatrace');
    console.log(`     Valeur actuelle: ${nodeOptions}`);
    
    // Supprimer complètement NODE_OPTIONS
    delete process.env.NODE_OPTIONS;
    console.log('  ✅ NODE_OPTIONS nettoyé (références Dynatrace supprimées)');
  }
}

/**
 * Corrige HTTP en HTTPS pour les URLs de production
 */
function fixHttpToHttps() {
  const urlVars = ['AUTH_URL', 'NEXT_PUBLIC_SERVER_URL'];
  let fixed = false;

  for (const varName of urlVars) {
    const value = process.env[varName];
    if (value && value.startsWith('http://') && value.includes('portails.orange-harp.fr') && !value.includes('localhost')) {
      const httpsValue = value.replace('http://', 'https://');
      console.log(`  ⚠️  Correction automatique: ${varName}`);
      console.log(`     ${value} → ${httpsValue}`);
      process.env[varName] = httpsValue;
      fixed = true;
    }
  }

  return fixed;
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

// 1. Corriger automatiquement HTTP en HTTPS si nécessaire
console.log('📋 Étape 1 : Vérification et correction des variables d\'environnement...\n');

// Corriger HTTP en HTTPS pour les URLs de production
const httpFixed = fixHttpToHttps();
if (httpFixed) {
  console.log('  ✅ URLs corrigées de HTTP vers HTTPS\n');
}

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
    if (varName === 'AUTH_URL') {
      if (value.startsWith('http://') && !value.includes('localhost')) {
        console.log(`     ❌ ERREUR: L'URL utilise HTTP au lieu de HTTPS en production`);
        console.log(`        Valeur actuelle: ${value}`);
        console.log(`        Valeur attendue: ${value.replace('http://', 'https://')}`);
        hasErrors = true;
      } else if (!value.startsWith('https://') && !value.includes('localhost')) {
        console.log(`     ⚠️  L'URL devrait utiliser HTTPS en production`);
        hasWarnings = true;
      }
    }
    
    if (varName === 'NEXT_PUBLIC_SERVER_URL') {
      if (value.startsWith('http://') && !value.includes('localhost')) {
        console.log(`     ❌ ERREUR: L'URL utilise HTTP au lieu de HTTPS en production`);
        console.log(`        Valeur actuelle: ${value}`);
        console.log(`        Valeur attendue: ${value.replace('http://', 'https://')}`);
        hasErrors = true;
      } else if (!value.startsWith('https://') && !value.includes('localhost')) {
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
  console.log('\n❌ Des erreurs ont été détectées dans la configuration !');
  console.log('\n💡 Solution :');
  console.log('  1. Créez ou modifiez le fichier .env.production à la racine du projet');
  console.log('     (ou .env.local ou .env si .env.production n\'existe pas)');
  console.log('  2. Assurez-vous que les URLs utilisent HTTPS (pas HTTP) :');
  console.log(`     AUTH_URL=${PRODUCTION_URL}`);
  console.log(`     NEXT_PUBLIC_SERVER_URL=${PRODUCTION_URL}`);
  console.log('     ⚠️  IMPORTANT: Utilisez https:// et non http://');
  console.log('  3. Ajoutez les autres variables requises :');
  console.log('     AUTH_TRUST_HOST=true');
  console.log('     AUTH_SECRET=votre-secret-très-long-et-aléatoire');
  console.log('  4. Relancez ce script : npm run rebuild:production');
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

// 4. Désactiver Dynatrace et nettoyer NODE_OPTIONS
console.log('🔧 Étape 3 : Désactivation de Dynatrace et nettoyage de NODE_OPTIONS...\n');

// Désactiver complètement l'injection Dynatrace
process.env.DT_DISABLE_INJECTION = 'true';
process.env.DT_AGENT_DISABLED = 'true';
process.env.DT_ONEAGENT_DISABLED = 'true';

// Nettoyer NODE_OPTIONS (supprime les références à Dynatrace)
cleanNodeOptions();

// Supprimer complètement NODE_OPTIONS pour éviter les conflits avec Dynatrace
delete process.env.NODE_OPTIONS;

// Vérifier que NODE_OPTIONS est bien supprimé
if (process.env.NODE_OPTIONS) {
  console.log(`  ⚠️  NODE_OPTIONS est encore défini: ${process.env.NODE_OPTIONS}`);
  console.log('     Tentative de suppression...');
  delete process.env.NODE_OPTIONS;
}

console.log('  ✅ Dynatrace désactivé');
console.log('  ✅ NODE_OPTIONS nettoyé\n');

// 5. Build
console.log('🔨 Étape 4 : Build de l\'application...\n');
console.log(`   AUTH_URL=${requiredVars.AUTH_URL}`);
console.log(`   NEXT_PUBLIC_SERVER_URL=${requiredVars.NEXT_PUBLIC_SERVER_URL}`);
console.log(`   NODE_ENV=${process.env.NODE_ENV || 'production'}`);
console.log(`   NODE_OPTIONS=${process.env.NODE_OPTIONS || '(vide)'}\n`);

try {
  // S'assurer que NODE_ENV est en production
  process.env.NODE_ENV = 'production';
  
  // Créer un environnement propre pour le build
  const buildEnv = {
    ...process.env,
    NODE_ENV: 'production',
    NODE_OPTIONS: '', // Forcer NODE_OPTIONS à être vide
    DT_DISABLE_INJECTION: 'true',
    DT_AGENT_DISABLED: 'true',
    DT_ONEAGENT_DISABLED: 'true',
    NEXT_PRIVATE_WORKER: '0', // Désactiver les workers Next.js pour éviter l'héritage de NODE_OPTIONS
  };
  
  // Exécuter le build avec l'environnement nettoyé
  execSync('npm run build', {
    stdio: 'inherit',
    env: buildEnv,
  });
  
  console.log('\n✅ Build terminé avec succès !\n');
} catch (error) {
  console.log('\n❌ Erreur lors du build');
  console.log('   Vérifiez les erreurs ci-dessus');
  console.log('\n💡 Si l\'erreur est liée à Dynatrace :');
  console.log('   1. Vérifiez que Dynatrace OneAgent est à jour (version 1.323+)');
  console.log('   2. Contactez l\'équipe infrastructure pour exclure le processus de build');
  console.log('   3. Consultez docs/RESOLUTION_BUILD_DYNATRACE.md pour plus d\'informations');
  process.exit(1);
}

// 6. Vérifier que le build utilise les bonnes URLs
console.log('🔍 Étape 5 : Vérification du build...\n');

/**
 * Recherche une URL dans les fichiers du build Next.js
 */
function searchUrlInBuildFiles(searchUrl) {
  const nextDir = path.join(process.cwd(), '.next');
  if (!fs.existsSync(nextDir)) {
    return { found: false, files: [] };
  }

  const filesToCheck = [
    path.join(nextDir, 'server', 'app-paths-manifest.json'),
    path.join(nextDir, 'server', 'app', 'layout.js'),
    path.join(nextDir, 'server', 'app', 'layout.js.map'),
    path.join(nextDir, 'static', 'chunks', 'app', 'layout.js'),
  ];

  const foundFiles = [];
  let found = false;

  for (const filePath of filesToCheck) {
    if (fs.existsSync(filePath)) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        if (content.includes(searchUrl)) {
          found = true;
          foundFiles.push(path.relative(process.cwd(), filePath));
        }
      } catch (error) {
        // Ignorer les erreurs de lecture
      }
    }
  }

  // Chercher aussi dans les fichiers du répertoire server/app
  const serverAppDir = path.join(nextDir, 'server', 'app');
  if (fs.existsSync(serverAppDir)) {
    try {
      const files = fs.readdirSync(serverAppDir, { recursive: true });
      for (const file of files) {
        const filePath = path.join(serverAppDir, file);
        if (fs.statSync(filePath).isFile() && (file.endsWith('.js') || file.endsWith('.json'))) {
          try {
            const content = fs.readFileSync(filePath, 'utf8');
            if (content.includes(searchUrl)) {
              found = true;
              const relativePath = path.relative(process.cwd(), filePath);
              if (!foundFiles.includes(relativePath)) {
                foundFiles.push(relativePath);
              }
            }
          } catch (error) {
            // Ignorer les erreurs de lecture
          }
        }
      }
    } catch (error) {
      // Ignorer les erreurs de lecture du répertoire
    }
  }

  return { found, files: foundFiles };
}

// Vérifier que l'URL de production est présente dans le build
const productionCheck = searchUrlInBuildFiles(PRODUCTION_URL);
const localhostCheck = searchUrlInBuildFiles('localhost:9352');

if (productionCheck.found) {
  console.log(`  ✅ Le build utilise l'URL de production : ${PRODUCTION_URL}`);
  if (productionCheck.files.length > 0) {
    console.log(`     Trouvé dans ${productionCheck.files.length} fichier(s)`);
  }
} else if (localhostCheck.found) {
  console.log(`  ⚠️  Le build utilise encore localhost au lieu de ${PRODUCTION_URL}`);
  console.log('     Le build doit être refait avec les bonnes variables');
  console.log('     Vérifiez que NEXT_PUBLIC_SERVER_URL est défini dans .env.production');
} else {
  console.log(`  ℹ️  L'URL n'a pas été trouvée dans les fichiers de build vérifiés`);
  console.log('     Cela peut être normal si Next.js utilise des URLs relatives');
  console.log('     Vérifiez dans le navigateur que les requêtes RSC fonctionnent correctement');
  console.log(`     Les requêtes doivent utiliser : ${PRODUCTION_URL}`);
}

console.log('\n✅ Rebuild terminé !');
console.log('\n📝 Prochaines étapes :');
console.log('  1. Redémarrer l\'application : pm2 restart harp (ou npm start)');
console.log('  2. Vérifier dans le navigateur (F12 > Network) que les requêtes RSC utilisent :');
console.log(`     ${PRODUCTION_URL}/...?_rsc=...`);
console.log('  3. Vérifier qu\'il n\'y a plus d\'erreurs 404 sur les routes RSC');
console.log('\n💡 Note importante :');
console.log('   - Le message "Local: http://localhost:9352" au démarrage est normal');
console.log('   - La vraie vérification se fait dans le navigateur (onglet Network)');
console.log('   - Les requêtes RSC doivent utiliser des URLs absolues avec HTTPS\n');

