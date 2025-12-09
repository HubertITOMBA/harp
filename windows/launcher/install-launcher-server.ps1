# Script d'installation du serveur launcher (sans droits administrateur)
# Ce script installe le serveur HTTP local qui évite d'utiliser le protocole mylaunch://

param(
    [string]$InstallPath = "$env:LOCALAPPDATA\HARP\launcher",
    [switch]$AddToStartup
)

$ErrorActionPreference = 'Stop'

Write-Host "`n=== Installation du serveur Launcher HARP ===" -ForegroundColor Green
Write-Host "Chemin d'installation: $InstallPath`n" -ForegroundColor Cyan

# Étape 1: Créer le répertoire d'installation
Write-Host "[1/4] Création du répertoire d'installation..." -ForegroundColor Yellow
if (-not (Test-Path $InstallPath)) {
    New-Item -ItemType Directory -Path $InstallPath -Force | Out-Null
    Write-Host "  [OK] Répertoire créé" -ForegroundColor Green
} else {
    Write-Host "  [OK] Répertoire existe déjà" -ForegroundColor Green
}

# Étape 2: Copier les scripts nécessaires
Write-Host "[2/4] Copie des scripts..." -ForegroundColor Yellow

$filesToCopy = @(
    @{ Source = "launcher.ps1"; Required = $true }
    @{ Source = "launcher-server.ps1"; Required = $true }
    @{ Source = "launcher-config.json"; Required = $false }
    @{ Source = "start-launcher-server.bat"; Required = $true }
)

foreach ($file in $filesToCopy) {
    $sourcePath = Join-Path $PSScriptRoot $file.Source
    $targetPath = Join-Path $InstallPath $file.Source
    
    if (Test-Path $sourcePath) {
        Copy-Item -Path $sourcePath -Destination $targetPath -Force
        Write-Host "  [OK] $($file.Source) copié" -ForegroundColor Green
    } elseif ($file.Required) {
        Write-Host "  [ERREUR] Fichier requis introuvable: $($file.Source)" -ForegroundColor Red
        exit 1
    } else {
        Write-Host "  [INFO] $($file.Source) non trouvé, sera créé avec les valeurs par défaut" -ForegroundColor Yellow
    }
}

# Créer le fichier de configuration s'il n'existe pas
$configPath = Join-Path $InstallPath "launcher-config.json"
if (-not (Test-Path $configPath)) {
    $defaultConfig = @{
        version = "1.0"
        apiUrl = "https://portails.orange-harp.fr:9052"
        logLevel = "info"
        keepWindowOpenOnError = $true
        keepWindowOpenOnSuccess = $false
        windowCloseDelay = 2
        serverPort = 8765
    } | ConvertTo-Json
    $defaultConfig | Out-File -FilePath $configPath -Encoding UTF8
    Write-Host "  [OK] Configuration par défaut créée" -ForegroundColor Green
}

# Créer le répertoire logs
$logsDir = Join-Path $InstallPath "logs"
if (-not (Test-Path $logsDir)) {
    New-Item -ItemType Directory -Path $logsDir -Force | Out-Null
}

# Étape 3: Démarrer le serveur
Write-Host "[3/4] Démarrage du serveur launcher..." -ForegroundColor Yellow
$serverScript = Join-Path $InstallPath "launcher-server.ps1"

try {
    # Vérifier si le serveur est déjà en cours d'exécution
    $existingProcess = Get-Process -Name "powershell" -ErrorAction SilentlyContinue | 
        Where-Object { $_.CommandLine -like "*launcher-server.ps1*" }
    
    if ($existingProcess) {
        Write-Host "  [INFO] Le serveur est déjà en cours d'exécution" -ForegroundColor Yellow
    } else {
        Start-Process -FilePath "powershell.exe" `
            -ArgumentList "-ExecutionPolicy", "Bypass", "-WindowStyle", "Hidden", "-File", "`"$serverScript`"" `
            -WindowStyle Hidden
        
        Start-Sleep -Seconds 2
        
        # Vérifier que le serveur a démarré
        try {
            $healthCheck = Invoke-WebRequest -Uri "http://localhost:8765/health" -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
            Write-Host "  [OK] Serveur démarré avec succès" -ForegroundColor Green
        } catch {
            Write-Host "  [ATTENTION] Le serveur semble ne pas avoir démarré. Vérifiez les logs." -ForegroundColor Yellow
        }
    }
} catch {
    Write-Host "  [ERREUR] Impossible de démarrer le serveur: $_" -ForegroundColor Red
}

# Étape 4: Ajouter au démarrage Windows (optionnel)
if ($AddToStartup) {
    Write-Host "[4/4] Ajout au démarrage Windows..." -ForegroundColor Yellow
    $startupPath = "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Startup"
    $startupScript = Join-Path $startupPath "HARP-Launcher-Server.bat"
    
    $batchContent = @"
@echo off
start "" powershell.exe -ExecutionPolicy Bypass -WindowStyle Hidden -File "%InstallPath%\launcher-server.ps1"
"@
    
    $batchContent | Out-File -FilePath $startupScript -Encoding ASCII
    Write-Host "  [OK] Ajouté au démarrage Windows" -ForegroundColor Green
} else {
    Write-Host "[4/4] Ajout au démarrage Windows..." -ForegroundColor Gray
    Write-Host "  [INFO] Ignoré (utilisez -AddToStartup pour l'activer)" -ForegroundColor Gray
}

Write-Host "`n=== Installation terminée avec succès ===" -ForegroundColor Green
Write-Host "Le serveur launcher est installé dans: $InstallPath" -ForegroundColor Cyan
Write-Host "Le serveur écoute sur: http://localhost:8765" -ForegroundColor Cyan
Write-Host "`nPour démarrer le serveur manuellement:" -ForegroundColor Yellow
Write-Host "  .\start-launcher-server.bat" -ForegroundColor Gray
Write-Host "`nPour l'ajouter au démarrage Windows:" -ForegroundColor Yellow
Write-Host "  .\install-launcher-server.ps1 -AddToStartup" -ForegroundColor Gray

