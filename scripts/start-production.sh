#!/bin/bash

# Script de démarrage de l'application HARP en production
# Ce script désactive Dynatrace pour éviter les erreurs de module

# Désactiver Dynatrace
export DT_DISABLE_INJECTION=true
export DT_AGENT_DISABLED=true
export DT_ONEAGENT_DISABLED=true

# Supprimer NODE_OPTIONS si défini (pour éviter les erreurs Dynatrace)
unset NODE_OPTIONS
export NODE_OPTIONS=""

# Vérifier que NODE_OPTIONS est bien vide
if [ -n "$NODE_OPTIONS" ]; then
  echo "⚠️  Attention: NODE_OPTIONS n'est pas vide: $NODE_OPTIONS"
  echo "   Cela peut causer des problèmes avec Next.js"
fi

# Charger les variables d'environnement depuis .env si le script existe
if [ -f "scripts/load-env.sh" ]; then
  source scripts/load-env.sh
fi

# Démarrer l'application Next.js
echo "🚀 Démarrage de l'application HARP..."
echo "   Port: 9352"
echo "   Dynatrace: Désactivé"
echo "   NODE_OPTIONS: ${NODE_OPTIONS:-vide}"

npm start

