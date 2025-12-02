#!/bin/bash

# Script de build pour supprimer complètement NODE_OPTIONS (Dynatrace)
# et exécuter le build dans un environnement propre

set -e  # Arrêter en cas d'erreur

# Supprimer explicitement toutes les variables Dynatrace avant de créer l'environnement
unset NODE_OPTIONS
unset DT_DISABLE_INJECTION
unset DT_NODE_AGENT
unset DT_AGENT_NAME
unset DT_AGENT_PATH

# Sauvegarder les variables essentielles
SAVED_PATH="$PATH"
SAVED_HOME="$HOME"
SAVED_USER="${USER:-$(whoami)}"
SAVED_PWD="$PWD"
SAVED_SHELL="${SHELL:-/bin/bash}"
SAVED_TERM="${TERM:-xterm}"

# Créer un environnement complètement vierge avec seulement les variables essentielles
# et FORCER NODE_OPTIONS à être vide et non défini
env -i \
    PATH="$SAVED_PATH" \
    HOME="$SAVED_HOME" \
    USER="$SAVED_USER" \
    PWD="$SAVED_PWD" \
    SHELL="$SAVED_SHELL" \
    TERM="$SAVED_TERM" \
    bash -c '
        # Supprimer explicitement NODE_OPTIONS dans le sous-shell
        unset NODE_OPTIONS
        
        # Vérifier que NODE_OPTIONS est bien vide/non défini
        if [ -n "${NODE_OPTIONS:-}" ]; then
            echo "ERREUR: NODE_OPTIONS n'\''est pas vide: $NODE_OPTIONS"
            exit 1
        fi
        
        echo "NODE_OPTIONS après nettoyage: [${NODE_OPTIONS:-vide}]"
        
        # Générer Prisma avec NODE_OPTIONS explicitement non défini
        echo "Génération du client Prisma..."
        env -u NODE_OPTIONS npx prisma generate
        
        # Build Next.js avec NODE_OPTIONS explicitement non défini
        echo "Build Next.js..."
        env -u NODE_OPTIONS npx next build
        
        echo "Build terminé avec succès!"
    '

