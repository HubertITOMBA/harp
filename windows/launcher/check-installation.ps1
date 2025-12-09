# Script de vérification de l'installation du launcher
# Vérifie que tous les fichiers nécessaires sont présents

Write-Host "`n=== Vérification de l'installation du Launcher HARP ===" -ForegroundColor Green
Write-Host ""

$installPaths = @(
    "W:\portal\HARP\launcher",
    "$env:LOCALAPPDATA\HARP\launcher",
    "$env:TEMP\HARP\launcher"
)

$requiredFiles = @(
    "launcher.ps1",
    "launcher-server.ps1",
    "launcher-config.json",
    "start-launcher-server.bat"
)

$foundInstallation = $false

foreach ($installPath in $installPaths) {
    Write-Host "Vérification de: $installPath" -ForegroundColor Cyan
    
    if (Test-Path $installPath) {
        Write-Host "  [OK] Répertoire existe" -ForegroundColor Green
        
        $allFilesPresent = $true
        foreach ($file in $requiredFiles) {
            $filePath = Join-Path $installPath $file
            if (Test-Path $filePath) {
                Write-Host "    [OK] $file" -ForegroundColor Green
            } else {
                Write-Host "    [MANQUANT] $file" -ForegroundColor Red
                $allFilesPresent = $false
            }
        }
        
        if ($allFilesPresent) {
            Write-Host "`n  [INSTALLATION COMPLÈTE] Tous les fichiers sont présents dans $installPath" -ForegroundColor Green
            $foundInstallation = $true
            break
        } else {
            Write-Host "  [INSTALLATION INCOMPLÈTE] Certains fichiers manquent" -ForegroundColor Yellow
        }
    } else {
        Write-Host "  [MANQUANT] Répertoire n'existe pas" -ForegroundColor Gray
    }
    Write-Host ""
}

if (-not $foundInstallation) {
    Write-Host "=== Aucune installation complète trouvée ===" -ForegroundColor Red
    Write-Host ""
    Write-Host "Pour installer le launcher, exécutez:" -ForegroundColor Yellow
    Write-Host "  cd D:\apps\portail\launcher" -ForegroundColor Gray
    Write-Host "  .\install-launcher-server.ps1 -AddToStartup" -ForegroundColor Gray
    Write-Host ""
} else {
    Write-Host "=== Installation trouvée et vérifiée ===" -ForegroundColor Green
    Write-Host ""
    Write-Host "Pour démarrer le serveur:" -ForegroundColor Yellow
    Write-Host "  $installPath\start-launcher-server.bat" -ForegroundColor Gray
    Write-Host ""
}

