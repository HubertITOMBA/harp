#!/bin/bash

# Script de démarrage de l'application HARP en production
# Ce script désactive Dynatrace pour éviter les erreurs de module

# Forcer le mode production
export NODE_ENV=production

# Désactiver Dynatrace
export DT_DISABLE_INJECTION=true
export DT_AGENT_DISABLED=true
export DT_ONEAGENT_DISABLED=true

# Supprimer NODE_OPTIONS si défini (pour éviter les erreurs Dynatrace)
# Nettoyer NODE_OPTIONS même s'il contient des références à Dynatrace
if [ -n "${NODE_OPTIONS:-}" ]; then
  # Supprimer toutes les références à Dynatrace dans NODE_OPTIONS
  NODE_OPTIONS_CLEANED=$(echo "$NODE_OPTIONS" | sed 's|--require[[:space:]]*/opt/dynatrace[^[:space:]]*||g' | sed 's|-r[[:space:]]*/opt/dynatrace[^[:space:]]*||g' | sed 's|/opt/dynatrace[^[:space:]]*||g' | xargs)
  if [ -n "$NODE_OPTIONS_CLEANED" ]; then
    export NODE_OPTIONS="$NODE_OPTIONS_CLEANED"
  else
    unset NODE_OPTIONS
    export NODE_OPTIONS=""
  fi
else
  unset NODE_OPTIONS
  export NODE_OPTIONS=""
fi

# Désactiver les workers Next.js pour éviter l'héritage de NODE_OPTIONS
export NEXT_PRIVATE_WORKER=0
export NEXT_PRIVATE_STANDALONE=true

# Désactiver Turbopack et HMR (mode production uniquement)
export NEXT_TURBOPACK=0

# Vérifier que NODE_OPTIONS est bien vide
if [ -n "$NODE_OPTIONS" ]; then
  echo "⚠️  Attention: NODE_OPTIONS n'est pas vide: $NODE_OPTIONS"
  echo "   Cela peut causer des problèmes avec Next.js"
fi

# Charger les variables d'environnement depuis .env si le script existe
if [ -f "scripts/load-env.sh" ]; then
  source scripts/load-env.sh
fi

# Vérifier que le build de production existe
if [ ! -d ".next" ]; then
  echo "❌ Erreur: Le dossier .next n'existe pas. Exécutez 'npm run build' d'abord."
  exit 1
fi

# Démarrer l'application Next.js en mode production
echo "🚀 Démarrage de l'application HARP en PRODUCTION..."
echo "   Port: 9352"
echo "   Mode: Production"
echo "   Dynatrace: Désactivé"
echo "   Workers: Désactivés"
echo "   NODE_OPTIONS: ${NODE_OPTIONS:-vide}"
echo "   NODE_ENV: ${NODE_ENV}"

# Utiliser next start directement avec les variables d'environnement
# Forcer NODE_OPTIONS à être vide même si Dynatrace l'a injecté
# Utiliser env -u pour supprimer NODE_OPTIONS de l'environnement hérité
exec env -u NODE_OPTIONS \
  NODE_ENV=production \
  DT_DISABLE_INJECTION=true \
  DT_AGENT_DISABLED=true \
  DT_ONEAGENT_DISABLED=true \
  NODE_OPTIONS="" \
  NEXT_PRIVATE_WORKER=0 \
  NEXT_PRIVATE_STANDALONE=true \
  NEXT_TURBOPACK=0 \
  npx next start -p 9352

