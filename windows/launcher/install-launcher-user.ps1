# Script d'installation du launcher pour utilisateur (sans droits administrateur)
# Ce script configure le launcher dans le dossier de l'utilisateur

param(
    [string]$InstallPath = "",
    [switch]$Force
)

$ErrorActionPreference = 'Stop'

# Déterminer le chemin d'installation optimal
# PRIORITÉ: W:\portal (home directory réseau) > LOCALAPPDATA > TEMP
if ([string]::IsNullOrWhiteSpace($InstallPath)) {
    # PRIORITÉ 1: Utiliser W:\portal (home directory réseau pour les utilisateurs)
    $wPortalPath = "W:\portal"
    
    if (Test-Path "W:\") {
        if (-not (Test-Path $wPortalPath)) {
            try {
                New-Item -ItemType Directory -Path $wPortalPath -Force | Out-Null
                Write-Host "[INFO] Dossier créé: $wPortalPath" -ForegroundColor Cyan
            } catch {
                Write-Host "[ATTENTION] Impossible de créer $wPortalPath, essai avec LOCALAPPDATA" -ForegroundColor Yellow
                $wPortalPath = $null
            }
        }
        if ($wPortalPath -and (Test-Path $wPortalPath)) {
            $InstallPath = "$wPortalPath\HARP\launcher"
        }
    }
    
    # PRIORITÉ 2: Si W:\portal n'est pas accessible, essayer LOCALAPPDATA
    if ([string]::IsNullOrWhiteSpace($InstallPath)) {
        if ($env:LOCALAPPDATA -and (Test-Path $env:LOCALAPPDATA)) {
            $InstallPath = "$env:LOCALAPPDATA\HARP\launcher"
            Write-Host "[INFO] Utilisation de LOCALAPPDATA car W:\portal n'est pas accessible" -ForegroundColor Yellow
        }
    }
    
    # PRIORITÉ 3: En dernier recours, utiliser TEMP
    if ([string]::IsNullOrWhiteSpace($InstallPath)) {
        $InstallPath = "$env:TEMP\HARP\launcher"
        Write-Host "[INFO] Utilisation de TEMP comme dernier recours" -ForegroundColor Yellow
    }
}

Write-Host "`n=== Installation du launcher HARP (Mode Utilisateur) ===" -ForegroundColor Green
Write-Host "Chemin d'installation: $InstallPath`n" -ForegroundColor Cyan

# Étape 1: Créer le répertoire d'installation
Write-Host "[1/3] Création du répertoire d'installation..." -ForegroundColor Yellow
if (-not (Test-Path $InstallPath)) {
    New-Item -ItemType Directory -Path $InstallPath -Force | Out-Null
    Write-Host "  [OK] Répertoire créé" -ForegroundColor Green
} else {
    Write-Host "  [OK] Répertoire existe déjà" -ForegroundColor Green
}

# Étape 2: Copier le script launcher et le wrapper
Write-Host "[2/3] Copie du script launcher..." -ForegroundColor Yellow
$scriptPath = Join-Path $PSScriptRoot "launcher.ps1"
$targetScript = Join-Path $InstallPath "launcher.ps1"

if (Test-Path $scriptPath) {
    Copy-Item -Path $scriptPath -Destination $targetScript -Force
    Write-Host "  [OK] Script copié vers $targetScript" -ForegroundColor Green
} else {
    Write-Host "  [ERREUR] Fichier source introuvable: $scriptPath" -ForegroundColor Red
    exit 1
}

# Copier le wrapper batch
$wrapperPath = Join-Path $PSScriptRoot "launcher-wrapper.bat"
$targetWrapper = Join-Path $InstallPath "launcher-wrapper.bat"

if (Test-Path $wrapperPath) {
    Copy-Item -Path $wrapperPath -Destination $targetWrapper -Force
    Write-Host "  [OK] Wrapper batch copié" -ForegroundColor Green
} else {
    Write-Host "  [ATTENTION] Wrapper batch introuvable, création d'un wrapper par défaut" -ForegroundColor Yellow
    # Créer un wrapper batch par défaut
    $wrapperContent = @"
@echo off
setlocal
set LAUNCHER_PATH=%LOCALAPPDATA%\HARP\launcher\launcher.ps1
if not exist "%LAUNCHER_PATH%" (
    echo ERREUR: Le launcher n'est pas installe
    pause
    exit /b 1
)
powershell.exe -ExecutionPolicy Bypass -NoExit -WindowStyle Normal -File "%LAUNCHER_PATH%" "%~1"
endlocal
"@
    $wrapperContent | Out-File -FilePath $targetWrapper -Encoding ASCII
    Write-Host "  [OK] Wrapper batch créé" -ForegroundColor Green
}

# Étape 3: Copier le fichier de configuration
Write-Host "[3/3] Configuration du launcher..." -ForegroundColor Yellow
$configPath = Join-Path $PSScriptRoot "launcher-config.json"
$targetConfig = Join-Path $InstallPath "launcher-config.json"

if (Test-Path $configPath) {
    Copy-Item -Path $configPath -Destination $targetConfig -Force
    Write-Host "  [OK] Configuration copiée" -ForegroundColor Green
} else {
    # Créer un fichier de configuration par défaut
    $defaultConfig = @{
        version = "1.0"
        apiUrl = "http://localhost:9352"
        logLevel = "info"
        keepWindowOpenOnError = $true
        keepWindowOpenOnSuccess = $false
        windowCloseDelay = 2
    } | ConvertTo-Json
    $defaultConfig | Out-File -FilePath $targetConfig -Encoding UTF8
    Write-Host "  [OK] Configuration par défaut créée" -ForegroundColor Green
}

# Créer le répertoire logs
$logsDir = Join-Path $InstallPath "logs"
if (-not (Test-Path $logsDir)) {
    New-Item -ItemType Directory -Path $logsDir -Force | Out-Null
}

Write-Host "`n=== Installation terminée avec succès ===" -ForegroundColor Green
Write-Host "Le launcher est installé dans: $InstallPath" -ForegroundColor Cyan
Write-Host "`nPour utiliser le launcher, vous devez installer le protocole mylaunch://" -ForegroundColor Yellow
Write-Host "Contactez votre administrateur pour installer le protocole Windows." -ForegroundColor Yellow
Write-Host "`n" -ForegroundColor Yellow
Write-Host "`nOu utilisez le script install-mylaunch-user.ps1 si vous avez les droits." -ForegroundColor Yellow

