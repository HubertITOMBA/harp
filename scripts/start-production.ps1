# Script de démarrage de l'application HARP en production (PowerShell)
# Ce script désactive Dynatrace pour éviter les erreurs de module

# Désactiver Dynatrace
$env:DT_DISABLE_INJECTION = "true"
$env:DT_AGENT_DISABLED = "true"
$env:DT_ONEAGENT_DISABLED = "true"

# Supprimer NODE_OPTIONS si défini (pour éviter les erreurs Dynatrace)
Remove-Item Env:\NODE_OPTIONS -ErrorAction SilentlyContinue
$env:NODE_OPTIONS = ""

# Vérifier que NODE_OPTIONS est bien vide
if ($env:NODE_OPTIONS) {
    Write-Host "⚠️  Attention: NODE_OPTIONS n'est pas vide: $($env:NODE_OPTIONS)" -ForegroundColor Yellow
    Write-Host "   Cela peut causer des problèmes avec Next.js" -ForegroundColor Yellow
}

# Charger les variables d'environnement depuis .env si le script existe
if (Test-Path "scripts\load-env.ps1") {
    . .\scripts\load-env.ps1
}

# Démarrer l'application Next.js
Write-Host "🚀 Démarrage de l'application HARP..." -ForegroundColor Green
Write-Host "   Port: 9352" -ForegroundColor Cyan
Write-Host "   Dynatrace: Désactivé" -ForegroundColor Cyan
Write-Host "   NODE_OPTIONS: $($env:NODE_OPTIONS)" -ForegroundColor Cyan

npm start

