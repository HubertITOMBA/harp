# Script d'installation automatique du protocole mylaunch://
# A executer en tant qu'administrateur

param(
    [string]$InstallPath = "C:\apps\portail\launcher",
    [switch]$Force
)

$ErrorActionPreference = 'Stop'

# Verifier les privileges administrateur
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "ERREUR: Ce script doit etre execute en tant qu'administrateur." -ForegroundColor Red
    Write-Host "Faites un clic droit sur PowerShell et selectionnez 'Executer en tant qu'administrateur'" -ForegroundColor Yellow
    exit 1
}

Write-Host "`n=== Installation du protocole mylaunch:// ===" -ForegroundColor Green
Write-Host "Chemin d'installation: $InstallPath`n" -ForegroundColor Cyan

# Etape 1: Creer le repertoire d'installation
Write-Host "[1/5] Creation du repertoire d'installation..." -ForegroundColor Yellow
if (-not (Test-Path $InstallPath)) {
    New-Item -ItemType Directory -Path $InstallPath -Force | Out-Null
    Write-Host "  [OK] Repertoire cree" -ForegroundColor Green
} else {
    Write-Host "  [OK] Repertoire existe deja" -ForegroundColor Green
}

# Etape 2: Copier le script launcher
Write-Host "[2/5] Copie du script launcher..." -ForegroundColor Yellow
$scriptPath = Join-Path $PSScriptRoot "launcher\launcher.ps1"
$targetScript = Join-Path $InstallPath "launcher.ps1"

if (Test-Path $scriptPath) {
    Copy-Item -Path $scriptPath -Destination $targetScript -Force
    Write-Host "  [OK] Script copie vers $targetScript" -ForegroundColor Green
} else {
    Write-Host "  [ERREUR] Fichier source introuvable: $scriptPath" -ForegroundColor Red
    exit 1
}

# Etape 3: Configurer les permissions
Write-Host "[3/5] Configuration des permissions..." -ForegroundColor Yellow
try {
    $acl = Get-Acl $InstallPath
    $permission = "Users", "ReadAndExecute", "ContainerInherit,ObjectInherit", "None", "Allow"
    $accessRule = New-Object System.Security.AccessControl.FileSystemAccessRule $permission
    $acl.SetAccessRule($accessRule)
    Set-Acl $InstallPath $acl
    Write-Host "  [OK] Permissions configurees" -ForegroundColor Green
} catch {
    Write-Host "  [ATTENTION] Impossible de configurer les permissions: $_" -ForegroundColor Yellow
}

# Etape 4: Creer le fichier .reg avec le bon chemin
Write-Host "[4/5] Generation du fichier de registre..." -ForegroundColor Yellow
$regPath = $InstallPath.Replace('\', '\\')
$regContent = @"
Windows Registry Editor Version 5.00

; Protocole personnalise: mylaunch://
; Genere automatiquement par install.ps1

[HKEY_CLASSES_ROOT\mylaunch]
@="URL:My Launch Protocol"
"URL Protocol"=""

[HKEY_CLASSES_ROOT\mylaunch\DefaultIcon]
@="C:\\Windows\\System32\\shell32.dll,0"

[HKEY_CLASSES_ROOT\mylaunch\shell]

[HKEY_CLASSES_ROOT\mylaunch\shell\open]

[HKEY_CLASSES_ROOT\mylaunch\shell\open\command]
@="\"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe\" -ExecutionPolicy Bypass -WindowStyle Hidden -File \"$regPath\\launcher.ps1\" \"%1\""
"@

$regFile = Join-Path $PSScriptRoot "protocol\install-mylaunch-generated.reg"
$regContent | Out-File -FilePath $regFile -Encoding ASCII -Force
Write-Host "  [OK] Fichier .reg genere: $regFile" -ForegroundColor Green

# Etape 5: Installer le protocole dans le registre
Write-Host "[5/5] Installation du protocole dans le registre Windows..." -ForegroundColor Yellow
try {
    # Verifier si le protocole existe deja
    $existing = Get-ItemProperty -Path "HKCR:\mylaunch" -ErrorAction SilentlyContinue
    if ($existing -and -not $Force) {
        Write-Host "  [ATTENTION] Le protocole mylaunch:// est deja installe." -ForegroundColor Yellow
        $response = Read-Host "  Voulez-vous le reinstaller ? (O/N)"
        if ($response -ne "O" -and $response -ne "o") {
            Write-Host "  Installation annulee." -ForegroundColor Yellow
            exit 0
        }
    }

    # Importer le fichier .reg
    $process = Start-Process -FilePath "reg.exe" -ArgumentList "import", "`"$regFile`"" -Wait -NoNewWindow -PassThru
    if ($process.ExitCode -eq 0) {
        Write-Host "  [OK] Protocole installe avec succes" -ForegroundColor Green
    } else {
        throw "Erreur lors de l'import du registre (code: $($process.ExitCode))"
    }
} catch {
    Write-Host "  [ERREUR] Erreur lors de l'installation: $_" -ForegroundColor Red
    exit 1
}

# Verification finale
Write-Host "`n=== Verification de l'installation ===" -ForegroundColor Green
# Utiliser reg query pour verifier (plus fiable que Get-ItemProperty avec HKCR)
$checkResult = reg query "HKEY_CLASSES_ROOT\mylaunch" 2>&1
$check = $LASTEXITCODE -eq 0
if ($check) {
    Write-Host "[OK] Protocole mylaunch:// installe correctement" -ForegroundColor Green
    Write-Host "[OK] Script launcher disponible: $targetScript" -ForegroundColor Green
    
    # Tester le script
    Write-Host "`nTest du script launcher..." -ForegroundColor Yellow
    try {
        $testUrl = "mylaunch://putty?host=test"
        & $targetScript $testUrl 2>&1 | Out-Null
        Write-Host "[OK] Script fonctionne correctement" -ForegroundColor Green
    } catch {
        Write-Host "[ATTENTION] Le script a genere une erreur (normal si PuTTY n'est pas installe)" -ForegroundColor Yellow
    }
    
    Write-Host "`n=== Installation terminee avec succes ===" -ForegroundColor Green
    Write-Host "Vous pouvez maintenant utiliser mylaunch:// dans votre application Next.js" -ForegroundColor Cyan
    Write-Host "`nExemple de test dans la console du navigateur:" -ForegroundColor Yellow
    Write-Host '  window.location.href = "mylaunch://putty?host=192.168.1.49&user=root&port=22"' -ForegroundColor Gray
} else {
    Write-Host "[ERREUR] L'installation semble avoir echoue" -ForegroundColor Red
    exit 1
}
