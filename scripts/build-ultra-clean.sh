#!/bin/bash

# Script de build ultra-propre qui utilise un wrapper node personnalisé
# pour complètement ignorer NODE_OPTIONS

set -e  # Arrêter en cas d'erreur

echo "=== Build Ultra-Propre (sans NODE_OPTIONS) ==="

# Supprimer explicitement toutes les variables Dynatrace
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

# Créer un wrapper node temporaire qui ignore NODE_OPTIONS
WRAPPER_NODE="/tmp/node-no-dynatrace-$$"
cat > "$WRAPPER_NODE" << 'EOF'
#!/bin/bash
# Wrapper node qui ignore complètement NODE_OPTIONS
exec env -i PATH="$PATH" HOME="$HOME" USER="${USER:-$(whoami)}" PWD="$PWD" \
    $(which node) "$@"
EOF
chmod +x "$WRAPPER_NODE"

# Fonction de nettoyage
cleanup() {
    rm -f "$WRAPPER_NODE"
}
trap cleanup EXIT

# Créer un environnement complètement vierge
env -i \
    PATH="$SAVED_PATH" \
    HOME="$SAVED_HOME" \
    USER="$SAVED_USER" \
    PWD="$SAVED_PWD" \
    SHELL="$SAVED_SHELL" \
    TERM="$SAVED_TERM" \
    bash -c "
        # Supprimer explicitement NODE_OPTIONS
        unset NODE_OPTIONS
        
        # Vérifier que NODE_OPTIONS est bien vide
        if [ -n \"\${NODE_OPTIONS:-}\" ]; then
            echo \"ERREUR: NODE_OPTIONS n'est pas vide: \$NODE_OPTIONS\"
            exit 1
        fi
        
        echo \"NODE_OPTIONS après nettoyage: [\${NODE_OPTIONS:-vide}]\"
        
        # Créer un alias pour node qui utilise le wrapper
        alias node='$WRAPPER_NODE'
        alias npx='env -u NODE_OPTIONS npx'
        
        # Générer Prisma
        echo \"Génération du client Prisma...\"
        env -u NODE_OPTIONS npx prisma generate
        
        # Build Next.js avec workers désactivés
        echo \"Build Next.js (workers désactivés)...\"
        # Désactiver complètement les workers Next.js
        NEXT_PRIVATE_WORKER=0 \
        NODE_OPTIONS='' \
        env -u NODE_OPTIONS npx next build
        
        echo \"Build terminé avec succès!\"
    "

