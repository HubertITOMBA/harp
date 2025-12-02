#!/bin/bash

# Version alternative du script de build avec environnement complètement propre
# Utilise env -i pour créer un environnement vierge avec seulement les variables essentielles

set -e  # Arrêter en cas d'erreur

# Sauvegarder les variables essentielles
SAVED_PATH="$PATH"
SAVED_HOME="$HOME"
SAVED_USER="${USER:-$(whoami)}"
SAVED_PWD="$PWD"
SAVED_SHELL="${SHELL:-/bin/bash}"
SAVED_TERM="${TERM:-xterm}"

# Créer un environnement complètement vierge avec NODE_OPTIONS explicitement vide
env -i \
    PATH="$SAVED_PATH" \
    HOME="$SAVED_HOME" \
    USER="$SAVED_USER" \
    PWD="$SAVED_PWD" \
    SHELL="$SAVED_SHELL" \
    TERM="$SAVED_TERM" \
    NODE_OPTIONS="" \
    bash -c '
        echo "Environnement propre créé"
        echo "NODE_OPTIONS: [$NODE_OPTIONS]"
        npx prisma generate && next build
    '

