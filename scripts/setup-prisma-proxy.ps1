# Script de configuration du proxy pour Prisma en production (PowerShell)
# Usage: .\scripts\setup-prisma-proxy.ps1 [proxy_url] [proxy_port]

param(
    [string]$ProxyHost = "proxy.adsaft.ft.net",
    [int]$ProxyPort = 8080
)

$ProxyUrl = "http://${ProxyHost}:${ProxyPort}"

Write-Host "Configuration du proxy Prisma..." -ForegroundColor Cyan
Write-Host "Proxy: $ProxyUrl" -ForegroundColor Yellow

# Configuration pour la session actuelle
$env:HTTP_PROXY = $ProxyUrl
$env:HTTPS_PROXY = $ProxyUrl
$env:NO_PROXY = "localhost,127.0.0.1"

Write-Host ""
Write-Host "Variables d'environnement configurées pour cette session:" -ForegroundColor Green
Write-Host "  HTTP_PROXY=$env:HTTP_PROXY"
Write-Host "  HTTPS_PROXY=$env:HTTPS_PROXY"
Write-Host "  NO_PROXY=$env:NO_PROXY"

# Génération du client Prisma avec le proxy
Write-Host ""
Write-Host "Génération du client Prisma..." -ForegroundColor Cyan
npx prisma generate

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Client Prisma généré avec succès" -ForegroundColor Green
} else {
    Write-Host "✗ Erreur lors de la génération du client Prisma" -ForegroundColor Red
    Write-Host ""
    Write-Host "Solutions alternatives:" -ForegroundColor Yellow
    Write-Host "1. Vérifiez que le proxy est accessible"
    Write-Host "2. Générez le client en local et copiez node_modules/.prisma en production"
    Write-Host "3. Consultez docs/CONFIGURATION_PRISMA_PRODUCTION.md pour plus d'informations"
    exit 1
}


