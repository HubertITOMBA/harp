#!/bin/bash

# Script de diagnostic pour vérifier NODE_OPTIONS
# Utilisez ce script pour diagnostiquer les problèmes avec NODE_OPTIONS

echo "=== Diagnostic NODE_OPTIONS ==="
echo ""

echo "1. Valeur actuelle de NODE_OPTIONS:"
if [ -z "${NODE_OPTIONS:-}" ]; then
    echo "   ✓ NODE_OPTIONS est vide ou non défini"
else
    echo "   ✗ NODE_OPTIONS contient: $NODE_OPTIONS"
    echo "   ⚠ ATTENTION: Cette valeur peut causer des problèmes avec Next.js"
fi
echo ""

echo "2. Variables Dynatrace détectées:"
if [ -n "${DT_DISABLE_INJECTION:-}" ]; then
    echo "   - DT_DISABLE_INJECTION: $DT_DISABLE_INJECTION"
fi
if [ -n "${DT_NODE_AGENT:-}" ]; then
    echo "   - DT_NODE_AGENT: $DT_NODE_AGENT"
fi
if [ -n "${DT_AGENT_NAME:-}" ]; then
    echo "   - DT_AGENT_NAME: $DT_AGENT_NAME"
fi
if [ -n "${DT_AGENT_PATH:-}" ]; then
    echo "   - DT_AGENT_PATH: $DT_AGENT_PATH"
fi
echo ""

echo "3. Fichiers de configuration système qui pourraient définir NODE_OPTIONS:"
for file in ~/.bashrc ~/.bash_profile ~/.profile /etc/profile /etc/bash.bashrc; do
    if [ -f "$file" ]; then
        if grep -q "NODE_OPTIONS" "$file" 2>/dev/null; then
            echo "   ⚠ Trouvé dans: $file"
            grep "NODE_OPTIONS" "$file" | sed 's/^/      /'
        fi
    fi
done
echo ""

echo "4. Solution recommandée:"
echo "   Utilisez le script de build qui supprime NODE_OPTIONS:"
echo "   npm run build"
echo ""
echo "   Ou manuellement:"
echo "   unset NODE_OPTIONS"
echo "   env -u NODE_OPTIONS npm run build"
echo ""

