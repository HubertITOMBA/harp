#!/bin/bash
# Wrapper Node.js qui ignore complètement NODE_OPTIONS injecté par Dynatrace
# Utilise ce wrapper pour démarrer Node.js sans les options Dynatrace

# Supprimer complètement NODE_OPTIONS de l'environnement
unset NODE_OPTIONS

# Exécuter Node.js avec les arguments passés, mais sans NODE_OPTIONS
exec env -u NODE_OPTIONS "$(which node)" "$@"
