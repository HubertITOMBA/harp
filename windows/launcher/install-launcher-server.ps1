# Script d'installation du serveur launcher (sans droits administrateur)
# Ce script installe le serveur HTTP local qui évite d'utiliser le protocole mylaunch://

param(
    [string]$InstallPath = "",
    [switch]$AddToStartup
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

Write-Host "`n=== Installation du serveur Launcher HARP ===" -ForegroundColor Green
Write-Host "Chemin d'installation: $InstallPath`n" -ForegroundColor Cyan

# Étape 1: Créer le répertoire d'installation
Write-Host "[1/4] Création du répertoire d'installation..." -ForegroundColor Yellow
try {
    if (-not (Test-Path $InstallPath)) {
        New-Item -ItemType Directory -Path $InstallPath -Force | Out-Null
        Write-Host "  [OK] Répertoire créé" -ForegroundColor Green
    } else {
        Write-Host "  [OK] Répertoire existe déjà" -ForegroundColor Green
    }
} catch {
    Write-Host "  [ERREUR] Impossible de créer le répertoire: $_" -ForegroundColor Red
    exit 1
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
        try {
            Copy-Item -Path $sourcePath -Destination $targetPath -Force
            Write-Host "  [OK] $($file.Source) copié" -ForegroundColor Green
        } catch {
            Write-Host "  [ERREUR] Impossible de copier $($file.Source): $_" -ForegroundColor Red
            if ($file.Required) {
                exit 1
            }
        }
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
    try {
        $defaultConfig = @{
            version = "1.0"
            apiUrl = "https://localhost:9352"
            logLevel = "info"
            keepWindowOpenOnError = $true
            keepWindowOpenOnSuccess = $false
            windowCloseDelay = 2
            serverPort = 8765
        } | ConvertTo-Json
        $defaultConfig | Out-File -FilePath $configPath -Encoding UTF8 -Force
        Write-Host "  [OK] Configuration par défaut créée" -ForegroundColor Green
    } catch {
        Write-Host "  [ATTENTION] Impossible de créer la configuration: $_" -ForegroundColor Yellow
    }
}

# Créer le répertoire logs
$logsDir = Join-Path $InstallPath "logs"
if (-not (Test-Path $logsDir)) {
    try {
        New-Item -ItemType Directory -Path $logsDir -Force | Out-Null
    } catch {
        Write-Host "  [ATTENTION] Impossible de créer le dossier logs: $_" -ForegroundColor Yellow
    }
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
    
    # Créer le dossier Startup s'il n'existe pas (peut être sur un réseau)
    if (-not (Test-Path $startupPath)) {
        try {
            # Créer récursivement tous les dossiers parents nécessaires
            $parentPath = Split-Path $startupPath -Parent
            if (-not (Test-Path $parentPath)) {
                New-Item -ItemType Directory -Path $parentPath -Force | Out-Null
            }
            New-Item -ItemType Directory -Path $startupPath -Force | Out-Null
            Write-Host "  [OK] Dossier Startup créé" -ForegroundColor Green
        } catch {
            Write-Host "  [ERREUR] Impossible de créer le dossier Startup: $_" -ForegroundColor Red
            Write-Host "  [INFO] Le dossier Startup peut être sur un réseau non accessible" -ForegroundColor Yellow
            Write-Host "  [INFO] Vous pouvez démarrer le serveur manuellement avec:" -ForegroundColor Yellow
            Write-Host "    $InstallPath\start-launcher-server.bat" -ForegroundColor Gray
            Write-Host "  [INFO] Ou créer un raccourci vers start-launcher-server.bat dans le menu Démarrer" -ForegroundColor Yellow
        }
    }
    
    if (Test-Path $startupPath) {
        $startupScript = Join-Path $startupPath "HARP-Launcher-Server.bat"
        
        # Utiliser le chemin absolu résolu pour éviter les problèmes avec les chemins réseau
        $resolvedInstallPath = (Resolve-Path $InstallPath).Path
        
        $batchContent = @"
@echo off
REM Serveur Launcher HARP - Démarrage automatique
REM Chemin: $resolvedInstallPath
start "" powershell.exe -ExecutionPolicy Bypass -WindowStyle Hidden -File "$resolvedInstallPath\launcher-server.ps1"
"@
        
        try {
            $batchContent | Out-File -FilePath $startupScript -Encoding ASCII -Force
            Write-Host "  [OK] Ajouté au démarrage Windows" -ForegroundColor Green
            Write-Host "  [INFO] Le serveur démarrera automatiquement à la prochaine connexion" -ForegroundColor Cyan
        } catch {
            Write-Host "  [ERREUR] Impossible d'écrire dans le dossier Startup: $_" -ForegroundColor Red
            Write-Host "  [INFO] Le dossier Startup peut être en lecture seule sur le réseau" -ForegroundColor Yellow
            Write-Host "  [INFO] Solution alternative:" -ForegroundColor Yellow
            Write-Host "    1. Créer un raccourci vers: $resolvedInstallPath\start-launcher-server.bat" -ForegroundColor Gray
            Write-Host "    2. Placer ce raccourci dans le menu Démarrer > Démarrage" -ForegroundColor Gray
            Write-Host "    3. Ou démarrer manuellement le serveur à chaque connexion" -ForegroundColor Gray
        }
    }
} else {
    Write-Host "[4/4] Ajout au démarrage Windows..." -ForegroundColor Gray
    Write-Host "  [INFO] Ignoré (utilisez -AddToStartup pour l'activer)" -ForegroundColor Gray
}

Write-Host "`n=== Installation terminée avec succès ===" -ForegroundColor Green
Write-Host "Le serveur launcher est installé dans: $InstallPath" -ForegroundColor Cyan
Write-Host "Le serveur écoute sur: http://localhost:8765" -ForegroundColor Cyan
Write-Host "`nPour démarrer le serveur manuellement:" -ForegroundColor Yellow
Write-Host "  $InstallPath\start-launcher-server.bat" -ForegroundColor Gray
Write-Host "`nPour l'ajouter au démarrage Windows:" -ForegroundColor Yellow
Write-Host "  .\install-launcher-server.ps1 -AddToStartup" -ForegroundColor Gray
