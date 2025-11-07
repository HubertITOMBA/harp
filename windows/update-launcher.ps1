# Script de mise à jour du launcher avec les nouveaux outils
# A executer en tant qu'administrateur

param(
    [string]$InstallPath = "C:\apps\portail\launcher"
)

$ErrorActionPreference = 'Stop'

# Verifier les privileges administrateur
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "ERREUR: Ce script doit etre execute en tant qu'administrateur." -ForegroundColor Red
    Write-Host "Faites un clic droit sur PowerShell et selectionnez 'Executer en tant qu'administrateur'" -ForegroundColor Yellow
    exit 1
}

Write-Host "`n=== Mise a jour du launcher ===" -ForegroundColor Green
Write-Host "Chemin d'installation: $InstallPath`n" -ForegroundColor Cyan

# Etape 1: Creer le repertoire s'il n'existe pas
Write-Host "[1/2] Verification du repertoire d'installation..." -ForegroundColor Yellow
if (-not (Test-Path $InstallPath)) {
    New-Item -ItemType Directory -Path $InstallPath -Force | Out-Null
    Write-Host "  [OK] Repertoire cree" -ForegroundColor Green
} else {
    Write-Host "  [OK] Repertoire existe" -ForegroundColor Green
}

# Etape 2: Copier le script launcher mis à jour
Write-Host "[2/2] Copie du script launcher mis a jour..." -ForegroundColor Yellow
$scriptPath = Join-Path $PSScriptRoot "launcher\launcher.ps1"
$targetScript = Join-Path $InstallPath "launcher.ps1"

if (Test-Path $scriptPath) {
    Copy-Item -Path $scriptPath -Destination $targetScript -Force
    Write-Host "  [OK] Script mis a jour vers $targetScript" -ForegroundColor Green
    Write-Host "`n=== Mise a jour terminee avec succes ===" -ForegroundColor Green
    Write-Host "Les nouveaux outils sont maintenant disponibles:" -ForegroundColor Cyan
    Write-Host "  - sqldeveloper" -ForegroundColor Yellow
    Write-Host "  - psdmt" -ForegroundColor Yellow
    Write-Host "  - pscfg" -ForegroundColor Yellow
    Write-Host "  - sqlplus" -ForegroundColor Yellow
    Write-Host "  - filezilla" -ForegroundColor Yellow
    Write-Host "  - perl" -ForegroundColor Yellow
    Write-Host "  - winscp" -ForegroundColor Yellow
    Write-Host "  - winmerge" -ForegroundColor Yellow
} else {
    Write-Host "  [ERREUR] Fichier source introuvable: $scriptPath" -ForegroundColor Red
    exit 1
}

