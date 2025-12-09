# Serveur HTTP local pour lancer les applications sans protocole personnalisé
# Ce script écoute sur localhost et lance les applications via PowerShell

param(
    [int]$Port = 8765
)

$ErrorActionPreference = 'Stop'

# URL de base de l'API
$API_BASE_URL = $env:HARP_API_URL
if (-not $API_BASE_URL) {
    $API_BASE_URL = "http://portails.orange-harp.fr:9052"
}

# Charger la configuration
$configPath = Join-Path $PSScriptRoot "launcher-config.json"
$config = @{
    apiUrl = $API_BASE_URL
    logLevel = "info"
}
if (Test-Path $configPath) {
    try {
        $fileConfig = Get-Content $configPath -Raw | ConvertFrom-Json
        if ($fileConfig.apiUrl) { $config.apiUrl = $fileConfig.apiUrl }
    } catch {
        Write-Host "Erreur lors du chargement de la configuration: $_" -ForegroundColor Yellow
    }
}

# Importer les fonctions du launcher principal
$launcherScript = Join-Path $PSScriptRoot "launcher.ps1"
if (-not (Test-Path $launcherScript)) {
    Write-Host "ERREUR: Le script launcher.ps1 est introuvable" -ForegroundColor Red
    exit 1
}

# Créer un listener HTTP simple
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
$listener.Start()

Write-Host "=== Serveur Launcher HARP ===" -ForegroundColor Green
Write-Host "Serveur démarré sur http://localhost:$Port" -ForegroundColor Cyan
Write-Host "Appuyez sur Ctrl+C pour arrêter le serveur`n" -ForegroundColor Yellow

try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response
        
        $url = $request.Url
        $path = $url.AbsolutePath
        $query = $url.Query
        
        Write-Host "[$(Get-Date -Format 'HH:mm:ss')] Requête: $($request.HttpMethod) $path$query" -ForegroundColor Gray
        
        # Fonction helper pour envoyer une réponse JSON avec CORS
        function Send-JsonResponse {
            param(
                [int]$StatusCode,
                [object]$Data
            )
            $response.StatusCode = $StatusCode
            $response.ContentType = "application/json; charset=utf-8"
            
            # Ajouter les headers CORS pour permettre les requêtes depuis le navigateur
            $response.Headers.Add("Access-Control-Allow-Origin", "*")
            $response.Headers.Add("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
            $response.Headers.Add("Access-Control-Allow-Headers", "Content-Type")
            
            $jsonResponse = $Data | ConvertTo-Json -Compress
            $buffer = [System.Text.Encoding]::UTF8.GetBytes($jsonResponse)
            $response.ContentLength64 = $buffer.Length
            $response.OutputStream.Write($buffer, 0, $buffer.Length)
            $response.Close()
        }
        
        # Gérer les requêtes OPTIONS (preflight CORS)
        if ($request.HttpMethod -eq "OPTIONS") {
            $response.StatusCode = 200
            $response.Headers.Add("Access-Control-Allow-Origin", "*")
            $response.Headers.Add("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
            $response.Headers.Add("Access-Control-Allow-Headers", "Content-Type")
            $response.Close()
            continue
        }
        
        # Route pour lancer une application
        if ($path -eq "/launch" -and $request.HttpMethod -eq "GET") {
            $tool = $request.QueryString["tool"]
            $hostParam = $request.QueryString["host"]
            $user = $request.QueryString["user"]
            $portParam = $request.QueryString["port"]
            $sshkey = $request.QueryString["sshkey"]
            
            if ($tool) {
                # Construire l'URL mylaunch://
                $mylaunchUrl = "mylaunch://$tool"
                $params = @()
                if ($hostParam) { $params += "host=$hostParam" }
                if ($user) { $params += "user=$user" }
                if ($portParam) { $params += "port=$portParam" }
                if ($sshkey) { $params += "sshkey=$sshkey" }
                if ($params.Count -gt 0) {
                    $mylaunchUrl += "?" + ($params -join "&")
                }
                
                # Lancer le launcher PowerShell directement
                try {
                    $launcherProcess = Start-Process -FilePath "powershell.exe" `
                        -ArgumentList "-ExecutionPolicy", "Bypass", "-WindowStyle", "Normal", "-File", "`"$launcherScript`"", "`"$mylaunchUrl`"" `
                        -PassThru `
                        -NoNewWindow
                    
                    Send-JsonResponse -StatusCode 200 -Data @{
                        success = $true
                        message = "Application lancée"
                        tool = $tool
                        pid = $launcherProcess.Id
                    }
                    
                    Write-Host "  [OK] Application lancée: $tool (PID: $($launcherProcess.Id))" -ForegroundColor Green
                } catch {
                    Send-JsonResponse -StatusCode 500 -Data @{
                        success = $false
                        error = $_.Exception.Message
                    }
                    
                    Write-Host "  [ERREUR] $($_.Exception.Message)" -ForegroundColor Red
                }
            } else {
                Send-JsonResponse -StatusCode 400 -Data @{
                    success = $false
                    error = "Paramètre 'tool' requis"
                }
            }
        }
        # Route pour vérifier que le serveur fonctionne
        elseif ($path -eq "/health" -or $path -eq "/") {
            Send-JsonResponse -StatusCode 200 -Data @{
                status = "ok"
                service = "HARP Launcher Server"
                port = $Port
                apiUrl = $config.apiUrl
            }
        }
        else {
            $response.StatusCode = 404
            $response.Close()
        }
    }
} catch {
    Write-Host "`nErreur du serveur: $_" -ForegroundColor Red
} finally {
    $listener.Stop()
    Write-Host "`nServeur arrêté" -ForegroundColor Yellow
}

