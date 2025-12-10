# Script PowerShell pour déployer le système de notifications en production
# Usage: .\scripts\deploy-notifications-production.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Déploiement du système de notifications" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Vérifier que nous sommes dans le bon répertoire
if (-not (Test-Path "prisma\schema.prisma")) {
    Write-Host "Erreur: Ce script doit être exécuté depuis la racine du projet" -ForegroundColor Red
    exit 1
}

# Étape 1: Vérifier l'état des migrations
Write-Host "[1/5] Vérification de l'état des migrations..." -ForegroundColor Yellow
npx prisma migrate status
if ($LASTEXITCODE -ne 0) {
    Write-Host "Avertissement: Problème avec l'état des migrations" -ForegroundColor Yellow
    Write-Host "Continuez avec prudence..." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Appuyez sur une touche pour continuer ou Ctrl+C pour annuler..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

# Étape 2: Appliquer les migrations
Write-Host ""
Write-Host "[2/5] Application des migrations de base de données..." -ForegroundColor Yellow
npx prisma migrate deploy
if ($LASTEXITCODE -ne 0) {
    Write-Host "Erreur: Échec de l'application des migrations" -ForegroundColor Red
    Write-Host "Vous pouvez créer les tables manuellement avec:" -ForegroundColor Yellow
    Write-Host "  mysql -u root -p < scripts\create-notification-tables.sql" -ForegroundColor Yellow
    exit 1
}

# Étape 3: Générer le client Prisma
Write-Host ""
Write-Host "[3/5] Génération du client Prisma..." -ForegroundColor Yellow
npx prisma generate
if ($LASTEXITCODE -ne 0) {
    Write-Host "Erreur: Échec de la génération du client Prisma" -ForegroundColor Red
    exit 1
}

# Étape 4: Build de l'application
Write-Host ""
Write-Host "[4/5] Build de l'application..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "Erreur: Échec du build de l'application" -ForegroundColor Red
    exit 1
}

# Étape 5: Vérification
Write-Host ""
Write-Host "[5/5] Vérification du déploiement..." -ForegroundColor Yellow
Write-Host ""
Write-Host "✅ Déploiement terminé avec succès!" -ForegroundColor Green
Write-Host ""
Write-Host "Prochaines étapes:" -ForegroundColor Cyan
Write-Host "  1. Vérifier que les tables existent dans la base de données" -ForegroundColor White
Write-Host "  2. Démarrer l'application avec: npm run start" -ForegroundColor White
Write-Host "  3. Tester la création de notification sur /list/notifications" -ForegroundColor White
Write-Host "  4. Tester l'affichage des notifications sur /user/profile/notifications" -ForegroundColor White
Write-Host ""

