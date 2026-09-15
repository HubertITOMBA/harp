@echo off
REM Wrapper batch for PowerShell launcher (ASCII only - cmd.exe safe)
REM Used by Windows registry protocol mylaunch://

setlocal

set "LAUNCHER_PATH="

REM PRIORITY 0: same directory as this script
if exist "%~dp0launcher.ps1" (
    set "LAUNCHER_PATH=%~dp0launcher.ps1"
)

REM PRIORITY 1: D:\apps\portal\launcher
if "%LAUNCHER_PATH%"=="" (
    if exist "D:\apps\portal\launcher\launcher.ps1" (
        set "LAUNCHER_PATH=D:\apps\portal\launcher\launcher.ps1"
    )
)

REM PRIORITY 1b: D:\apps\portail\launcher (legacy spelling)
if "%LAUNCHER_PATH%"=="" (
    if exist "D:\apps\portail\launcher\launcher.ps1" (
        set "LAUNCHER_PATH=D:\apps\portail\launcher\launcher.ps1"
    )
)

REM PRIORITY 2: W:\portal\HARP\launcher
if "%LAUNCHER_PATH%"=="" (
    if exist "W:\portal\HARP\launcher\launcher.ps1" (
        set "LAUNCHER_PATH=W:\portal\HARP\launcher\launcher.ps1"
    )
)

REM PRIORITY 3: LOCALAPPDATA
if "%LAUNCHER_PATH%"=="" (
    if exist "%LOCALAPPDATA%\HARP\launcher\launcher.ps1" (
        set "LAUNCHER_PATH=%LOCALAPPDATA%\HARP\launcher\launcher.ps1"
    )
)

REM PRIORITY 4: TEMP
if "%LAUNCHER_PATH%"=="" (
    if exist "%TEMP%\HARP\launcher\launcher.ps1" (
        set "LAUNCHER_PATH=%TEMP%\HARP\launcher\launcher.ps1"
    )
)

if "%LAUNCHER_PATH%"=="" (
    echo ERREUR: Le launcher n'est pas installe
    echo Veuillez executer install-launcher-user.ps1
    pause
    exit /b 1
)

powershell.exe -ExecutionPolicy Bypass -NoExit -WindowStyle Normal -File "%LAUNCHER_PATH%" "%~1"

endlocal
