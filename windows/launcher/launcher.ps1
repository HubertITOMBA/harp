#Requires -Version 5.1
param(
    [Parameter(Mandatory = $true, Position = 0)]
    [string]$Url
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Write-Log($message) {
    $logDir = Join-Path $PSScriptRoot 'logs'
    if (-not (Test-Path $logDir)) { New-Item -ItemType Directory -Path $logDir | Out-Null }
    $stamp = (Get-Date).ToString('yyyy-MM-dd HH:mm:ss.fff')
    $logMessage = "[$stamp] $message"
    Add-Content -Path (Join-Path $logDir 'launcher.log') -Value $logMessage
    Write-Host $logMessage -ForegroundColor Cyan
}

function Show-Error($message) {
    Write-Host "`n========================================" -ForegroundColor Red
    Write-Host "ERREUR: $message" -ForegroundColor Red
    Write-Host "========================================`n" -ForegroundColor Red
    Write-Log "ERREUR: $message"
}

try {
    Write-Host "`n=== Launcher PowerShell ===" -ForegroundColor Green
    Write-Log "Launch request: $Url"
    Write-Host "URL reçue: $Url" -ForegroundColor Yellow

    if (-not ($Url -match '^mylaunch://')) {
        throw "Protocole invalide. Attendu: mylaunch://, reçu: $($Url.Substring(0, [Math]::Min(20, $Url.Length)))"
    }

    $uri = [System.Uri]::new($Url)
    # Format attendu: mylaunch://<tool>?k=v&...
    $tool = $uri.Host
    Write-Host "Outil détecté: $tool" -ForegroundColor Yellow

    # Parse query
    $query = @{ }
    if ($uri.Query) {
        Write-Host "Paramètres de requête: $($uri.Query)" -ForegroundColor Yellow
        $pairs = $uri.Query.TrimStart('?').Split('&') | Where-Object { $_ -ne '' }
        foreach ($pair in $pairs) {
            $kv = $pair.Split('=',2)
            $k = [System.Uri]::UnescapeDataString($kv[0])
            $v = if ($kv.Count -gt 1) { [System.Uri]::UnescapeDataString($kv[1]) } else { '' }
            $query[$k] = $v
            Write-Host "  - $k = $v" -ForegroundColor Gray
        }
    } else {
        Write-Host "Aucun paramètre de requête" -ForegroundColor Gray
    }

    # Whitelist des outils autorisés et mapping chemin + args builder
    $allowed = @{
        'putty' = @{ 
            Path = 'C:\\Program Files\\PuTTY\\putty.exe'
            BuildArgs = {
                param($q)
                $args = @()
                if ($q.ContainsKey('host')) {
                    $user = if ($q.ContainsKey('user') -and $q.user) { "$($q.user)@" } else { '' }
                    $args += "$user$($q.host)"
                }
                if ($q.ContainsKey('port')) { $args += ('-P'), $q.port }
                if ($q.ContainsKey('sshkey')) { $args += ('-i'), $q.sshkey }
                return ,$args
            }
        }
        'pside' = @{ 
            Path = 'C:\\Program Files\\PeopleSoft\\pside.exe'
            BuildArgs = { param($q) @() }
        }
        'ptsmt' = @{ 
            Path = 'C:\\Program Files\\PeopleSoft\\ptsmt.exe'
            BuildArgs = { param($q) @() }
        }
    }

    if (-not $allowed.ContainsKey($tool)) {
        throw "Outil non autorisé: '$tool'. Outils disponibles: $($allowed.Keys -join ', ')"
    }

    $entry = $allowed[$tool]
    $exe = $entry.Path
    Write-Host "Chemin de l'exécutable: $exe" -ForegroundColor Yellow
    
    if (-not (Test-Path $exe)) {
        throw "Exécutable introuvable: $exe"
    }
    Write-Host "Exécutable trouvé: OK" -ForegroundColor Green

    $buildArgs = $entry.BuildArgs
    $args = & $buildArgs.Invoke($query)
    Write-Host "Arguments construits: $($args -join ' ')" -ForegroundColor Yellow

    Write-Log "Launching: $exe $($args -join ' ')"

    $startInfo = New-Object System.Diagnostics.ProcessStartInfo
    $startInfo.FileName = $exe
    foreach ($a in $args) { $null = $startInfo.ArgumentList.Add($a) }
    $startInfo.UseShellExecute = $true

    Write-Host "Lancement de l'application..." -ForegroundColor Green
    $proc = [System.Diagnostics.Process]::Start($startInfo)
    if (-not $proc) { 
        throw "Échec du lancement: Process.Start a retourné null"
    }
    
    Write-Host "Application lancée avec succès (PID: $($proc.Id))" -ForegroundColor Green
    Write-Log "Succès: Application lancée (PID: $($proc.Id))"
    
    # Attendre un peu pour voir si le processus démarre correctement
    Start-Sleep -Milliseconds 500
    if ($proc.HasExited) {
        Write-Host "ATTENTION: Le processus s'est terminé immédiatement (Code de sortie: $($proc.ExitCode))" -ForegroundColor Yellow
        Write-Log "ATTENTION: Processus terminé immédiatement (Code: $($proc.ExitCode))"
    }
    
    exit 0
}
catch {
    $errorMsg = $_.Exception.Message
    $errorDetails = $_.Exception.ToString()
    
    Show-Error $errorMsg
    Write-Host "Détails de l'erreur:" -ForegroundColor Red
    Write-Host $errorDetails -ForegroundColor Red
    
    # Essayer d'afficher une MessageBox, mais ne pas bloquer si ça échoue
    try {
        Add-Type -AssemblyName System.Windows.Forms
        [System.Windows.Forms.MessageBox]::Show(
            "Lancement échoué: $errorMsg`n`nConsultez la console pour plus de détails.", 
            'Launcher - Erreur', 
            'OK', 
            'Error'
        ) | Out-Null
    } catch {
        Write-Host "Impossible d'afficher la MessageBox (normal si exécution non-interactive)" -ForegroundColor Yellow
    }
    
    Write-Host "`nAppuyez sur une touche pour fermer cette fenêtre..." -ForegroundColor Yellow
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    
    exit 1
}


