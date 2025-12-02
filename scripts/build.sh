#!/bin/bash

# Script de build pour supprimer complètement NODE_OPTIONS (Dynatrace)
# et exécuter le build dans un environnement propre

set -e  # Arrêter en cas d'erreur

# Sauvegarder les variables essentielles
SAVED_PATH="$PATH"
SAVED_HOME="$HOME"
SAVED_USER="${USER:-$(whoami)}"
SAVED_PWD="$PWD"
SAVED_SHELL="${SHELL:-/bin/bash}"
SAVED_TERM="${TERM:-xterm}"

# Créer un environnement complètement vierge avec seulement les variables essentielles
# et FORCER NODE_OPTIONS à être vide
env -i \
    PATH="$SAVED_PATH" \
    HOME="$SAVED_HOME" \
    USER="$SAVED_USER" \
    PWD="$SAVED_PWD" \
    SHELL="$SAVED_SHELL" \
    TERM="$SAVED_TERM" \
    NODE_OPTIONS="" \
    bash -c '
        # Vérifier que NODE_OPTIONS est bien vide
        if [ -n "$NODE_OPTIONS" ]; then
            echo "ERREUR: NODE_OPTIONS n'\''est pas vide: $NODE_OPTIONS"
            exit 1
        fi
        
        echo "NODE_OPTIONS après nettoyage: [$NODE_OPTIONS]"
        
        # Générer Prisma
        echo "Génération du client Prisma..."
        NODE_OPTIONS="" npx prisma generate
        
        # Build Next.js
        echo "Build Next.js..."
        NODE_OPTIONS="" next build
        
        echo "Build terminé avec succès!"
    '

