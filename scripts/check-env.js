#!/usr/bin/env node

/**
 * Script de diagnostic pour vérifier les variables d'environnement critiques
 */

const requiredVars = [
  'AUTH_URL',
  'NEXT_PUBLIC_SERVER_URL',
  'AUTH_SECRET',
  'AUTH_TRUST_HOST'
];

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
    
    // Vérifications spécifiques
    if (varName === 'AUTH_URL' && !value.startsWith('http')) {
      console.log(`     ⚠️  L'URL doit commencer par http:// ou https://`);
      hasWarnings = true;
    }
    
    if (varName === 'NEXT_PUBLIC_SERVER_URL') {
      if (value.includes('localhost')) {
        console.log(`     ⚠️  Attention : utilise localhost (peut causer des problèmes en production)`);
        hasWarnings = true;
      }
      if (!value.startsWith('http')) {
        console.log(`     ⚠️  L'URL doit commencer par http:// ou https://`);
        hasWarnings = true;
      }
      // Note: HTTP est utilisé selon demande admin jusqu'à la fin du développement
      // if (process.env.NODE_ENV === 'production' && value.startsWith('http://') && !value.includes('localhost')) {
      //   console.log(`     ⚠️  En production, HTTPS est recommandé (certificats installés)`);
      //   hasWarnings = true;
      // }
    }
    
    if (varName === 'AUTH_TRUST_HOST' && value !== 'true') {
      console.log(`     ⚠️  Doit être 'true' en production`);
      hasWarnings = true;
    }
  }
});

console.log('\n📋 Variables optionnelles :');
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

