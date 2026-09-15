@echo off
REM Start HARP launcher server - port PAR UTILISATEUR (8800-8999), ASCII only
REM Set VISIBLE=1 to show the PowerShell window (debug)

setlocal

set "LAUNCHER_DIR="
set "SERVER_SCRIPT="

if exist "%~dp0launcher-server.ps1" (
    set "LAUNCHER_DIR=%~dp0"
    set "SERVER_SCRIPT=%~dp0launcher-server.ps1"
    goto :found
)

if exist "D:\apps\portal\launcher\launcher-server.ps1" (
    set "LAUNCHER_DIR=D:\apps\portal\launcher"
    set "SERVER_SCRIPT=D:\apps\portal\launcher\launcher-server.ps1"
    goto :found
)

if exist "D:\apps\portail\launcher\launcher-server.ps1" (
    set "LAUNCHER_DIR=D:\apps\portail\launcher"
    set "SERVER_SCRIPT=D:\apps\portail\launcher\launcher-server.ps1"
    goto :found
)

if exist "W:\portal\HARP\launcher\launcher-server.ps1" (
    set "LAUNCHER_DIR=W:\portal\HARP\launcher"
    set "SERVER_SCRIPT=W:\portal\HARP\launcher\launcher-server.ps1"
    goto :found
)

if exist "%LOCALAPPDATA%\HARP\launcher\launcher-server.ps1" (
    set "LAUNCHER_DIR=%LOCALAPPDATA%\HARP\launcher"
    set "SERVER_SCRIPT=%LOCALAPPDATA%\HARP\launcher\launcher-server.ps1"
    goto :found
)

echo ERREUR: Le serveur launcher n'est pas installe
pause
exit /b 1

:found
if not exist "%SERVER_SCRIPT%" (
    echo ERREUR: launcher-server.ps1 introuvable: %SERVER_SCRIPT%
    pause
    exit /b 1
)

echo Dossier launcher: %LAUNCHER_DIR%
echo TEMP session: %TEMP%
echo USER: %USERNAME%
echo.
echo NOTE: demarre le serveur HTTP sur un PORT DEDIE a votre user (8800-8999).
echo       Ne lance PAS Putty. Putty se lance depuis le PORTAIL.
echo.

REM Verifier si NOTRE serveur (port user) repond deja
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command ^
  "$u=$env:USERNAME; if($u -match '\\'){$u=$u.Split('\')[-1]}; $u=$u.ToLower(); $sum=0; foreach($c in $u.ToCharArray()){$sum+=[int]$c}; $p=8800+($sum%%200); try { $r=Invoke-RestMethod -Uri \"http://localhost:$p/health\" -TimeoutSec 2; Write-Host ('DEJA ACTIF port=' + $p + ' ' + ($r|ConvertTo-Json -Compress)) -ForegroundColor Green; exit 0 } catch { Write-Host ('Port preferentiel ' + $p + ' libre - demarrage...') -ForegroundColor Yellow; exit 1 }"
if %ERRORLEVEL%==0 (
    echo.
    echo [OK] Votre launcher tourne deja. Pret pour le portail.
    echo Logs: W:\portal\HARP\launcher\logs\
    echo Port:  W:\portal\HARP\launcher\launcher.port
    if /I not "%NO_PAUSE%"=="1" timeout /t 10 /nobreak
    endlocal
    exit /b 0
)

echo Demarrage du serveur launcher...
if /I "%VISIBLE%"=="1" (
    start "HARP-Launcher-Server" powershell.exe -ExecutionPolicy Bypass -NoExit -File "%SERVER_SCRIPT%"
) else (
    start "HARP-Launcher-Server" powershell.exe -ExecutionPolicy Bypass -WindowStyle Minimized -File "%SERVER_SCRIPT%"
)

echo Attente du demarrage (4s)...
timeout /t 4 /nobreak >nul

powershell.exe -NoProfile -ExecutionPolicy Bypass -Command ^
  "$u=$env:USERNAME; if($u -match '\\'){$u=$u.Split('\')[-1]}; $u=$u.ToLower(); $sum=0; foreach($c in $u.ToCharArray()){$sum+=[int]$c}; $base=8800+($sum%%200); $ok=$false; for($i=0;$i -le 30;$i++){ $p=$base+$i; if($p -gt 8999){$p=8800+(($p-8800)%%200)}; try { $r=Invoke-RestMethod -Uri \"http://localhost:$p/health\" -TimeoutSec 1; Write-Host ('HEALTH OK port=' + $p + ' ' + ($r|ConvertTo-Json -Compress)) -ForegroundColor Green; $ok=$true; break } catch {} }; if(-not $ok){ Write-Host 'HEALTH ECHEC: lisez %%TEMP%%\harp-launcher-server.log et W:\portal\HARP\launcher\logs\server.log' -ForegroundColor Red }"

echo.
echo Fichier port: W:\portal\HARP\launcher\launcher.port
echo Logs:         W:\portal\HARP\launcher\logs\server.log
echo               %TEMP%\harp-launcher-server.log
echo.
if /I not "%NO_PAUSE%"=="1" (
    timeout /t 12 /nobreak
)

endlocal
