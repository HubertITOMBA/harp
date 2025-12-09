@echo off
REM Script pour démarrer le serveur launcher en arrière-plan
REM Ce script peut être ajouté au démarrage Windows de l'utilisateur

setlocal

set LAUNCHER_DIR=%LOCALAPPDATA%\HARP\launcher
set SERVER_SCRIPT=%LAUNCHER_DIR%\launcher-server.ps1

REM Vérifier que le script existe
if not exist "%SERVER_SCRIPT%" (
    echo ERREUR: Le serveur launcher n'est pas installe dans %LAUNCHER_DIR%
    echo Veuillez executer install-launcher-user.ps1
    pause
    exit /b 1
)

REM Démarrer le serveur en arrière-plan
start "" powershell.exe -ExecutionPolicy Bypass -WindowStyle Hidden -File "%SERVER_SCRIPT%"

endlocal

