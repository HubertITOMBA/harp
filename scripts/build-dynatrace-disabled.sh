#!/bin/bash

# Script de build qui désactive complètement Dynatrace
# en utilisant les variables d'environnement Dynatrace

set -e  # Arrêter en cas d'erreur

echo "=== Build avec Dynatrace désactivé ==="

# Désactiver complètement l'injection Dynatrace
export DT_DISABLE_INJECTION=true
export DT_AGENT_DISABLED=true
export DT_ONEAGENT_DISABLED=true

# Supprimer toutes les variables NODE_OPTIONS
unset NODE_OPTIONS
export NODE_OPTIONS=""

# Vérifier que NODE_OPTIONS est bien vide
echo "NODE_OPTIONS: [${NODE_OPTIONS:-vide}]"
echo "DT_DISABLE_INJECTION: ${DT_DISABLE_INJECTION:-non défini}"

# Générer Prisma
echo ""
echo "Génération du client Prisma..."
NODE_OPTIONS="" npx prisma generate

# Build Next.js avec workers désactivés
echo ""
echo "Build Next.js (workers désactivés)..."
NEXT_PRIVATE_WORKER=0 \
NODE_OPTIONS="" \
npx next build

echo ""
echo "Build terminé avec succès!"

