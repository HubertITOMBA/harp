@echo off
REM Script pour démarrer le serveur launcher en arrière-plan
REM Ce script peut être ajouté au démarrage Windows de l'utilisateur

setlocal

REM Chercher le launcher dans plusieurs emplacements possibles
set LAUNCHER_DIR=
set SERVER_SCRIPT=

REM Essayer LOCALAPPDATA d'abord
if exist "%LOCALAPPDATA%\HARP\launcher\launcher-server.ps1" (
    set LAUNCHER_DIR=%LOCALAPPDATA%\HARP\launcher
    set SERVER_SCRIPT=%LAUNCHER_DIR%\launcher-server.ps1
)

REM Si pas trouvé, essayer W:\portal\HARP\launcher
if "%SERVER_SCRIPT%"=="" (
    if exist "W:\portal\HARP\launcher\launcher-server.ps1" (
        set LAUNCHER_DIR=W:\portal\HARP\launcher
        set SERVER_SCRIPT=%LAUNCHER_DIR%\launcher-server.ps1
    )
)

REM Si pas trouvé, essayer le dossier temp système
if "%SERVER_SCRIPT%"=="" (
    if exist "%TEMP%\HARP\launcher\launcher-server.ps1" (
        set LAUNCHER_DIR=%TEMP%\HARP\launcher
        set SERVER_SCRIPT=%LAUNCHER_DIR%\launcher-server.ps1
    )
)

REM Vérifier que le script existe
if "%SERVER_SCRIPT%"=="" (
    echo ERREUR: Le serveur launcher n'est pas installe
    echo Veuillez executer install-launcher-server.ps1
    pause
    exit /b 1
)

REM Vérifier que le fichier existe vraiment
if not exist "%SERVER_SCRIPT%" (
    echo ERREUR: Le script launcher-server.ps1 est introuvable dans %LAUNCHER_DIR%
    pause
    exit /b 1
)

REM Démarrer le serveur en arrière-plan
start "" powershell.exe -ExecutionPolicy Bypass -WindowStyle Hidden -File "%SERVER_SCRIPT%"

endlocal

