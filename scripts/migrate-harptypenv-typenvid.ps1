# Script PowerShell pour migrer la colonne typenvid dans harptypenv
# Usage: .\scripts\migrate-harptypenv-typenvid.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Migration harptypenv.typenvid" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Vérifier que nous sommes dans le bon répertoire
if (-not (Test-Path "prisma\schema.prisma")) {
    Write-Host "Erreur: Ce script doit être exécuté depuis la racine du projet" -ForegroundColor Red
    exit 1
}

# Charger les variables d'environnement
if (Test-Path ".env") {
    $envContent = Get-Content ".env" -Raw
    $dbUrl = ($envContent | Select-String -Pattern "DATABASE_URL=(.+)" | ForEach-Object { $_.Matches.Groups[1].Value }).Trim()
    
    if ($dbUrl) {
        # Extraire les informations de connexion depuis DATABASE_URL
        # Format: mysql://user:password@host:port/database
        if ($dbUrl -match "mysql://([^:]+):([^@]+)@([^:]+):(\d+)/(.+)") {
            $dbUser = $matches[1]
            $dbPassword = $matches[2]
            $dbHost = $matches[3]
            $dbPort = $matches[4]
            $dbName = $matches[5]
            
            Write-Host "[1/4] Connexion à la base de données..." -ForegroundColor Yellow
            Write-Host "      Host: $dbHost" -ForegroundColor Gray
            Write-Host "      Database: $dbName" -ForegroundColor Gray
            Write-Host ""
            
            # Vérifier si mysql est disponible
            $mysqlPath = Get-Command mysql -ErrorAction SilentlyContinue
            if (-not $mysqlPath) {
                Write-Host "⚠️  mysql n'est pas disponible en ligne de commande" -ForegroundColor Yellow
                Write-Host "   Veuillez exécuter manuellement le script SQL:" -ForegroundColor Yellow
                Write-Host "   scripts\migrate-harptypenv-typenvid.sql" -ForegroundColor Yellow
                Write-Host ""
                Write-Host "   Ou utilisez un client MySQL (phpMyAdmin, MySQL Workbench, etc.)" -ForegroundColor Yellow
                exit 0
            }
            
            Write-Host "[2/4] Application du script SQL..." -ForegroundColor Yellow
            $sqlScript = Get-Content "scripts\migrate-harptypenv-typenvid.sql" -Raw
            
            # Créer un fichier temporaire avec le mot de passe
            $tempFile = [System.IO.Path]::GetTempFileName()
            $sqlScript | Out-File -FilePath $tempFile -Encoding UTF8
            
            # Exécuter le script SQL
            $env:MYSQL_PWD = $dbPassword
            $result = & mysql -h $dbHost -P $dbPort -u $dbUser $dbName -e "source $tempFile" 2>&1
            
            Remove-Item $tempFile -ErrorAction SilentlyContinue
            Remove-Item Env:\MYSQL_PWD -ErrorAction SilentlyContinue
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✅ Script SQL appliqué avec succès" -ForegroundColor Green
            } else {
                Write-Host "❌ Erreur lors de l'application du script SQL" -ForegroundColor Red
                Write-Host $result -ForegroundColor Red
                exit 1
            }
        } else {
            Write-Host "⚠️  Format de DATABASE_URL non reconnu" -ForegroundColor Yellow
            Write-Host "   Veuillez exécuter manuellement le script SQL:" -ForegroundColor Yellow
            Write-Host "   scripts\migrate-harptypenv-typenvid.sql" -ForegroundColor Yellow
            exit 0
        }
    } else {
        Write-Host "⚠️  DATABASE_URL non trouvé dans .env" -ForegroundColor Yellow
        Write-Host "   Veuillez exécuter manuellement le script SQL:" -ForegroundColor Yellow
        Write-Host "   scripts\migrate-harptypenv-typenvid.sql" -ForegroundColor Yellow
        exit 0
    }
} else {
    Write-Host "⚠️  Fichier .env non trouvé" -ForegroundColor Yellow
    Write-Host "   Veuillez exécuter manuellement le script SQL:" -ForegroundColor Yellow
    Write-Host "   scripts\migrate-harptypenv-typenvid.sql" -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "[3/4] Génération du client Prisma..." -ForegroundColor Yellow
npx prisma generate
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erreur lors de la génération du client Prisma" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "[4/4] Synchronisation du schéma Prisma..." -ForegroundColor Yellow
Write-Host "      Exécution de: npx prisma db push" -ForegroundColor Gray
Write-Host ""
Write-Host "⚠️  IMPORTANT: Le schéma Prisma doit maintenant avoir typenvid comme requis" -ForegroundColor Yellow
Write-Host "   Si ce n'est pas le cas, modifiez prisma/schema.prisma et exécutez:" -ForegroundColor Yellow
Write-Host "   npx prisma db push" -ForegroundColor Yellow
Write-Host ""

