# Script de démarrage de l'application HARP en production (PowerShell)
# Ce script désactive Dynatrace pour éviter les erreurs de module

# Forcer le mode production
$env:NODE_ENV = "production"

# Désactiver Dynatrace
$env:DT_DISABLE_INJECTION = "true"
$env:DT_AGENT_DISABLED = "true"
$env:DT_ONEAGENT_DISABLED = "true"

# Supprimer NODE_OPTIONS si défini (pour éviter les erreurs Dynatrace)
Remove-Item Env:\NODE_OPTIONS -ErrorAction SilentlyContinue
$env:NODE_OPTIONS = ""

# Désactiver les workers Next.js pour éviter l'héritage de NODE_OPTIONS
$env:NEXT_PRIVATE_WORKER = "0"
$env:NEXT_PRIVATE_STANDALONE = "true"

# Désactiver Turbopack et HMR (mode production uniquement)
$env:NEXT_TURBOPACK = "0"

# Vérifier que NODE_OPTIONS est bien vide
if ($env:NODE_OPTIONS) {
    Write-Host "⚠️  Attention: NODE_OPTIONS n'est pas vide: $($env:NODE_OPTIONS)" -ForegroundColor Yellow
    Write-Host "   Cela peut causer des problèmes avec Next.js" -ForegroundColor Yellow
}

# Charger les variables d'environnement depuis .env si le script existe
if (Test-Path "scripts\load-env.ps1") {
    . .\scripts\load-env.ps1
}

# Vérifier que le build de production existe
if (-not (Test-Path ".next")) {
    Write-Host "❌ Erreur: Le dossier .next n'existe pas. Exécutez 'npm run build' d'abord." -ForegroundColor Red
    exit 1
}

# Démarrer l'application Next.js en mode production
Write-Host "🚀 Démarrage de l'application HARP en PRODUCTION..." -ForegroundColor Green
Write-Host "   Port: 9352" -ForegroundColor Cyan
Write-Host "   Mode: Production" -ForegroundColor Cyan
Write-Host "   Dynatrace: Désactivé" -ForegroundColor Cyan
Write-Host "   Workers: Désactivés" -ForegroundColor Cyan
Write-Host "   NODE_OPTIONS: $($env:NODE_OPTIONS)" -ForegroundColor Cyan
Write-Host "   NODE_ENV: $($env:NODE_ENV)" -ForegroundColor Cyan

# Utiliser next start directement avec les variables d'environnement
& npx next start -p 9352

