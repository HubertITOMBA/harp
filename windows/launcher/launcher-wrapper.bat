@echo off
REM Wrapper batch pour le launcher PowerShell
REM Ce fichier résout %LOCALAPPDATA% et appelle le script PowerShell
REM Utilisé dans le registre Windows pour éviter les chemins codés en dur

setlocal

REM Chercher le launcher dans plusieurs emplacements possibles
REM PRIORITÉ: D:\apps\portal\launcher (production) > W:\portal > LOCALAPPDATA > TEMP
set LAUNCHER_PATH=

REM PRIORITÉ 1: Production - D:\apps\portal\launcher
if exist "D:\apps\portal\launcher\launcher.ps1" (
    set LAUNCHER_PATH=D:\apps\portal\launcher\launcher.ps1
)

REM PRIORITÉ 2: W:\portal\HARP\launcher (home directory réseau)
if "%LAUNCHER_PATH%"=="" (
    if exist "W:\portal\HARP\launcher\launcher.ps1" (
        set LAUNCHER_PATH=W:\portal\HARP\launcher\launcher.ps1
    )
)

REM PRIORITÉ 3: LOCALAPPDATA
if "%LAUNCHER_PATH%"=="" (
    if exist "%LOCALAPPDATA%\HARP\launcher\launcher.ps1" (
        set LAUNCHER_PATH=%LOCALAPPDATA%\HARP\launcher\launcher.ps1
    )
)

REM PRIORITÉ 4: TEMP
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

