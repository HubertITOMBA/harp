@echo off
REM Wrapper batch pour le launcher PowerShell
REM Ce fichier résout %LOCALAPPDATA% et appelle le script PowerShell
REM Utilisé dans le registre Windows pour éviter les chemins codés en dur

setlocal

REM Résoudre le chemin du launcher
set LAUNCHER_PATH=%LOCALAPPDATA%\HARP\launcher\launcher.ps1

REM Vérifier que le script existe
if not exist "%LAUNCHER_PATH%" (
    echo ERREUR: Le launcher n'est pas installe dans %LAUNCHER_PATH%
    echo Veuillez executer install-launcher-user.ps1
    pause
    exit /b 1
)

REM Appeler PowerShell avec le script launcher
powershell.exe -ExecutionPolicy Bypass -NoExit -WindowStyle Normal -File "%LAUNCHER_PATH%" "%~1"

endlocal

