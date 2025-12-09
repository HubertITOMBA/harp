# Script d'installation du protocole mylaunch:// pour utilisateur
# Nécessite des droits administrateur pour modifier le registre
# Alternative : Demander à l'administrateur d'installer via GPO

param(
    [string]$LauncherPath = "$env:LOCALAPPDATA\HARP\launcher\launcher.ps1"
)

$ErrorActionPreference = 'Stop'

# Vérifier les privilèges administrateur
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "ERREUR: Ce script doit être exécuté en tant qu'administrateur." -ForegroundColor Red
    Write-Host "Faites un clic droit sur PowerShell et sélectionnez 'Exécuter en tant qu'administrateur'" -ForegroundColor Yellow
    exit 1
}

Write-Host "`n=== Installation du protocole mylaunch:// ===" -ForegroundColor Green
Write-Host "Chemin du launcher: $LauncherPath`n" -ForegroundColor Cyan

# Vérifier que le launcher existe
if (-not (Test-Path $LauncherPath)) {
    Write-Host "ERREUR: Le script launcher n'existe pas: $LauncherPath" -ForegroundColor Red
    Write-Host "Exécutez d'abord install-launcher-user.ps1" -ForegroundColor Yellow
    exit 1
}

# Utiliser le wrapper batch au lieu du script PowerShell directement
$wrapperPath = Join-Path (Split-Path $LauncherPath) "launcher-wrapper.bat"
if (-not (Test-Path $wrapperPath)) {
    Write-Host "ERREUR: Le wrapper batch n'existe pas: $wrapperPath" -ForegroundColor Red
    Write-Host "Exécutez d'abord install-launcher-user.ps1" -ForegroundColor Yellow
    exit 1
}

# Résoudre le chemin complet du wrapper (nécessaire car le registre ne supporte pas les variables d'environnement)
$resolvedWrapperPath = (Resolve-Path $wrapperPath).Path

# Normaliser le chemin pour le registre (échapper les backslashes)
$regPath = $resolvedWrapperPath.Replace('\', '\\')

# Créer le fichier .reg temporaire
$regContent = @"
Windows Registry Editor Version 5.00

; Protocole personnalisé: mylaunch://
; Installation pour utilisateur

[HKEY_CLASSES_ROOT\mylaunch]
@="URL:My Launch Protocol"
"URL Protocol"=""

[HKEY_CLASSES_ROOT\mylaunch\DefaultIcon]
@="C:\\Windows\\System32\\shell32.dll,0"

[HKEY_CLASSES_ROOT\mylaunch\shell]

[HKEY_CLASSES_ROOT\mylaunch\shell\open]

[HKEY_CLASSES_ROOT\mylaunch\shell\open\command]
@="\"$regPath\" \"%1\""
"@

$regFile = Join-Path $env:TEMP "install-mylaunch-user-$(Get-Date -Format 'yyyyMMddHHmmss').reg"
$regContent | Out-File -FilePath $regFile -Encoding ASCII -Force

Write-Host "Installation du protocole dans le registre Windows..." -ForegroundColor Yellow
try {
    $process = Start-Process -FilePath "reg.exe" -ArgumentList "import", "`"$regFile`"" -Wait -NoNewWindow -PassThru
    if ($process.ExitCode -eq 0) {
        Write-Host "  [OK] Protocole installé avec succès" -ForegroundColor Green
    } else {
        throw "Erreur lors de l'import du registre (code: $($process.ExitCode))"
    }
} catch {
    Write-Host "  [ERREUR] Erreur lors de l'installation: $_" -ForegroundColor Red
    exit 1
} finally {
    # Nettoyer le fichier temporaire
    if (Test-Path $regFile) {
        Remove-Item $regFile -Force
    }
}

Write-Host "`n=== Installation terminée avec succès ===" -ForegroundColor Green
Write-Host "Le protocole mylaunch:// est maintenant installé." -ForegroundColor Cyan

