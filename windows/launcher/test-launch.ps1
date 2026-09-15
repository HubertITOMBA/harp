# Diagnostic rapide du launcher HARP (sans Admin, sans registre)
# Usage: cd D:\apps\portail\launcher ; .\test-launch.ps1

$ErrorActionPreference = "Continue"
Write-Host "=== Diagnostic launcher HARP ===" -ForegroundColor Green

$root = $PSScriptRoot
if (-not $root) { $root = "D:\apps\portail\launcher" }

Write-Host "`n[1] Fichiers" -ForegroundColor Yellow
foreach ($f in @("launcher.ps1","launcher-server.ps1","launcher-config.json","start-launcher-server.bat")) {
    $p = Join-Path $root $f
    if (Test-Path $p) { Write-Host "  OK  $p" -ForegroundColor Green }
    else { Write-Host "  MANQUANT  $p" -ForegroundColor Red }
}

Write-Host "`n[2] Health launcher (port par utilisateur)" -ForegroundColor Yellow
$u = $env:USERNAME
if ($u -match '\\') { $u = $u.Split('\')[-1] }
$u = $u.ToLower()
$sum = 0
foreach ($c in $u.ToCharArray()) { $sum += [int]$c }
$basePort = 8800 + ($sum % 200)
Write-Host "  User=$u port preferentiel=$basePort" -ForegroundColor Gray
$healthOk = $false
$activePort = $null
for ($i = 0; $i -le 30; $i++) {
    $p = $basePort + $i
    if ($p -gt 8999) { $p = 8800 + (($p - 8800) % 200) }
    try {
        $h = Invoke-RestMethod -Uri "http://localhost:$p/health" -TimeoutSec 2
        Write-Host "  OK  port=$p  $($h | ConvertTo-Json -Compress)" -ForegroundColor Green
        $healthOk = $true
        $activePort = $p
        break
    } catch {}
}
if (-not $healthOk) {
    Write-Host "  ECHEC  aucun port proche de $basePort" -ForegroundColor Red
    Write-Host "  => Lancez start-launcher-server.bat puis retestez" -ForegroundColor Yellow
}

Write-Host "`n[3] Chemins de logs" -ForegroundColor Yellow
$logCandidates = @(
    "W:\portal\HARP\launcher\logs",
    (Join-Path $root "logs"),
    $env:TEMP
)
foreach ($d in $logCandidates) {
    $ok = Test-Path $d
    Write-Host ("  {0}  {1}" -f ($(if ($ok) {"OK"} else {"NO"}), $d))
}

Write-Host "`n[4] Test lancement Putty via API /launch" -ForegroundColor Yellow
Write-Host "  NOTE: ce test ouvre Putty vers 127.0.0.1 user=test" -ForegroundColor DarkYellow
Write-Host "  => la fenetre reste inactive / refuse la connexion : NORMAL" -ForegroundColor DarkYellow
if (-not $activePort) {
    Write-Host "  Skip: pas de serveur actif" -ForegroundColor Red
} else {
    $launchUrl = "http://localhost:$activePort/launch?tool=putty&host=127.0.0.1&user=test&port=22"
    try {
        $r = Invoke-RestMethod -Uri $launchUrl -TimeoutSec 5
        Write-Host "  Reponse: $($r | ConvertTo-Json -Compress)" -ForegroundColor Cyan
    } catch {
        Write-Host "  ECHEC /launch: $_" -ForegroundColor Red
    }
}

Start-Sleep -Seconds 2

Write-Host "`n[5] Contenu recent des logs" -ForegroundColor Yellow
$files = @(
    "W:\portal\HARP\launcher\logs\server.log",
    "W:\portal\HARP\launcher\logs\launcher.log",
    (Join-Path $root "logs\server.log"),
    (Join-Path $root "logs\launcher.log"),
    (Join-Path $env:TEMP "harp-launcher-server.log"),
    (Join-Path $env:TEMP "harp-launcher.log")
)
foreach ($f in $files) {
    if (Test-Path $f) {
        Write-Host "  --- $f ---" -ForegroundColor Green
        Get-Content $f -Tail 8 -ErrorAction SilentlyContinue | ForEach-Object { Write-Host "    $_" }
    } else {
        Write-Host "  (absent) $f" -ForegroundColor DarkGray
    }
}

Write-Host "`n[6] Test direct launcher.ps1 (fenetre visible)" -ForegroundColor Yellow
$script = Join-Path $root "launcher.ps1"
if (Test-Path $script) {
    $url = "mylaunch://putty?host=127.0.0.1&user=test&port=22"
    $b64 = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($url))
    Write-Host "  Demarrage: powershell -File launcher.ps1 -UrlBase64 ..." -ForegroundColor Gray
    Start-Process powershell.exe -ArgumentList @(
        "-ExecutionPolicy","Bypass","-NoProfile","-NoExit",
        "-File", $script, "-UrlBase64", $b64
    )
    Write-Host "  => Une fenetre PowerShell doit s'ouvrir. Lisez l'erreur eventuelle." -ForegroundColor Yellow
} else {
    Write-Host "  launcher.ps1 introuvable" -ForegroundColor Red
}

Write-Host "`n=== Fin diagnostic ===" -ForegroundColor Green
Write-Host "Appuyez sur une touche pour fermer..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
