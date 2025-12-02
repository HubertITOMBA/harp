#!/bin/bash

# Version alternative du script de build avec environnement complètement propre
# Utilise env -i pour créer un environnement vierge avec seulement les variables essentielles

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

# Créer un environnement complètement vierge avec NODE_OPTIONS explicitement non défini
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
        
        echo "Environnement propre créé"
        echo "NODE_OPTIONS: [${NODE_OPTIONS:-vide}]"
        
        # Exécuter avec NODE_OPTIONS explicitement non défini
        env -u NODE_OPTIONS npx prisma generate && env -u NODE_OPTIONS next build
    '

