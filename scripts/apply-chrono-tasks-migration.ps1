# Script PowerShell pour appliquer la migration des chrono-tâches
# Usage: .\scripts\apply-chrono-tasks-migration.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Migration des tables chrono-tâches" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Vérifier que nous sommes dans le bon répertoire
if (-not (Test-Path "prisma\schema.prisma")) {
    Write-Host "Erreur: Ce script doit être exécuté depuis la racine du projet" -ForegroundColor Red
    exit 1
}

# Vérifier si le fichier SQL existe
if (-not (Test-Path "scripts\create-chrono-tasks-tables.sql")) {
    Write-Host "Erreur: Le fichier scripts\create-chrono-tasks-tables.sql n'existe pas" -ForegroundColor Red
    exit 1
}

Write-Host "[1/3] Vérification de la connexion à la base de données..." -ForegroundColor Yellow
Write-Host ""

# Lire la variable d'environnement DATABASE_URL
$envFile = ".env"
if (-not (Test-Path $envFile)) {
    $envFile = ".env.local"
}

if (-not (Test-Path $envFile)) {
    Write-Host "Erreur: Fichier .env ou .env.local introuvable" -ForegroundColor Red
    Write-Host "Veuillez configurer DATABASE_URL dans votre fichier .env" -ForegroundColor Yellow
    exit 1
}

# Extraire les informations de connexion depuis DATABASE_URL
$databaseUrl = Get-Content $envFile | Select-String "DATABASE_URL" | ForEach-Object { $_.Line -replace "DATABASE_URL=", "" -replace "`"", "" }

if (-not $databaseUrl) {
    Write-Host "Erreur: DATABASE_URL non trouvé dans .env" -ForegroundColor Red
    exit 1
}

# Parser DATABASE_URL (format: mysql://user:password@host:port/database)
if ($databaseUrl -match "mysql://([^:]+):([^@]+)@([^:]+):(\d+)/(.+)") {
    $dbUser = $matches[1]
    $dbPassword = $matches[2]
    $dbHost = $matches[3]
    $dbPort = $matches[4]
    $dbName = $matches[5]
    
    Write-Host "  Base de données: $dbName" -ForegroundColor Green
    Write-Host "  Serveur: $dbHost`:$dbPort" -ForegroundColor Green
    Write-Host "  Utilisateur: $dbUser" -ForegroundColor Green
} else {
    Write-Host "Erreur: Format DATABASE_URL invalide" -ForegroundColor Red
    Write-Host "Format attendu: mysql://user:password@host:port/database" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "[2/3] Application du script SQL..." -ForegroundColor Yellow
Write-Host ""

# Option 1: Utiliser mysql directement si disponible
$mysqlPath = Get-Command mysql -ErrorAction SilentlyContinue
if ($mysqlPath) {
    Write-Host "  Utilisation de mysql en ligne de commande..." -ForegroundColor Cyan
    $sqlFile = "scripts\create-chrono-tasks-tables.sql"
    
    # Créer un fichier temporaire avec le mot de passe
    $tempSqlFile = [System.IO.Path]::GetTempFileName()
    Copy-Item $sqlFile $tempSqlFile
    
    # Exécuter mysql
    $env:MYSQL_PWD = $dbPassword
    $result = & mysql -h $dbHost -P $dbPort -u $dbUser $dbName -e "source $sqlFile" 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✅ Tables créées avec succès!" -ForegroundColor Green
    } else {
        Write-Host "  ❌ Erreur lors de l'exécution:" -ForegroundColor Red
        Write-Host $result -ForegroundColor Red
        Write-Host ""
        Write-Host "  💡 Vous pouvez exécuter manuellement:" -ForegroundColor Yellow
        Write-Host "     mysql -h $dbHost -P $dbPort -u $dbUser -p $dbName < scripts\create-chrono-tasks-tables.sql" -ForegroundColor Yellow
        exit 1
    }
    
    Remove-Item $tempSqlFile -ErrorAction SilentlyContinue
    Remove-Item Env:\MYSQL_PWD -ErrorAction SilentlyContinue
} else {
    Write-Host "  ⚠️  mysql n'est pas disponible en ligne de commande" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  💡 Exécutez manuellement:" -ForegroundColor Yellow
    Write-Host "     mysql -h $dbHost -P $dbPort -u $dbUser -p $dbName < scripts\create-chrono-tasks-tables.sql" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  Ou copiez-collez le contenu de scripts\create-chrono-tasks-tables.sql dans votre client MySQL" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  Appuyez sur une touche après avoir exécuté le SQL..." -ForegroundColor Yellow
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

Write-Host ""
Write-Host "[3/3] Génération du client Prisma..." -ForegroundColor Yellow
npx prisma generate
if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✅ Client Prisma généré avec succès!" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  Erreur lors de la génération du client Prisma" -ForegroundColor Yellow
    Write-Host "  Vous pouvez l'exécuter manuellement: npx prisma generate" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ Migration terminée!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Les tables suivantes ont été créées:" -ForegroundColor Green
Write-Host "  - harptask (chrono-tâches)" -ForegroundColor White
Write-Host "  - harptaskitem (tâches individuelles)" -ForegroundColor White
Write-Host ""
Write-Host "Vous pouvez maintenant utiliser le système de gestion des chrono-tâches!" -ForegroundColor Green
