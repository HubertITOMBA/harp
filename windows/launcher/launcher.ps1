#Requires -Version 5.1
param(
    [Parameter(Mandatory = $true, Position = 0)]
    [string]$Url
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# Charger la configuration depuis un fichier JSON
# PRIORITÉ: répertoire du script (ex. D:\apps\portal\launcher) > W:\portal > LOCALAPPDATA
function Get-LauncherConfig {
    # PRIORITÉ 1: Répertoire du script (ex. D:\apps\portal\launcher en production)
    if ($PSScriptRoot -and (Test-Path (Join-Path $PSScriptRoot "launcher-config.json"))) {
        $configPath = Join-Path $PSScriptRoot "launcher-config.json"
        try {
            $config = Get-Content $configPath -Raw | ConvertFrom-Json
            return $config
        } catch {
            Write-Host "Erreur lors du chargement de la configuration depuis $PSScriptRoot : $_" -ForegroundColor Yellow
        }
    }
    
    # PRIORITÉ 2: Chercher dans W:\portal\HARP\launcher
    $configPath = "W:\portal\HARP\launcher\launcher-config.json"
    # Si le fichier de config existe dans W:\portal, le charger
    if (Test-Path $configPath) {
        try {
            $config = Get-Content $configPath -Raw | ConvertFrom-Json
            return $config
        } catch {
            Write-Host "Erreur lors du chargement de la configuration depuis W:\portal: $_" -ForegroundColor Yellow
        }
    }
    
    # PRIORITÉ 3: Si pas trouvé dans W:\portal, chercher dans LOCALAPPDATA
    $configPath = Join-Path $env:LOCALAPPDATA "HARP\launcher\launcher-config.json"
    if (Test-Path $configPath) {
        try {
            $config = Get-Content $configPath -Raw | ConvertFrom-Json
            return $config
        } catch {
            Write-Host "Erreur lors du chargement de la configuration depuis LOCALAPPDATA: $_" -ForegroundColor Yellow
        }
    }
    
    # Retourner une configuration par défaut
    return @{
        apiUrl = "http://localhost:9352"
        logLevel = "info"
        keepWindowOpenOnError = $true
        keepWindowOpenOnSuccess = $false
        windowCloseDelay = 2
    }
}

$config = Get-LauncherConfig

# URL de base de l'API (priorité : variable d'environnement > fichier config > défaut)
$API_BASE_URL = $env:HARP_API_URL
if (-not $API_BASE_URL) {
    $API_BASE_URL = $config.apiUrl
}
if (-not $API_BASE_URL) {
    # Valeur par défaut pour la production (HTTP en mode test)
    $API_BASE_URL = "http://localhost:9352"
}

function Write-Log($message) {
    try {
        # PRIORITÉ: Utiliser le répertoire du script, sinon W:\portal, sinon LOCALAPPDATA
        $logDir = $null
        
        # Si le script est dans un répertoire accessible, utiliser ce répertoire
        if ($PSScriptRoot -and (Test-Path $PSScriptRoot)) {
            $logDir = Join-Path $PSScriptRoot 'logs'
        }
        
        # Sinon, essayer W:\portal\HARP\launcher\logs
        if (-not $logDir -or -not (Test-Path (Split-Path $logDir -Parent))) {
            $wPortalLogDir = "W:\portal\HARP\launcher\logs"
            if (Test-Path "W:\portal") {
                $logDir = $wPortalLogDir
            }
        }
        
        # En dernier recours, utiliser LOCALAPPDATA
        if (-not $logDir) {
            $logDir = Join-Path $env:LOCALAPPDATA "HARP\launcher\logs"
        }
        
        if (-not (Test-Path $logDir)) { 
            New-Item -ItemType Directory -Path $logDir -Force | Out-Null 
        }
        $stamp = (Get-Date).ToString('yyyy-MM-dd HH:mm:ss.fff')
        $logMessage = "[$stamp] $message"
        $logFile = Join-Path $logDir 'launcher.log'
        Add-Content -Path $logFile -Value $logMessage -ErrorAction SilentlyContinue
        Write-Host $logMessage -ForegroundColor Cyan
    } catch {
        # Si l'écriture du log échoue (dossier en lecture seule), afficher seulement dans la console
        Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss.fff')] $message" -ForegroundColor Cyan
    }
}

function Show-Error($message) {
    Write-Host "`n========================================" -ForegroundColor Red
    Write-Host "ERREUR: $message" -ForegroundColor Red
    Write-Host "========================================`n" -ForegroundColor Red
    Write-Log "ERREUR: $message"
}

function Get-UserNetId {
    # Essayer de récupérer le netid depuis l'environnement Windows
    # Format: DOMAIN\username ou username
    $currentUser = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name
    if ($currentUser -match '\\') {
        $netid = $currentUser.Split('\')[-1]
    } else {
        $netid = $currentUser
    }
    return $netid
}

function Get-ToolInfoFromAPI($tool, $netid) {
    $maxRetries = 3
    $retryDelay = 2 # secondes
    
    # Configuration TLS : Essayer TLS 1.2 d'abord (plus compatible)
    # TLS 1.3 peut causer des problèmes avec certains serveurs/proxies
    try {
        [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
        Write-Host "TLS 1.2 activé" -ForegroundColor Gray
    } catch {
        Write-Host "Impossible de configurer TLS 1.2, utilisation de la configuration par défaut" -ForegroundColor Yellow
    }
    
    # Désactiver la vérification SSL si nécessaire (pour les certificats auto-signés)
    # Utiliser une classe C# avec une méthode d'instance qui retourne un délégué
    if (-not ([System.Management.Automation.PSTypeName]'TrustAllCertsPolicy').Type) {
        Add-Type @"
            using System.Net;
            using System.Security.Cryptography.X509Certificates;
            public class TrustAllCertsPolicy : ICertificatePolicy {
                public bool CheckValidationResult(
                    ServicePoint srvPoint, X509Certificate certificate,
                    WebRequest request, int certificateProblem) {
                    return true;
                }
            }
"@
    }
    [System.Net.ServicePointManager]::CertificatePolicy = New-Object TrustAllCertsPolicy
    
    # Désactiver la vérification de certificat SSL avec une classe C# qui crée le délégué correctement
    # Utiliser une méthode d'instance au lieu d'une méthode statique pour éviter les problèmes de conversion
    if (-not ([System.Management.Automation.PSTypeName]'TrustAllCertsPolicyCallback').Type) {
        Add-Type @"
            using System.Net.Security;
            using System.Security.Cryptography.X509Certificates;
            public class TrustAllCertsPolicyCallback {
                public bool ValidateCertificate(object sender, X509Certificate certificate, X509Chain chain, SslPolicyErrors sslPolicyErrors) {
                    return true;
                }
            }
"@
    }
    
    # Créer une instance et utiliser sa méthode comme délégué
    try {
        $callbackInstance = New-Object TrustAllCertsPolicyCallback
        $delegateType = [System.Net.Security.RemoteCertificateValidationCallback]
        $delegate = [System.Delegate]::CreateDelegate($delegateType, $callbackInstance, 'ValidateCertificate')
        [System.Net.ServicePointManager]::ServerCertificateValidationCallback = $delegate
    } catch {
        # Si la création du délégué échoue, ignorer silencieusement (certains environnements peuvent avoir des restrictions)
        Write-Host "Avertissement: Impossible de configurer la validation SSL - $($_.Exception.Message)" -ForegroundColor Yellow
        Write-Log "Avertissement: Validation SSL non configurée - $($_.Exception.Message)"
    }
    
    # Construire l'URL de l'API avec les paramètres de base
    $apiUrl = "$API_BASE_URL/api/launcher/tool?tool=$tool&netid=$netid"
    
    # Ajouter les paramètres optionnels depuis l'URL mylaunch://
    $apiParams = @()
    if ($query.ContainsKey('ptversion')) {
        $apiParams += "ptversion=$([System.Uri]::EscapeDataString($query.ptversion))"
    }
    if ($query.ContainsKey('aliasql')) {
        $apiParams += "aliasql=$([System.Uri]::EscapeDataString($query.aliasql))"
    }
    if ($query.ContainsKey('envId')) {
        $apiParams += "envId=$([System.Uri]::EscapeDataString($query.envId))"
    }
    if ($query.ContainsKey('ip')) {
        $apiParams += "ip=$([System.Uri]::EscapeDataString($query.ip))"
    }
    
    if ($apiParams.Count -gt 0) {
        $apiUrl += "&" + ($apiParams -join "&")
    }
    
    Write-Host "Appel API: $apiUrl" -ForegroundColor Cyan
    Write-Log "Appel API: $apiUrl"
    
    # Vérifier si un proxy est configuré
    $proxyUrl = $env:HTTP_PROXY
    if (-not $proxyUrl) {
        $proxyUrl = $env:HTTPS_PROXY
    }
    if ($proxyUrl) {
        Write-Host "Proxy détecté: $proxyUrl" -ForegroundColor Gray
        Write-Log "Proxy détecté: $proxyUrl"
    }
    
    # Configuration de la requête avec timeout et retry
    for ($attempt = 1; $attempt -le $maxRetries; $attempt++) {
        try {
            Write-Host "Tentative $attempt/$maxRetries..." -ForegroundColor Gray
            
            # Utiliser Invoke-RestMethod qui gère mieux TLS/SSL que HttpWebRequest
            $params = @{
                Uri = $apiUrl
                Method = 'Get'
                TimeoutSec = 30
                ErrorAction = 'Stop'
                UseBasicParsing = $true
            }
            
            # Configurer le proxy si disponible
            if ($proxyUrl) {
                try {
                    $proxy = New-Object System.Net.WebProxy($proxyUrl)
                    $params['Proxy'] = $proxy
                    Write-Host "Utilisation du proxy: $proxyUrl" -ForegroundColor Gray
                } catch {
                    Write-Host "Impossible de configurer le proxy, continuation sans proxy" -ForegroundColor Yellow
                }
            }
            
            # Ajouter des headers pour améliorer la compatibilité
            $headers = @{
                'User-Agent' = 'HARP-Launcher/1.0'
                'Accept' = 'application/json'
            }
            $params['Headers'] = $headers
            
            $response = Invoke-RestMethod @params
            
            Write-Host "Réponse API reçue avec succès" -ForegroundColor Green
            Write-Log "Réponse API: $($response | ConvertTo-Json -Compress)"
            
            return $response
            
        } catch [System.Net.WebException] {
            $webException = $_.Exception
            $statusCode = "Unknown"
            $statusDescription = ""
            
            if ($webException.Response) {
                $statusCode = [int]$webException.Response.StatusCode
                $statusDescription = $webException.Response.StatusDescription
            }
            
            $errorDetails = "Erreur HTTP: $statusCode $statusDescription - $($webException.Message)"
            
            if ($attempt -lt $maxRetries) {
                Write-Host "Échec de la tentative $attempt. Nouvelle tentative dans $retryDelay secondes..." -ForegroundColor Yellow
                Write-Log "Tentative $attempt échouée: $errorDetails"
                Start-Sleep -Seconds $retryDelay
            } else {
                $errorMsg = "Erreur lors de l'appel API après $maxRetries tentatives: $errorDetails"
                if ($webException.InnerException) {
                    $errorMsg += "`nErreur interne: $($webException.InnerException.Message)"
                }
                Write-Log $errorMsg
                throw $errorMsg
            }
        } catch {
            $errorMsg = "Erreur lors de l'appel API: $($_.Exception.Message)"
            if ($_.Exception.InnerException) {
                $errorMsg += "`nErreur interne: $($_.Exception.InnerException.Message)"
            }
            
            if ($attempt -lt $maxRetries) {
                Write-Host "Échec de la tentative $attempt. Nouvelle tentative dans $retryDelay secondes..." -ForegroundColor Yellow
                Write-Log "Tentative $attempt échouée: $errorMsg"
                Start-Sleep -Seconds $retryDelay
            } else {
                Write-Log $errorMsg
                throw $errorMsg
            }
        }
    }
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

    # Récupérer le netid (depuis l'URL ou l'environnement Windows)
    $netid = $query['netid']
    if (-not $netid -or [string]::IsNullOrWhiteSpace($netid)) {
        $netid = Get-UserNetId
        Write-Host "NetID récupéré depuis l'environnement Windows: $netid" -ForegroundColor Yellow
    } else {
        Write-Host "NetID depuis l'URL: $netid" -ForegroundColor Yellow
    }

    # Cas spécial: ouvrir une URL dans le navigateur avec port 6000 autorisé (évite ERR_UNSAFE_PORT)
    # Le paramètre 'browser' (chrome, msedge, firefox) est envoyé par le portail pour lancer le même navigateur que l'utilisateur utilise
    if ($tool -eq 'openurl') {
        $targetUrl = $query['url']
        if (-not $targetUrl -or [string]::IsNullOrWhiteSpace($targetUrl)) {
            throw "Le parametre 'url' est requis pour openurl"
        }
        $preferredBrowser = $query['browser']  # chrome | msedge | firefox (détecté côté portail)
        Write-Host "Ouverture de l'URL dans le navigateur (port 6000 autorise)..." -ForegroundColor Cyan
        if ($preferredBrowser) {
            Write-Host "Navigateur demande par le portail: $preferredBrowser" -ForegroundColor Gray
        }
        $chromePaths = @(
            "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
            "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe"
        )
        $edgePaths = @(
            "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe",
            "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe"
        )
        $firefoxPaths = @(
            "$env:ProgramFiles\Mozilla Firefox\firefox.exe",
            "${env:ProgramFiles(x86)}\Mozilla Firefox\firefox.exe"
        )
        $browserExe = $null
        $usePortArg = $true   # --explicitly-allowed-ports=6000 pour Chromium (Chrome/Edge)
        $isFirefox = $false
        if ($preferredBrowser -eq 'chrome') {
            foreach ($p in $chromePaths) { if (Test-Path -LiteralPath $p) { $browserExe = $p; break } }
        } elseif ($preferredBrowser -eq 'msedge') {
            foreach ($p in $edgePaths) { if (Test-Path -LiteralPath $p) { $browserExe = $p; break } }
        } elseif ($preferredBrowser -eq 'firefox') {
            foreach ($p in $firefoxPaths) { if (Test-Path -LiteralPath $p) { $browserExe = $p; $usePortArg = $false; $isFirefox = $true; break } }
        }
        if (-not $browserExe) {
            foreach ($p in $chromePaths) { if (Test-Path -LiteralPath $p) { $browserExe = $p; break } }
        }
        if (-not $browserExe) {
            foreach ($p in $edgePaths) { if (Test-Path -LiteralPath $p) { $browserExe = $p; break } }
        }
        if (-not $browserExe) {
            foreach ($p in $firefoxPaths) { if (Test-Path -LiteralPath $p) { $browserExe = $p; $usePortArg = $false; $isFirefox = $true; break } }
        }
        if (-not $browserExe) {
            throw "Aucun navigateur (Chrome, Edge, Firefox) n'a ete trouve. Installez l'un d'entre eux."
        }
        # Firefox : profil dédié avec port 6000 autorisé (network.security.ports.banned.override)
        $firefoxProfilePath = $null
        if ($isFirefox) {
            $firefoxProfilePath = Join-Path $env:LOCALAPPDATA "HARP\firefox-port6000-profile"
            if (-not (Test-Path $firefoxProfilePath)) {
                New-Item -ItemType Directory -Path $firefoxProfilePath -Force | Out-Null
            }
            $userJsPath = Join-Path $firefoxProfilePath "user.js"
            $userJsContent = "user_pref(""network.security.ports.banned.override"", ""6000"");"
            if (-not (Test-Path $userJsPath) -or (Get-Content $userJsPath -Raw) -ne $userJsContent) {
                Set-Content -Path $userJsPath -Value $userJsContent -Encoding UTF8
            }
        }
        if ($usePortArg) {
            $portArg = "--explicitly-allowed-ports=6000"
            Write-Log "Lancement navigateur: $browserExe $portArg $targetUrl"
            Start-Process -FilePath $browserExe -ArgumentList $portArg, $targetUrl
        } elseif ($firefoxProfilePath) {
            Write-Log "Lancement Firefox (profil port 6000): $browserExe -profile `"$firefoxProfilePath`" $targetUrl"
            Start-Process -FilePath $browserExe -ArgumentList "-profile", $firefoxProfilePath, $targetUrl
        } else {
            Write-Log "Lancement navigateur: $browserExe $targetUrl"
            Start-Process -FilePath $browserExe -ArgumentList $targetUrl
        }
        Write-Host "Navigateur lance avec l'URL (port 6000 autorise)" -ForegroundColor Green
        Write-Log "Succes: URL ouverte dans le navigateur"
        if (-not $config.keepWindowOpenOnSuccess) {
            $delay = if ($config.windowCloseDelay) { $config.windowCloseDelay } else { 2 }
            Start-Sleep -Seconds $delay
        } else {
            $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
        }
        exit 0
    }

    # Récupérer les informations de l'outil depuis l'API
    Write-Host "Récupération des informations de l'outil depuis la base de données..." -ForegroundColor Cyan
    $toolInfo = Get-ToolInfoFromAPI -tool $tool -netid $netid
    
    if (-not $toolInfo -or -not $toolInfo.success) {
        throw "Impossible de récupérer les informations de l'outil '$tool' depuis la base de données"
    }

    $exe = $toolInfo.path
    $cmdarg = $toolInfo.cmdarg
    $pkeyfile = $toolInfo.pkeyfile
    
    Write-Host "Informations récupérées:" -ForegroundColor Green
    Write-Host "  - Chemin: $exe" -ForegroundColor Gray
    Write-Host "  - Arguments par défaut: $cmdarg" -ForegroundColor Gray
    if ($pkeyfile) {
        Write-Host "  - Clé SSH: $pkeyfile" -ForegroundColor Gray
    }
    
    if (-not (Test-Path $exe)) {
        throw "Exécutable introuvable: $exe"
    }
    Write-Host "Exécutable trouvé: OK" -ForegroundColor Green

    # Construire les arguments selon le type d'outil
    $argArray = @()
    
    # Pour PuTTY, construire les arguments spécifiques
    if ($tool -eq 'putty') {
        # Port doit venir en premier pour PuTTY
        if ($query.ContainsKey('port')) { 
            $argArray += '-P'
            $argArray += [string]$query.port
        }
        
        # Clé SSH (depuis la base de données ou depuis l'URL)
        $sshkey = $query['sshkey']
        if (-not $sshkey -and $pkeyfile) {
            $sshkey = $pkeyfile
        }
        if ($sshkey) { 
            $argArray += '-i'
            $argArray += [string]$sshkey
        }
        
        # Host en dernier (avec user si fourni) - REQUIS pour PuTTY
        if (-not $query.ContainsKey('host') -or [string]::IsNullOrWhiteSpace($query.host)) {
            throw "Le parametre 'host' est requis pour lancer PuTTY"
        }
        
        $hostValue = [string]$query.host
        if ($query.ContainsKey('user') -and $query.user -and -not [string]::IsNullOrWhiteSpace($query.user)) {
            $userValue = [string]$query.user
            $argArray += "${userValue}@${hostValue}"
        } else {
            $argArray += $hostValue
        }
    } else {
        # Pour les autres outils, utiliser cmdarg de la base de données si disponible
        if ($cmdarg -and $cmdarg.Trim() -ne '') {
            # Parser les arguments depuis cmdarg (format: "arg1 arg2" ou "arg1=value1 arg2=value2")
            $cmdargParts = $cmdarg.Trim().Split(' ') | Where-Object { $_ -ne '' }
            foreach ($part in $cmdargParts) {
                $argArray += $part
            }
        }
        
        # Ajouter les paramètres depuis l'URL si présents
        foreach ($key in $query.Keys) {
            if ($key -ne 'netid' -and $key -ne 'sshkey') {
                $value = $query[$key]
                if ($value -and $value.Trim() -ne '') {
                    $argArray += "${key}=${value}"
                }
            }
        }
    }
    
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
            Write-Host "`nAppuyez sur une touche pour fermer cette fenêtre..." -ForegroundColor Yellow
            $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
            exit 1
        }
    } catch {
        Write-Host "Erreur lors du lancement avec Start-Process: $_" -ForegroundColor Red
        # Essayer avec Process.Start comme fallback
        Write-Host "Tentative avec Process.Start..." -ForegroundColor Yellow
        try {
            $proc = [System.Diagnostics.Process]::Start($startInfo)
            if (-not $proc) { 
                throw "Échec du lancement: Process.Start a retourné null"
            }
            Write-Host "Application lancée avec Process.Start (PID: $($proc.Id))" -ForegroundColor Green
        } catch {
            # Si les deux méthodes échouent, relancer l'erreur pour le catch principal
            throw $_
        }
    }
    
    # En cas de succès, gérer la fermeture de la fenêtre selon la configuration
    if ($config.keepWindowOpenOnSuccess) {
        Write-Host "`nAppuyez sur une touche pour fermer cette fenêtre..." -ForegroundColor Cyan
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    } else {
        $delay = if ($config.windowCloseDelay) { $config.windowCloseDelay } else { 2 }
        Write-Host "`nFermeture de la fenêtre dans $delay secondes..." -ForegroundColor Gray
        Start-Sleep -Seconds $delay
    }
    
    # Si DEBUG est activé via variable d'environnement, garder la fenêtre ouverte
    if ($env:HARP_LAUNCHER_DEBUG -eq "1") {
        Write-Host "Mode DEBUG activé - Appuyez sur une touche pour fermer cette fenêtre..." -ForegroundColor Cyan
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
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
    
    # Gérer la fermeture de la fenêtre selon la configuration
    if ($config.keepWindowOpenOnError) {
        Write-Host "`nAppuyez sur une touche pour fermer cette fenêtre..." -ForegroundColor Yellow
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    } else {
        $delay = if ($config.windowCloseDelay) { $config.windowCloseDelay } else { 5 }
        Write-Host "`nFermeture de la fenêtre dans $delay secondes..." -ForegroundColor Yellow
        Start-Sleep -Seconds $delay
    }
    
    exit 1
}


