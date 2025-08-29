#!/bin/bash

# Configuration
DOMAIN="flowcab.fr"
VPS_IP="69.62.108.105"
DEPLOY_PATH="/var/www/flowcab.fr"
APP_NAME="taxi-manager"

echo "🚀 Déploiement de Taxi Manager sur $DOMAIN"

# Build local
echo "📦 Build de l'application..."
pnpm build

# Création de l'archive de déploiement
echo "📁 Création de l'archive..."
tar -czf taxi-manager-deploy.tar.gz \
  --exclude=node_modules \
  --exclude=.next/cache \
  --exclude=.git \
  --exclude=deploy \
  .

echo "✅ Archive créée: taxi-manager-deploy.tar.gz"
echo ""
echo "📋 Prochaines étapes manuelles:"
echo "1. Transférer taxi-manager-deploy.tar.gz sur le VPS"
echo "2. Se connecter au VPS: ssh root@$VPS_IP"
echo "3. Exécuter les commandes de déploiement"
echo ""
echo "Commandes à exécuter sur le VPS:"
echo "==================="
echo "# Installation des dépendances"
echo "apt update && apt install -y nodejs npm nginx certbot python3-certbot-nginx"
echo "npm install -g pm2 pnpm"
echo ""
echo "# Préparation des dossiers"
echo "mkdir -p $DEPLOY_PATH"
echo "cd $DEPLOY_PATH"
echo ""
echo "# Extraction et installation"
echo "tar -xzf ~/taxi-manager-deploy.tar.gz"
echo "pnpm install --production"
echo ""
echo "# Configuration SSL"
echo "certbot --nginx -d $DOMAIN -d www.$DOMAIN"
echo ""
echo "# Lancement de l'application"
echo "pm2 start ecosystem.config.js"
echo "pm2 startup"
echo "pm2 save"