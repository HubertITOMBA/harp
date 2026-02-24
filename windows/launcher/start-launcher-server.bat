@echo off
REM Script pour démarrer le serveur launcher en arrière-plan
REM Ce script peut être ajouté au démarrage Windows de l'utilisateur

setlocal

REM Chercher le launcher dans plusieurs emplacements possibles
REM PRIORITÉ: D:\apps\portal\launcher (production) > W:\portal > LOCALAPPDATA > TEMP
set LAUNCHER_DIR=
set SERVER_SCRIPT=

REM PRIORITÉ 1: Production - D:\apps\portal\launcher
if exist "D:\apps\portal\launcher\launcher-server.ps1" (
    set LAUNCHER_DIR=D:\apps\portal\launcher
    set SERVER_SCRIPT=D:\apps\portal\launcher\launcher-server.ps1
    goto :found
)

REM PRIORITÉ 2: W:\portal\HARP\launcher (home directory réseau)
if exist "W:\portal\HARP\launcher\launcher-server.ps1" (
    set LAUNCHER_DIR=W:\portal\HARP\launcher
    set SERVER_SCRIPT=W:\portal\HARP\launcher\launcher-server.ps1
    goto :found
)

REM PRIORITÉ 3: LOCALAPPDATA
if exist "%LOCALAPPDATA%\HARP\launcher\launcher-server.ps1" (
    set LAUNCHER_DIR=%LOCALAPPDATA%\HARP\launcher
    set SERVER_SCRIPT=%LOCALAPPDATA%\HARP\launcher\launcher-server.ps1
    goto :found
)

REM PRIORITÉ 4: TEMP
if exist "%TEMP%\HARP\launcher\launcher-server.ps1" (
    set LAUNCHER_DIR=%TEMP%\HARP\launcher
    set SERVER_SCRIPT=%TEMP%\HARP\launcher\launcher-server.ps1
    goto :found
)

REM Si aucun fichier trouvé, afficher un message d'erreur détaillé
echo ERREUR: Le serveur launcher n'est pas installe
echo.
echo Emplacements verifies:
if exist "D:\apps\portal\launcher\launcher-server.ps1" (
    echo   [OK] D:\apps\portal\launcher - launcher-server.ps1 present
) else (
    if exist "D:\apps\portal\launcher" (
        echo   [MANQUANT] D:\apps\portal\launcher existe mais launcher-server.ps1 absent
    ) else (
        echo   [MANQUANT] D:\apps\portal\launcher n'existe pas
    )
)
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
echo SOLUTION: En production, copiez les fichiers dans D:\apps\portal\launcher puis:
echo   cd D:\apps\portal\launcher
echo   .\install-launcher-server.ps1 -InstallPath "D:\apps\portal\launcher" -AddToStartup
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

