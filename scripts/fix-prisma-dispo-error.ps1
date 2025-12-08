# Script PowerShell pour diagnostiquer et corriger l'erreur de contrainte de clé étrangère
# pour psadm_dispo avant d'appliquer la migration Prisma

param(
    [string]$DatabaseName = "decembre_25",
    [string]$DatabaseUser = "root",
    [string]$DatabasePassword = "",
    [string]$DatabaseHost = "localhost"
)

Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "Diagnostic et correction pour psadm_dispo" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""

# Construire la chaîne de connexion
$connectionString = "mysql -u$DatabaseUser"
if ($DatabasePassword) {
    $connectionString += " -p$DatabasePassword"
}
$connectionString += " -h$DatabaseHost $DatabaseName"

Write-Host "1. Vérification de l'existence des tables référencées..." -ForegroundColor Yellow

# Vérifier psadm_env
$checkEnv = "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = '$DatabaseName' AND table_name = 'psadm_env';"
$envExists = mysql -u$DatabaseUser $(if($DatabasePassword){"-p$DatabasePassword"}) -h$DatabaseHost $DatabaseName -e $checkEnv 2>&1

if ($envExists -match "1") {
    Write-Host "   ✓ Table psadm_env existe" -ForegroundColor Green
} else {
    Write-Host "   ✗ Table psadm_env N'EXISTE PAS" -ForegroundColor Red
    Write-Host "   → Vous devez créer cette table d'abord avec Prisma" -ForegroundColor Yellow
    Write-Host "   → Exécutez: npx prisma migrate dev (pour créer toutes les tables)" -ForegroundColor Yellow
    exit 1
}

# Vérifier psadm_statenv
$checkStatenv = "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = '$DatabaseName' AND table_name = 'psadm_statenv';"
$statenvExists = mysql -u$DatabaseUser $(if($DatabasePassword){"-p$DatabasePassword"}) -h$DatabaseHost $DatabaseName -e $checkStatenv 2>&1

if ($statenvExists -match "1") {
    Write-Host "   ✓ Table psadm_statenv existe" -ForegroundColor Green
} else {
    Write-Host "   ✗ Table psadm_statenv N'EXISTE PAS" -ForegroundColor Red
    Write-Host "   → Vous devez créer cette table d'abord avec Prisma" -ForegroundColor Yellow
    Write-Host "   → Exécutez: npx prisma migrate dev (pour créer toutes les tables)" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "2. Suppression de psadm_dispo si elle existe déjà..." -ForegroundColor Yellow

# Supprimer les contraintes et la table
$dropScript = @"
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS \`psadm_dispo\`;
SET FOREIGN_KEY_CHECKS = 1;
"@

$dropScript | mysql -u$DatabaseUser $(if($DatabasePassword){"-p$DatabasePassword"}) -h$DatabaseHost $DatabaseName 2>&1 | Out-Null

if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✓ Table psadm_dispo supprimée (si elle existait)" -ForegroundColor Green
} else {
    Write-Host "   ⚠ Erreur lors de la suppression (peut-être qu'elle n'existait pas)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "3. Vérification des clés primaires..." -ForegroundColor Yellow

# Vérifier que env est une clé primaire
$checkEnvPK = "SELECT COUNT(*) as count FROM information_schema.table_constraints tc JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name WHERE tc.table_schema = '$DatabaseName' AND tc.table_name = 'psadm_env' AND tc.constraint_type = 'PRIMARY KEY' AND kcu.column_name = 'env';"
$envPK = mysql -u$DatabaseUser $(if($DatabasePassword){"-p$DatabasePassword"}) -h$DatabaseHost $DatabaseName -e $checkEnvPK 2>&1

if ($envPK -match "1") {
    Write-Host "   ✓ Colonne env est une clé primaire dans psadm_env" -ForegroundColor Green
} else {
    Write-Host "   ✗ Colonne env N'EST PAS une clé primaire dans psadm_env" -ForegroundColor Red
    Write-Host "   → Corrigez la structure de psadm_env d'abord" -ForegroundColor Yellow
    exit 1
}

# Vérifier que statenv est une clé primaire
$checkStatenvPK = "SELECT COUNT(*) as count FROM information_schema.table_constraints tc JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name WHERE tc.table_schema = '$DatabaseName' AND tc.table_name = 'psadm_statenv' AND tc.constraint_type = 'PRIMARY KEY' AND kcu.column_name = 'statenv';"
$statenvPK = mysql -u$DatabaseUser $(if($DatabasePassword){"-p$DatabasePassword"}) -h$DatabaseHost $DatabaseName -e $checkStatenvPK 2>&1

if ($statenvPK -match "1") {
    Write-Host "   ✓ Colonne statenv est une clé primaire dans psadm_statenv" -ForegroundColor Green
} else {
    Write-Host "   ✗ Colonne statenv N'EST PAS une clé primaire dans psadm_statenv" -ForegroundColor Red
    Write-Host "   → Corrigez la structure de psadm_statenv d'abord" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "✓ Toutes les vérifications sont OK!" -ForegroundColor Green
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Vous pouvez maintenant exécuter:" -ForegroundColor Yellow
Write-Host "  npx prisma migrate dev" -ForegroundColor White
Write-Host ""
Write-Host "Ou appliquer la migration manuellement avec:" -ForegroundColor Yellow
Write-Host "  mysql -u$DatabaseUser $(if($DatabasePassword){"-p$DatabasePassword"}) -h$DatabaseHost $DatabaseName < scripts/create-psadm-dispo.sql" -ForegroundColor White
Write-Host ""
