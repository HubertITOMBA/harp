@echo off
REM Script pour démarrer le serveur launcher en arrière-plan
REM Ce script peut être ajouté au démarrage Windows de l'utilisateur

setlocal

REM Chercher le launcher dans plusieurs emplacements possibles
REM PRIORITÉ: W:\portal (home directory réseau) > LOCALAPPDATA > TEMP
set LAUNCHER_DIR=
set SERVER_SCRIPT=

REM PRIORITÉ 1: Essayer W:\portal\HARP\launcher d'abord (home directory réseau)
if exist "W:\portal\HARP\launcher\launcher-server.ps1" (
    set LAUNCHER_DIR=W:\portal\HARP\launcher
    set SERVER_SCRIPT=W:\portal\HARP\launcher\launcher-server.ps1
    goto :found
)

REM PRIORITÉ 2: Si pas trouvé, essayer LOCALAPPDATA
if exist "%LOCALAPPDATA%\HARP\launcher\launcher-server.ps1" (
    set LAUNCHER_DIR=%LOCALAPPDATA%\HARP\launcher
    set SERVER_SCRIPT=%LOCALAPPDATA%\HARP\launcher\launcher-server.ps1
    goto :found
)

REM PRIORITÉ 3: Si pas trouvé, essayer le dossier temp système
if exist "%TEMP%\HARP\launcher\launcher-server.ps1" (
    set LAUNCHER_DIR=%TEMP%\HARP\launcher
    set SERVER_SCRIPT=%TEMP%\HARP\launcher\launcher-server.ps1
    goto :found
)

REM Si aucun fichier trouvé, afficher un message d'erreur détaillé
echo ERREUR: Le serveur launcher n'est pas installe
echo.
echo Emplacements verifies:
if exist "W:\portal\HARP\launcher" (
    echo   [OK] W:\portal\HARP\launcher existe
    if exist "W:\portal\HARP\launcher\launcher-server.ps1" (
        echo   [OK] launcher-server.ps1 trouve dans W:\portal
    ) else (
        echo   [MANQUANT] launcher-server.ps1 introuvable dans W:\portal\HARP\launcher
    )
) else (
    echo   [MANQUANT] W:\portal\HARP\launcher n'existe pas
)

if exist "%LOCALAPPDATA%\HARP\launcher" (
    echo   [OK] %LOCALAPPDATA%\HARP\launcher existe
    if exist "%LOCALAPPDATA%\HARP\launcher\launcher-server.ps1" (
        echo   [OK] launcher-server.ps1 trouve dans LOCALAPPDATA
    ) else (
        echo   [MANQUANT] launcher-server.ps1 introuvable dans LOCALAPPDATA
    )
) else (
    echo   [MANQUANT] %LOCALAPPDATA%\HARP\launcher n'existe pas
)

echo.
echo SOLUTION: Executez install-launcher-server.ps1 depuis D:\apps\portail\launcher
echo   Exemple: cd D:\apps\portail\launcher
echo            .\install-launcher-server.ps1 -AddToStartup
pause
exit /b 1

:found
REM Vérifier une dernière fois que le fichier existe vraiment
if not exist "%SERVER_SCRIPT%" (
    echo ERREUR: Le script launcher-server.ps1 est introuvable dans %LAUNCHER_DIR%
    echo Chemin teste: %SERVER_SCRIPT%
    pause
    exit /b 1
)

REM Démarrer le serveur en arrière-plan
start "" powershell.exe -ExecutionPolicy Bypass -WindowStyle Hidden -File "%SERVER_SCRIPT%"

endlocal

