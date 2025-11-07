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
                $argList = @()
                
                # Port doit venir en premier pour PuTTY
                if ($q.ContainsKey('port')) { 
                    $argList += '-P'
                    $argList += [string]$q.port
                }
                
                # Clé SSH avant le host
                if ($q.ContainsKey('sshkey')) { 
                    $argList += '-i'
                    $argList += [string]$q.sshkey
                }
                
                # Host en dernier (avec user si fourni) - REQUIS pour PuTTY
                if (-not $q.ContainsKey('host') -or [string]::IsNullOrWhiteSpace($q.host)) {
                    throw "Le parametre 'host' est requis pour lancer PuTTY"
                }
                
                $hostValue = [string]$q.host
                if ($q.ContainsKey('user') -and $q.user -and -not [string]::IsNullOrWhiteSpace($q.user)) {
                    $userValue = [string]$q.user
                    $argList += "${userValue}@${hostValue}"
                } else {
                    $argList += $hostValue
                }
                
                return $argList
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
        'sqldeveloper' = @{ 
            Path = 'C:\\apps\\sqldeveloper\\sqldeveloper.exe'
            BuildArgs = { param($q) @() }
        }
        'psdmt' = @{ 
            Path = 'C:\\Program Files\\PeopleSoft\\psdmt.exe'
            BuildArgs = { param($q) @() }
        }
        'pscfg' = @{ 
            Path = 'C:\\Program Files\\PeopleSoft\\pscfg.exe'
            BuildArgs = { param($q) @() }
        }
        'sqlplus' = @{ 
            Path = 'C:\\oracle\\product\\19.0.0\\dbhome_1\\bin\\sqlplus.exe'
            BuildArgs = { param($q) @() }
        }
        'filezilla' = @{ 
            Path = 'C:\\Program Files\\FileZilla FTP Client\\filezilla.exe'
            BuildArgs = { param($q) @() }
        }
        'perl' = @{ 
            Path = 'C:\\Perl64\\bin\\perl.exe'
            BuildArgs = { param($q) @() }
        }
        'winscp' = @{ 
            Path = 'C:\\Program Files\\WinSCP\\WinSCP.exe'
            BuildArgs = { param($q) @() }
        }
        'winmerge' = @{ 
            Path = 'C:\\Program Files\\WinMerge\\WinMergeU.exe'
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
    # Utiliser .Invoke() directement sans & pour éviter l'interprétation comme commande
    $argArray = $buildArgs.Invoke($query)
    
    # S'assurer que $argArray est un tableau plat (NE PAS utiliser $args qui est réservé)
    $processArgs = @()
    if ($null -ne $argArray) {
        if ($argArray -is [System.Array]) {
            foreach ($item in $argArray) {
                if ($item -is [System.Array]) {
                    $processArgs += $item
                } else {
                    $processArgs += $item
                }
            }
        } else {
            $processArgs += $argArray
        }
    }
    
    Write-Host "Arguments construits: $($processArgs -join ' ')" -ForegroundColor Yellow
    Write-Host "Nombre d'arguments: $($processArgs.Count)" -ForegroundColor Yellow
    foreach ($arg in $processArgs) {
        Write-Host "  - Argument: '$arg' (type: $($arg.GetType().Name))" -ForegroundColor Gray
    }

    Write-Log "Launching: $exe $($processArgs -join ' ')"

    $startInfo = New-Object System.Diagnostics.ProcessStartInfo
    $startInfo.FileName = $exe
    $startInfo.UseShellExecute = $false
    $startInfo.RedirectStandardOutput = $false
    $startInfo.RedirectStandardError = $false
    $startInfo.CreateNoWindow = $false
    
    # Construire la ligne de commande complète avec échappement correct
    $argumentString = ""
    foreach ($a in $processArgs) {
        if ($null -ne $a -and $a -ne '') {
            $argStr = [string]$a
            # Toujours entourer de guillemets pour éviter les problèmes d'interprétation
            $argumentString += " `"$argStr`""
        }
    }
    $startInfo.Arguments = $argumentString.Trim()
    
    Write-Host "Commande complete: $exe $($startInfo.Arguments)" -ForegroundColor Cyan

    Write-Host "Lancement de l'application..." -ForegroundColor Green
    
    # Utiliser Start-Process au lieu de Process.Start pour un meilleur contrôle
    try {
        $proc = Start-Process -FilePath $exe -ArgumentList $processArgs -PassThru -NoNewWindow:$false
        if (-not $proc) { 
            throw "Échec du lancement: Start-Process a retourné null"
        }
        
        Write-Host "Application lancée avec succès (PID: $($proc.Id))" -ForegroundColor Green
        Write-Log "Succès: Application lancée (PID: $($proc.Id))"
        
        # Attendre un peu pour voir si le processus démarre correctement
        Start-Sleep -Milliseconds 500
        if ($proc.HasExited) {
            Write-Host "ATTENTION: Le processus s'est terminé immédiatement (Code de sortie: $($proc.ExitCode))" -ForegroundColor Yellow
            Write-Log "ATTENTION: Processus terminé immédiatement (Code: $($proc.ExitCode))"
        }
    } catch {
        Write-Host "Erreur lors du lancement avec Start-Process: $_" -ForegroundColor Red
        # Essayer avec Process.Start comme fallback
        Write-Host "Tentative avec Process.Start..." -ForegroundColor Yellow
        $proc = [System.Diagnostics.Process]::Start($startInfo)
        if (-not $proc) { 
            throw "Échec du lancement: Process.Start a retourné null"
        }
        Write-Host "Application lancée avec Process.Start (PID: $($proc.Id))" -ForegroundColor Green
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


