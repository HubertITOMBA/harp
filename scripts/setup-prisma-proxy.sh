#!/bin/bash

# Script de configuration du proxy pour Prisma en production
# Usage: ./scripts/setup-prisma-proxy.sh [proxy_url] [proxy_port]

PROXY_HOST="${1:-proxy.adsaft.ft.net}"
PROXY_PORT="${2:-8080}"
PROXY_URL="http://${PROXY_HOST}:${PROXY_PORT}"

echo "Configuration du proxy Prisma..."
echo "Proxy: ${PROXY_URL}"

# Configuration pour la session actuelle
export HTTP_PROXY="${PROXY_URL}"
export HTTPS_PROXY="${PROXY_URL}"
export NO_PROXY="localhost,127.0.0.1"

echo "Variables d'environnement configurées pour cette session:"
echo "  HTTP_PROXY=${HTTP_PROXY}"
echo "  HTTPS_PROXY=${HTTPS_PROXY}"
echo "  NO_PROXY=${NO_PROXY}"

# Génération du client Prisma avec le proxy
echo ""
echo "Génération du client Prisma..."
npx prisma generate

if [ $? -eq 0 ]; then
    echo "✓ Client Prisma généré avec succès"
else
    echo "✗ Erreur lors de la génération du client Prisma"
    echo ""
    echo "Solutions alternatives:"
    echo "1. Vérifiez que le proxy est accessible: curl -x ${PROXY_URL} https://binaries.prisma.sh"
    echo "2. Générez le client en local et copiez node_modules/.prisma en production"
    echo "3. Consultez docs/CONFIGURATION_PRISMA_PRODUCTION.md pour plus d'informations"
    exit 1
fi









