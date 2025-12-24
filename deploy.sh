#!/bin/bash

set -e  # stop au premier échec

APP_DIR="/produits/portail_harp-tech/www/portaltech"
BRANCH="main"
PORT=9352

echo "🔁 Déploiement en cours..."

cd "$APP_DIR"

echo "📦 Chargement des variables d'environnement"
if [ ! -f .env.production ]; then
  echo "❌ .env.production introuvable"
  exit 1
fi

set -a
source .env.production
set +a

echo "📥 Mise à jour du code"
git fetch origin
git checkout $BRANCH
git pull origin $BRANCH

echo "📦 Installation des dépendances"
npm install --production=false

echo "🧬 Prisma generate"
npx prisma generate

echo "🏗️ Next.js build"
rm -rf .next
npm run build

echo "🛑 Arrêt de l'ancienne instance"
PID=$(lsof -ti tcp:$PORT || true)
if [ ! -z "$PID" ]; then
  kill -9 $PID
  echo "✔️ Processus $PID arrêté"
fi

echo "🚀 Démarrage de l'application"
nohup npm run start -p $PORT > portailHarp.log 2>&1 &

echo "✅ Déploiement terminé avec succès"
