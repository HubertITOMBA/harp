#!/bin/bash

# Wrapper pour node qui ignore complètement NODE_OPTIONS
# Utilise node directement sans passer par NODE_OPTIONS

# Supprimer toutes les variables Dynatrace
unset NODE_OPTIONS
unset DT_DISABLE_INJECTION
unset DT_NODE_AGENT
unset DT_AGENT_NAME
unset DT_AGENT_PATH

# Récupérer le chemin de node
NODE_BIN=$(which node)

# Exécuter node avec les arguments passés, mais en ignorant NODE_OPTIONS
# Utiliser env -i pour créer un environnement complètement vierge
exec env -i PATH="$PATH" HOME="$HOME" USER="${USER:-$(whoami)}" PWD="$PWD" \
    "$NODE_BIN" "$@"

