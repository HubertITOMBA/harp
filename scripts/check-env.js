#!/usr/bin/env node

/**
 * Script de diagnostic pour vérifier les variables d'environnement critiques
 */

const requiredVars = [
  'AUTH_URL',
  'AUTH_SECRET',
  'AUTH_TRUST_HOST'
];

// Optionnel : si défini, il est "baked" au build (RSC/Server Actions). Si non défini, Next.js utilise des URLs relatives (recommandé en prod sans proxy).
const optionalPublicUrlVar = 'NEXT_PUBLIC_SERVER_URL';

const optionalVars = [
  'DATABASE_URL',
  'MAIL_HOST',
  'MAIL_PORT'
];

console.log('🔍 Vérification des variables d\'environnement...\n');

let hasErrors = false;
let hasWarnings = false;

// Vérifier les variables requises
console.log('📋 Variables requises :');
requiredVars.forEach(varName => {
  const value = process.env[varName];
  if (!value) {
    console.log(`  ❌ ${varName}: NON DÉFINIE`);
    hasErrors = true;
  } else {
    // Masquer les valeurs sensibles
    const displayValue = varName.includes('SECRET')
      ? '***' + value.slice(-4)
      : value;
    console.log(`  ✅ ${varName}: ${displayValue}`);

    if (varName === 'AUTH_URL' && !value.startsWith('http')) {
      console.log(`     ⚠️  L'URL doit commencer par http:// ou https://`);
      hasWarnings = true;
    }
    if (varName === 'AUTH_TRUST_HOST' && value !== 'true') {
      console.log(`     ⚠️  Doit être 'true' en production`);
      hasWarnings = true;
    }
  }
});

// NEXT_PUBLIC_SERVER_URL : optionnel (recommandé de ne PAS le définir en prod sans proxy pour utiliser des URLs relatives)
console.log(`\n📋 ${optionalPublicUrlVar} (optionnel, "baked" au build) :`);
const publicUrl = process.env[optionalPublicUrlVar];
if (!publicUrl) {
  console.log(`  ⚪ Non définie → Next.js utilisera des URLs relatives (recommandé si accès par IP, ex. http://10.173.8.125:9352)`);
} else {
  console.log(`  ✅ ${optionalPublicUrlVar}: ${publicUrl}`);
  if (publicUrl.includes('localhost') && process.env.NODE_ENV === 'production') {
    console.log(`     ⚠️  localhost en production : les requêtes RSC partiront vers la machine du client, pas le serveur → 404 / déconnexion.`);
    console.log(`     💡 Pour accès par IP : retirez cette variable ou mettez l'URL réelle (ex. http://10.173.8.125:9352), puis rm -rf .next && npm run build`);
    hasWarnings = true;
  }
  if (!publicUrl.startsWith('http')) {
    console.log(`     ⚠️  L'URL doit commencer par http:// ou https://`);
    hasWarnings = true;
  }
}

console.log('\n📋 Autres variables optionnelles :');
optionalVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`  ✅ ${varName}: ${value}`);
  } else {
    console.log(`  ⚪ ${varName}: non définie (optionnelle)`);
  }
});

console.log('\n📊 Résumé :');
if (hasErrors) {
  console.log('  ❌ Des variables requises sont manquantes !');
  console.log('\n💡 Solution :');
  console.log('  1. Créez un fichier .env à la racine du projet');
  console.log('  2. Ajoutez les variables requises :');
  console.log('     AUTH_URL=https://localhost:9352');
  console.log('     NEXT_PUBLIC_SERVER_URL=https://localhost:9352');
  console.log('     AUTH_TRUST_HOST=true');
  console.log('     AUTH_SECRET=votre-secret-très-long-et-aléatoire');
  console.log('  3. Rebuild l\'application : npm run build');
  console.log('  4. Redémarrez l\'application : npm start');
  process.exit(1);
} else if (hasWarnings) {
  console.log('  ⚠️  Des avertissements ont été détectés (voir ci-dessus)');
  process.exit(0);
} else {
  console.log('  ✅ Toutes les variables requises sont définies !');
  process.exit(0);
}

