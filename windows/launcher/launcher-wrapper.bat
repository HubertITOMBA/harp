@echo off
REM Wrapper batch pour le launcher PowerShell
REM Ce fichier résout %LOCALAPPDATA% et appelle le script PowerShell
REM Utilisé dans le registre Windows pour éviter les chemins codés en dur

setlocal

REM Chercher le launcher dans plusieurs emplacements
set LAUNCHER_PATH=

REM Essayer LOCALAPPDATA d'abord
if exist "%LOCALAPPDATA%\HARP\launcher\launcher.ps1" (
    set LAUNCHER_PATH=%LOCALAPPDATA%\HARP\launcher\launcher.ps1
)

REM Si pas trouvé, essayer W:\portal
if "%LAUNCHER_PATH%"=="" (
    if exist "W:\portal\HARP\launcher\launcher.ps1" (
        set LAUNCHER_PATH=W:\portal\HARP\launcher\launcher.ps1
    )
)

REM Si pas trouvé, essayer le dossier temp système
if "%LAUNCHER_PATH%"=="" (
    if exist "%TEMP%\HARP\launcher\launcher.ps1" (
        set LAUNCHER_PATH=%TEMP%\HARP\launcher\launcher.ps1
    )
)

REM Vérifier que le script existe
if "%LAUNCHER_PATH%"=="" (
    echo ERREUR: Le launcher n'est pas installe
    echo Veuillez executer install-launcher-user.ps1
    pause
    exit /b 1
)

REM Appeler PowerShell avec le script launcher
powershell.exe -ExecutionPolicy Bypass -NoExit -WindowStyle Normal -File "%LAUNCHER_PATH%" "%~1"

endlocal

