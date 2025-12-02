#!/bin/bash

# Wrapper pour node qui ignore complètement NODE_OPTIONS
# Utilise node directement sans passer par NODE_OPTIONS

# Récupérer le chemin de node
NODE_BIN=$(which node)

# Exécuter node avec les arguments passés, mais en ignorant NODE_OPTIONS
exec env -u NODE_OPTIONS "$NODE_BIN" "$@"

