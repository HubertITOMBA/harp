# Serveur HTTP local pour lancer les applications sans protocole personnalisé
# Port PAR UTILISATEUR (Citrix multi-sessions) : 8800-8999, plus de conflit sur 8765

param(
    # 0 = port automatique base sur le nom d'utilisateur Windows
    [int]$Port = 0
)

$ErrorActionPreference = 'Stop'

try { chcp 65001 | Out-Null } catch {}
try { [Console]::OutputEncoding = [System.Text.Encoding]::UTF8 } catch {}
try { $OutputEncoding = [System.Text.Encoding]::UTF8 } catch {}

function Get-HarpUserName {
    try {
        $n = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name
        if ($n -match '\\') { return $n.Split('\')[-1] }
        if ($n) { return $n }
    } catch {}
    if ($env:USERNAME) { return $env:USERNAME }
    return "default"
}

# Port dedie par utilisateur (doit rester identique a lib/mylaunch.ts getLauncherPortForUser)
# Plage: 8800-8999
function Get-HarpUserLauncherPort([string]$UserName) {
    if ([string]::IsNullOrWhiteSpace($UserName)) { $UserName = "default" }
    $name = $UserName.Trim().ToLowerInvariant()
    if ($name -match '\\') { $name = $name.Split('\')[-1] }
    $sum = 0
    foreach ($ch in $name.ToCharArray()) {
        $sum += [int][char]$ch
    }
    return 8800 + ($sum % 200)
}

function Write-ServerBootLog([string]$message) {
    $stamp = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss.fff")
    $line = "[$stamp] SERVER $message"
    foreach ($logFile in @(
        $(if (Test-Path "W:\") { "W:\portal\HARP\launcher\logs\server.log" } else { $null }),
        $(if ($PSScriptRoot) { Join-Path $PSScriptRoot "logs\server.log" } else { $null }),
        (Join-Path $env:TEMP "harp-launcher-server.log")
    )) {
        if (-not $logFile) { continue }
        try {
            $d = Split-Path $logFile -Parent
            if (-not (Test-Path $d)) { New-Item -ItemType Directory -Path $d -Force | Out-Null }
            Add-Content -Path $logFile -Value $line -Encoding UTF8
        } catch {}
    }
    try { Write-Host $line -ForegroundColor Cyan } catch {}
}

function Save-LauncherPort([int]$ChosenPort, [string]$UserName) {
    $content = @"
port=$ChosenPort
user=$UserName
pid=$PID
updated=$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
"@
    foreach ($file in @(
        $(if (Test-Path "W:\") { "W:\portal\HARP\launcher\launcher.port" } else { $null }),
        $(if ($PSScriptRoot) { Join-Path $PSScriptRoot "launcher.port" } else { $null }),
        (Join-Path $env:TEMP "harp-launcher.port")
    )) {
        if (-not $file) { continue }
        try {
            $d = Split-Path $file -Parent
            if (-not (Test-Path $d)) { New-Item -ItemType Directory -Path $d -Force | Out-Null }
            Set-Content -Path $file -Value $content -Encoding ASCII
        } catch {}
    }
}

$userName = Get-HarpUserName
if ($Port -le 0) {
    if ($env:HARP_LAUNCHER_PORT -and [int]::TryParse($env:HARP_LAUNCHER_PORT, [ref]$null)) {
        $Port = [int]$env:HARP_LAUNCHER_PORT
    } else {
        $Port = Get-HarpUserLauncherPort -UserName $userName
    }
}

Write-ServerBootLog "demarrage PSScriptRoot=$PSScriptRoot PortPreferentiel=$Port User=$userName TEMP=$env:TEMP"

$API_BASE_URL = $env:HARP_API_URL
if (-not $API_BASE_URL) {
    $API_BASE_URL = "http://localhost:9352"
}

$configPath = Join-Path $PSScriptRoot "launcher-config.json"
$config = @{
    apiUrl = $API_BASE_URL
    logLevel = "info"
}
# Ne plus forcer serverPort global (8765) : en Citrix chaque user a son port
if (Test-Path $configPath) {
    try {
        $fileConfig = Get-Content $configPath -Raw | ConvertFrom-Json
        if ($fileConfig.apiUrl) { $config.apiUrl = $fileConfig.apiUrl }
    } catch {
        Write-ServerBootLog "config warning: $_"
    }
}

$launcherScript = Join-Path $PSScriptRoot "launcher.ps1"
if (-not (Test-Path $launcherScript)) {
    # Si lance depuis W:\ sans launcher.ps1, tenter D:\apps\portail|portal
    foreach ($alt in @("D:\apps\portail\launcher\launcher.ps1", "D:\apps\portal\launcher\launcher.ps1")) {
        if (Test-Path $alt) { $launcherScript = $alt; break }
    }
}
if (-not (Test-Path $launcherScript)) {
    Write-ServerBootLog "FATAL launcher.ps1 introuvable"
    Write-Host "ERREUR: launcher.ps1 introuvable" -ForegroundColor Red
    Start-Sleep -Seconds 8
    exit 1
}

# Essayer le port preferentiel puis +1..+30 en cas de conflit Citrix
$listener = $null
$boundPort = $null
$lastError = $null
for ($offset = 0; $offset -le 30; $offset++) {
    $tryPort = $Port + $offset
    if ($tryPort -gt 8999) { $tryPort = 8800 + (($tryPort - 8800) % 200) }
    try {
        $candidate = New-Object System.Net.HttpListener
        $prefix = "http://127.0.0.1:$tryPort/"
        $candidate.Prefixes.Add($prefix)
        # Aussi localhost pour compat navigateur
        try { $candidate.Prefixes.Add("http://localhost:$tryPort/") } catch {}
        $candidate.Start()
        $listener = $candidate
        $boundPort = $tryPort
        Write-ServerBootLog "OK ecoute sur http://127.0.0.1:$boundPort/ et localhost apiUrl=$($config.apiUrl)"
        break
    } catch {
        $lastError = $_.Exception.Message
        Write-ServerBootLog "port $tryPort indisponible: $lastError"
        try { if ($candidate) { $candidate.Abort() } } catch {}
    }
}

if (-not $listener -or -not $boundPort) {
    Write-ServerBootLog "FATAL aucun port libre proche de $Port : $lastError"
    Write-Host "ERREUR: impossible d'ouvrir un port launcher (conflit Citrix)." -ForegroundColor Red
    Start-Sleep -Seconds 12
    exit 1
}

$Port = $boundPort
Save-LauncherPort -ChosenPort $Port -UserName $userName

Write-Host "=== Serveur Launcher HARP ===" -ForegroundColor Green
Write-Host "Utilisateur: $userName" -ForegroundColor Cyan
Write-Host "Serveur demarre sur http://localhost:$Port" -ForegroundColor Cyan
Write-Host "Fichier port: W:\portal\HARP\launcher\launcher.port" -ForegroundColor Gray
Write-Host "Appuyez sur Ctrl+C pour arreter le serveur`n" -ForegroundColor Yellow

try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response
        
        $url = $request.Url
        $path = $url.AbsolutePath
        $query = $url.Query
        
        Write-Host "[$(Get-Date -Format 'HH:mm:ss')] Requete: $($request.HttpMethod) $path$query" -ForegroundColor Gray
        
        function Send-JsonResponse {
            param(
                [int]$StatusCode,
                [object]$Data
            )
            $response.StatusCode = $StatusCode
            $response.ContentType = "application/json; charset=utf-8"
            $response.Headers.Add("Access-Control-Allow-Origin", "*")
            $response.Headers.Add("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
            $response.Headers.Add("Access-Control-Allow-Headers", "Content-Type, Access-Control-Request-Private-Network")
            try { $response.Headers.Add("Access-Control-Allow-Private-Network", "true") } catch {}
            $jsonResponse = $Data | ConvertTo-Json -Compress
            $buffer = [System.Text.Encoding]::UTF8.GetBytes($jsonResponse)
            $response.ContentLength64 = $buffer.Length
            $response.OutputStream.Write($buffer, 0, $buffer.Length)
            $response.Close()
        }

        function Send-HtmlResponse {
            param(
                [int]$StatusCode,
                [string]$Html
            )
            $response.StatusCode = $StatusCode
            $response.ContentType = "text/html; charset=utf-8"
            $response.Headers.Add("Access-Control-Allow-Origin", "*")
            try { $response.Headers.Add("Access-Control-Allow-Private-Network", "true") } catch {}
            $buffer = [System.Text.Encoding]::UTF8.GetBytes($Html)
            $response.ContentLength64 = $buffer.Length
            $response.OutputStream.Write($buffer, 0, $buffer.Length)
            $response.Close()
        }
        
        if ($request.HttpMethod -eq "OPTIONS") {
            $response.StatusCode = 204
            $response.Headers.Add("Access-Control-Allow-Origin", "*")
            $response.Headers.Add("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
            $response.Headers.Add("Access-Control-Allow-Headers", "Content-Type, Access-Control-Request-Private-Network")
            try { $response.Headers.Add("Access-Control-Allow-Private-Network", "true") } catch {}
            $response.Close()
            continue
        }

        if ($path -eq "/health" -or $path -eq "/") {
            try {
                $stampH = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss.fff")
                $lineH = "[$stampH] /health port=$Port user=$userName from=$($request.RemoteEndPoint)"
                foreach ($logFile in @(
                    $(if (Test-Path "W:\") { "W:\portal\HARP\launcher\logs\server.log" } else { $null }),
                    (Join-Path $PSScriptRoot "logs\server.log"),
                    (Join-Path $env:TEMP "harp-launcher-server.log")
                )) {
                    if (-not $logFile) { continue }
                    try {
                        $d = Split-Path $logFile -Parent
                        if (-not (Test-Path $d)) { New-Item -ItemType Directory -Path $d -Force | Out-Null }
                        Add-Content -Path $logFile -Value $lineH -Encoding UTF8
                    } catch {}
                }
            } catch {}
        }
        
        if ($path -eq "/launch" -and $request.HttpMethod -eq "GET") {
            $tool = $request.QueryString["tool"]
            $hostParam = $request.QueryString["host"]
            $user = $request.QueryString["user"]
            $portParam = $request.QueryString["port"]
            $sshkey = $request.QueryString["sshkey"]
            $urlParam = $request.QueryString["url"]
            $browserParam = $request.QueryString["browser"]
            $aliasql = $request.QueryString["aliasql"]
            $ptversion = $request.QueryString["ptversion"]
            $envId = $request.QueryString["envId"]
            $ip = $request.QueryString["ip"]
            $format = $request.QueryString["format"]
            
            if ($tool) {
                $mylaunchUrl = "mylaunch://$tool"
                $params = @()
                if ($hostParam) { $params += "host=$([System.Uri]::EscapeDataString($hostParam))" }
                if ($user) { $params += "user=$([System.Uri]::EscapeDataString($user))" }
                if ($portParam) { $params += "port=$portParam" }
                if ($sshkey) { $params += "sshkey=$([System.Uri]::EscapeDataString($sshkey))" }
                if ($urlParam) { $params += "url=$([System.Uri]::EscapeDataString($urlParam))" }
                if ($browserParam) { $params += "browser=$([System.Uri]::EscapeDataString($browserParam))" }
                if ($aliasql) { $params += "aliasql=$([System.Uri]::EscapeDataString($aliasql))" }
                if ($ptversion) { $params += "ptversion=$([System.Uri]::EscapeDataString($ptversion))" }
                if ($envId) { $params += "envId=$([System.Uri]::EscapeDataString($envId))" }
                if ($ip) { $params += "ip=$([System.Uri]::EscapeDataString($ip))" }
                if ($params.Count -gt 0) {
                    $mylaunchUrl += "?" + ($params -join "&")
                }
                
                try {
                    Write-Host "  URL: $mylaunchUrl" -ForegroundColor Gray
                    Write-Host "  Script: $launcherScript" -ForegroundColor Gray

                    $stamp0 = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss.fff")
                    $preLine = "[$stamp0] /launch REQUEST user=$userName port=$Port tool=$tool url=$mylaunchUrl"
                    foreach ($logFile in @(
                        $(if (Test-Path "W:\") { "W:\portal\HARP\launcher\logs\server.log" } else { $null }),
                        (Join-Path $PSScriptRoot "logs\server.log"),
                        (Join-Path $env:TEMP "harp-launcher-server.log")
                    )) {
                        if (-not $logFile) { continue }
                        try {
                            $d = Split-Path $logFile -Parent
                            if (-not (Test-Path $d)) { New-Item -ItemType Directory -Path $d -Force | Out-Null }
                            Add-Content -Path $logFile -Value $preLine -Encoding UTF8
                        } catch {}
                    }

                    if (-not (Test-Path -LiteralPath $launcherScript)) {
                        throw "launcher.ps1 introuvable: $launcherScript"
                    }

                    $urlB64 = [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($mylaunchUrl))
                    $workDir = Split-Path $launcherScript -Parent
                    $argList = @(
                        "-ExecutionPolicy", "Bypass",
                        "-NoProfile",
                        "-WindowStyle", "Normal",
                        "-File", $launcherScript,
                        "-UrlBase64", $urlB64
                    )
                    $launcherProcess = Start-Process -FilePath "powershell.exe" `
                        -ArgumentList $argList `
                        -PassThru `
                        -WorkingDirectory $workDir

                    $stamp1 = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss.fff")
                    $postLine = "[$stamp1] /launch STARTED tool=$tool pid=$($launcherProcess.Id)"
                    foreach ($logFile in @(
                        $(if (Test-Path "W:\") { "W:\portal\HARP\launcher\logs\server.log" } else { $null }),
                        (Join-Path $PSScriptRoot "logs\server.log"),
                        (Join-Path $env:TEMP "harp-launcher-server.log")
                    )) {
                        if (-not $logFile) { continue }
                        try {
                            $d = Split-Path $logFile -Parent
                            if (-not (Test-Path $d)) { New-Item -ItemType Directory -Path $d -Force | Out-Null }
                            Add-Content -Path $logFile -Value $postLine -Encoding UTF8
                        } catch {}
                    }

                    if ($format -eq "html") {
                        Send-HtmlResponse -StatusCode 200 -Html "<!doctype html><html><body style='font-family:sans-serif;padding:12px'>HARP: $tool lance (PID $($launcherProcess.Id)) sur port $Port.<script>setTimeout(function(){try{window.close()}catch(e){}},800)</script></body></html>"
                    } else {
                        Send-JsonResponse -StatusCode 200 -Data @{
                            success = $true
                            message = "Application lancee"
                            tool = $tool
                            pid = $launcherProcess.Id
                            port = $Port
                            user = $userName
                            logHint = "W:\portal\HARP\launcher\logs\launcher.log"
                            tempLog = (Join-Path $env:TEMP "harp-launcher.log")
                        }
                    }
                    
                    Write-Host "  [OK] $tool PID=$($launcherProcess.Id)" -ForegroundColor Green
                } catch {
                    if ($format -eq "html") {
                        Send-HtmlResponse -StatusCode 500 -Html "<!doctype html><html><body>Erreur: $([System.Net.WebUtility]::HtmlEncode($_.Exception.Message))</body></html>"
                    } else {
                        Send-JsonResponse -StatusCode 500 -Data @{
                            success = $false
                            error = $_.Exception.Message
                        }
                    }
                    Write-Host "  [ERREUR] $($_.Exception.Message)" -ForegroundColor Red
                }
            } else {
                Send-JsonResponse -StatusCode 400 -Data @{
                    success = $false
                    error = "Parametre 'tool' requis"
                }
            }
        }
        elseif ($path -eq "/health" -or $path -eq "/") {
            Send-JsonResponse -StatusCode 200 -Data @{
                status = "ok"
                service = "HARP Launcher Server"
                port = $Port
                user = $userName
                apiUrl = $config.apiUrl
            }
        }
        else {
            $response.StatusCode = 404
            $response.Close()
        }
    }
} catch {
    Write-ServerBootLog "ERREUR boucle serveur: $_"
    Write-Host "`nErreur du serveur: $_" -ForegroundColor Red
} finally {
    try {
        if ($null -ne $listener -and $listener.IsListening) { $listener.Stop() }
    } catch {}
    Write-ServerBootLog "serveur arrete port=$Port"
    Write-Host "`nServeur arrete" -ForegroundColor Yellow
}
