# Script PowerShell pour charger les variables d'environnement depuis .env
# Gère correctement les valeurs avec des espaces, guillemets, etc.

if (-not (Test-Path .env)) {
    Write-Host "❌ Le fichier .env n'existe pas" -ForegroundColor Red
    exit 1
}

Write-Host "📋 Chargement des variables depuis .env..." -ForegroundColor Cyan
Write-Host ""

$loadedCount = 0

# Lire le fichier .env ligne par ligne
Get-Content .env | ForEach-Object {
    $line = $_.Trim()
    
    # Ignorer les lignes vides et les commentaires
    if ([string]::IsNullOrWhiteSpace($line) -or $line.StartsWith('#')) {
        return
    }
    
    # Extraire la clé et la valeur
    if ($line -match '^([^=]+)=(.*)$') {
        $key = $matches[1].Trim()
        $value = $matches[2].Trim()
        
        # Supprimer les guillemets au début et à la fin si présents
        if ($value.StartsWith('"') -and $value.EndsWith('"')) {
            $value = $value.Substring(1, $value.Length - 2)
        }
        elseif ($value.StartsWith("'") -and $value.EndsWith("'")) {
            $value = $value.Substring(1, $value.Length - 2)
        }
        
        # Définir la variable d'environnement
        [System.Environment]::SetEnvironmentVariable($key, $value, 'Process')
        $loadedCount++
        
        # Afficher (masquer les secrets)
        $displayValue = if ($key -like '*SECRET*') {
            "***$($value.Substring([Math]::Max(0, $value.Length - 4)))"
        } else {
            if ($value.Length -gt 50) { "$($value.Substring(0, 50))..." } else { $value }
        }
        
        Write-Host "  ✅ $key=$displayValue" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "✅ $loadedCount variables chargées avec succès !" -ForegroundColor Green
Write-Host ""
Write-Host "Vérification des variables importantes :" -ForegroundColor Cyan
Write-Host "  AUTH_URL=$($env:AUTH_URL ?? 'NON DÉFINIE')"
Write-Host "  NEXT_PUBLIC_SERVER_URL=$($env:NEXT_PUBLIC_SERVER_URL ?? 'NON DÉFINIE')"
Write-Host "  AUTH_SECRET=$($(if ($env:AUTH_SECRET) { "***$($env:AUTH_SECRET.Substring([Math]::Max(0, $env:AUTH_SECRET.Length - 4)))" } else { 'NON DÉFINIE' }))"
Write-Host "  AUTH_TRUST_HOST=$($env:AUTH_TRUST_HOST ?? 'NON DÉFINIE')"

