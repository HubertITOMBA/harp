#!/bin/bash

# Script de diagnostic pour collecter toutes les informations nécessaires
# pour l'équipe infrastructure concernant le problème Dynatrace

echo "=========================================="
echo "DIAGNOSTIC DYNATRACE - Build Next.js"
echo "=========================================="
echo ""

echo "1. Informations système"
echo "----------------------"
echo "OS: $(uname -a)"
echo "Utilisateur: $(whoami)"
echo "Répertoire actuel: $(pwd)"
echo ""

echo "2. Versions"
echo "-----------"
echo "Node.js: $(node --version 2>&1)"
echo "npm: $(npm --version 2>&1)"
if command -v npx &> /dev/null; then
    echo "Next.js: $(npx next --version 2>&1 || echo 'Non disponible')"
fi
echo ""
echo "2.1. Version Dynatrace OneAgent"
echo "-------------------------------"
ONAGENT_VERSION=""
# Essayer plusieurs méthodes pour trouver la version
if [ -f "/opt/dynatrace/oneagent/agent/version.txt" ]; then
    ONAGENT_VERSION=$(cat /opt/dynatrace/oneagent/agent/version.txt 2>/dev/null)
elif [ -f "/opt/dynatrace/oneagent/agent/version" ]; then
    ONAGENT_VERSION=$(cat /opt/dynatrace/oneagent/agent/version 2>/dev/null)
elif [ -f "/opt/dynatrace/oneagent/agent/VERSION" ]; then
    ONAGENT_VERSION=$(cat /opt/dynatrace/oneagent/agent/VERSION 2>/dev/null)
fi

if [ -n "$ONAGENT_VERSION" ]; then
    echo "Version OneAgent: $ONAGENT_VERSION"
    # Vérifier si la version est >= 1.323
    VERSION_MAJOR=$(echo "$ONAGENT_VERSION" | cut -d. -f1)
    VERSION_MINOR=$(echo "$ONAGENT_VERSION" | cut -d. -f2)
    if [ "$VERSION_MAJOR" -gt 1 ] || ([ "$VERSION_MAJOR" -eq 1 ] && [ "$VERSION_MINOR" -ge 323 ]); then
        echo "  ✓ Version >= 1.323 - Le workaround avec --require devrait être disponible"
    else
        echo "  ⚠ Version < 1.323 - Mise à jour recommandée vers 1.323+ pour utiliser --require"
    fi
else
    echo "  ⚠ Version OneAgent non trouvée automatiquement"
    echo "  Vérification manuelle requise dans /opt/dynatrace/oneagent/agent/"
fi
echo ""

echo "3. Variables d'environnement NODE_OPTIONS"
echo "----------------------------------------"
if [ -n "${NODE_OPTIONS:-}" ]; then
    echo "⚠ NODE_OPTIONS est défini: $NODE_OPTIONS"
    echo "Longueur: ${#NODE_OPTIONS} caractères"
    # Vérifier si c'est -r ou --require
    if echo "$NODE_OPTIONS" | grep -q "\-r "; then
        echo "  ⚠ Utilise '-r' (ancien format) - Problème avec Next.js"
        echo "  → Solution: Mettre à jour OneAgent vers 1.323+ pour utiliser '--require'"
    elif echo "$NODE_OPTIONS" | grep -q "\-\-require "; then
        echo "  ✓ Utilise '--require' (nouveau format) - Compatible avec Next.js"
    fi
else
    echo "✓ NODE_OPTIONS n'est pas défini"
fi
echo ""

echo "4. Variables d'environnement Dynatrace"
echo "--------------------------------------"
DT_VARS=$(env | grep -i "^DT_" || echo "Aucune variable DT_ trouvée")
echo "$DT_VARS"
echo ""

echo "5. Processus Dynatrace"
echo "---------------------"
if pgrep -f dynatrace > /dev/null; then
    echo "⚠ Processus Dynatrace actifs:"
    ps aux | grep -i dynatrace | grep -v grep
else
    echo "✓ Aucun processus Dynatrace trouvé"
fi
echo ""

echo "6. Fichiers de configuration système"
echo "------------------------------------"
echo "Recherche de NODE_OPTIONS dans les fichiers de configuration..."
CONFIG_FILES=(
    "$HOME/.bashrc"
    "$HOME/.bash_profile"
    "$HOME/.profile"
    "/etc/profile"
    "/etc/bash.bashrc"
    "/etc/environment"
)

for file in "${CONFIG_FILES[@]}"; do
    if [ -f "$file" ]; then
        if grep -q "NODE_OPTIONS" "$file" 2>/dev/null; then
            echo "⚠ Trouvé dans: $file"
            grep "NODE_OPTIONS" "$file" | sed 's/^/  /'
        fi
    fi
done
echo ""

echo "7. Service Dynatrace (si disponible)"
echo "------------------------------------"
if systemctl list-units --type=service | grep -q dynatrace; then
    echo "Services Dynatrace trouvés:"
    systemctl list-units --type=service | grep dynatrace
    echo ""
    echo "Statut du service principal:"
    if systemctl is-active --quiet dynatrace-oneagent 2>/dev/null; then
        echo "  ✓ dynatrace-oneagent est actif"
        systemctl status dynatrace-oneagent --no-pager -l | head -10
    else
        echo "  ✗ dynatrace-oneagent n'est pas actif ou n'existe pas"
    fi
else
    echo "✓ Aucun service Dynatrace trouvé via systemctl"
fi
echo ""

echo "8. LD_PRELOAD (peut indiquer une injection au niveau système)"
echo "------------------------------------------------------------"
if [ -n "${LD_PRELOAD:-}" ]; then
    echo "⚠ LD_PRELOAD est défini: $LD_PRELOAD"
else
    echo "✓ LD_PRELOAD n'est pas défini"
fi
echo ""

echo "9. Test de build (simulation)"
echo "----------------------------"
echo "Commande qui sera exécutée: npm run build"
echo "NODE_OPTIONS actuel: [${NODE_OPTIONS:-vide}]"
echo ""

echo "10. Recommandations"
echo "------------------"
if [ -n "${NODE_OPTIONS:-}" ]; then
    echo "⚠ ACTION REQUISE: NODE_OPTIONS doit être vide ou utiliser --require"
    echo "   Valeur actuelle: $NODE_OPTIONS"
    echo ""
    echo "Solutions possibles (par ordre de priorité):"
    echo "  1. ⭐ Mettre à jour OneAgent vers 1.323+ (solution recommandée par Dynatrace)"
    echo "     → Utilise --require au lieu de -r, évite le bug Next.js"
    echo "     → Voir docs/SOLUTION_DYNATRACE_ONAGENT_1323.md"
    echo ""
    echo "  2. Configurer Dynatrace pour exclure le processus de build"
    echo "  3. Désactiver temporairement Dynatrace pendant le build"
    echo "  4. Utiliser les scripts de build avec environnement vierge (workaround)"
else
    echo "✓ NODE_OPTIONS est vide - le problème peut venir des workers Next.js"
    echo "  qui héritent de NODE_OPTIONS depuis un processus parent"
    echo ""
    echo "Solution recommandée:"
    echo "  ⭐ Mettre à jour OneAgent vers 1.323+ pour utiliser --require"
fi
echo ""

echo "=========================================="
echo "FIN DU DIAGNOSTIC"
echo "=========================================="
echo ""
echo "Pour plus d'informations, voir:"
echo "  - docs/SOLUTION_DYNATRACE_ONAGENT_1323.md (⭐ Solution recommandée)"
echo "  - docs/DEMANDE_INFRASTRUCTURE_DYNATRACE.md"
echo "  - docs/RESOLUTION_BUILD_NODE_OPTIONS.md"
echo "  - docs/TROUBLESHOOTING_BUILD.md"
echo ""
echo "Référence Next.js issue: https://github.com/vercel/next.js/issues/77550"

