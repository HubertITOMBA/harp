#!/bin/bash

# Script de build FINAL qui crée un wrapper node dans le PATH
# pour intercepter TOUS les appels à node et ignorer NODE_OPTIONS

set -e  # Arrêter en cas d'erreur

echo "=== Build FINAL avec wrapper node dans PATH ==="

# Créer un répertoire temporaire pour le wrapper
TEMP_BIN_DIR=$(mktemp -d)
trap "rm -rf $TEMP_BIN_DIR" EXIT

# Créer un wrapper node qui ignore complètement NODE_OPTIONS
cat > "$TEMP_BIN_DIR/node" << 'NODEWRAPPER'
#!/bin/bash
# Wrapper node qui ignore complètement NODE_OPTIONS
# Ce wrapper intercepte tous les appels à node

# Trouver le vrai binaire node
REAL_NODE=$(which -a node | grep -v "$0" | head -1)

# Si on ne trouve pas le vrai node, utiliser celui par défaut
if [ -z "$REAL_NODE" ]; then
    REAL_NODE="/usr/bin/node"
    if [ ! -f "$REAL_NODE" ]; then
        REAL_NODE="$HOME/.nvm/versions/node/$(nvm current)/bin/node"
    fi
fi

# Exécuter node avec un environnement complètement vierge
# Ne garder que les variables essentielles
exec env -i \
    PATH="$PATH" \
    HOME="$HOME" \
    USER="${USER:-$(whoami)}" \
    PWD="$PWD" \
    SHELL="${SHELL:-/bin/bash}" \
    TERM="${TERM:-xterm}" \
    "$REAL_NODE" "$@"
NODEWRAPPER

chmod +x "$TEMP_BIN_DIR/node"

# Créer aussi un wrapper npx
cat > "$TEMP_BIN_DIR/npx" << 'NPXWRAPPER'
#!/bin/bash
# Wrapper npx qui ignore complètement NODE_OPTIONS
REAL_NPX=$(which -a npx | grep -v "$0" | head -1)
if [ -z "$REAL_NPX" ]; then
    REAL_NPX="/usr/bin/npx"
    if [ ! -f "$REAL_NPX" ]; then
        REAL_NPX="$HOME/.nvm/versions/node/$(nvm current)/bin/npx"
    fi
fi
exec env -i \
    PATH="$PATH" \
    HOME="$HOME" \
    USER="${USER:-$(whoami)}" \
    PWD="$PWD" \
    SHELL="${SHELL:-/bin/bash}" \
    TERM="${TERM:-xterm}" \
    "$REAL_NPX" "$@"
NPXWRAPPER

chmod +x "$TEMP_BIN_DIR/npx"

# Sauvegarder le PATH original
ORIGINAL_PATH="$PATH"

# Ajouter le répertoire temporaire au début du PATH
export PATH="$TEMP_BIN_DIR:$PATH"

echo "Wrapper node créé dans: $TEMP_BIN_DIR"
echo "PATH modifié pour utiliser le wrapper"

# Supprimer explicitement toutes les variables Dynatrace
unset NODE_OPTIONS
unset DT_DISABLE_INJECTION
unset DT_NODE_AGENT
unset DT_AGENT_NAME
unset DT_AGENT_PATH

# Vérifier que le wrapper fonctionne
echo "Test du wrapper node..."
NODE_VERSION=$(node --version 2>&1 || echo "ERREUR")
echo "Version Node.js: $NODE_VERSION"

# Vérifier que NODE_OPTIONS est bien ignoré
echo "NODE_OPTIONS dans l'environnement: [${NODE_OPTIONS:-vide}]"

# Générer Prisma
echo ""
echo "Génération du client Prisma..."
npx prisma generate

# Build Next.js avec workers désactivés
echo ""
echo "Build Next.js (workers désactivés)..."
NEXT_PRIVATE_WORKER=0 \
NODE_OPTIONS='' \
npx next build

echo ""
echo "Build terminé avec succès!"

