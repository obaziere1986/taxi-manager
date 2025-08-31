#!/bin/bash
set -Eeuo pipefail

echo "🚀 Début du déploiement..."

# Backup si présent
if [ -d "/var/www/app.flowcab.fr" ]; then
  cp -r /var/www/app.flowcab.fr /var/www/app.flowcab.fr.backup.$(date +%Y%m%d-%H%M%S)
fi

# Dossier temporaire
rm -rf /var/www/app.flowcab.fr.new
mkdir -p /var/www/app.flowcab.fr.new
cd /var/www/app.flowcab.fr.new

# Extraction
tar -xzf /root/taxi-manager-new.tar.gz

# Variables d'environnement
if [ -f "/root/temp_env.txt" ]; then
  cp /root/temp_env.txt .env.production.local
  rm /root/temp_env.txt
  echo "✅ Variables d'environnement mises à jour"
else
  echo "⚠️ Fichier temp_env.txt non trouvé, conservation env existant"
  if [ -f "/var/www/app.flowcab.fr/.env.production.local" ]; then
    cp /var/www/app.flowcab.fr/.env.production.local .env.production.local
  fi
fi

# Mise à jour du système et installation des dépendances
echo "📦 Mise à jour du système..."
apt-get update

# Installation de Node.js et pnpm si nécessaire
if ! command -v node &> /dev/null; then
  echo "📦 Installation de Node.js..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  apt-get install -y nodejs
fi

# Installation nginx si nécessaire
if ! command -v nginx &> /dev/null; then
  echo "📦 Installation de nginx..."
  apt-get install -y nginx
  systemctl enable nginx
fi

if ! command -v pnpm &> /dev/null; then
  echo "📦 Installation de pnpm..."
  npm install -g pnpm
fi

# Installation PM2 si nécessaire
if ! command -v pm2 &> /dev/null; then
  echo "📦 Installation de PM2..."
  npm install -g pm2
fi

# Dépendances + build
echo "📦 Installation des dépendances..."
pnpm install

echo "🔧 Build de production..."
rm -rf .next
NODE_ENV=production pnpm build

# Libérer port 3000 (sans bruit)
echo "🔌 Libération du port 3000..."
lsof -ti:3000 | xargs -r kill -9 || true

# Swap atomique
echo "🔄 Arrêt de l'ancienne version..."
pm2 stop taxi-manager || true

echo "📁 Correction des permissions..."
chown -R root:root /var/www/app.flowcab.fr.new

echo "🔄 Remplacement atomique..."
if [ -d "/var/www/app.flowcab.fr" ]; then
  mv /var/www/app.flowcab.fr /var/www/app.flowcab.fr.old
fi
mv /var/www/app.flowcab.fr.new /var/www/app.flowcab.fr

# PM2
echo "🚀 Configuration PM2..."
cd /var/www/app.flowcab.fr

# Copier le template de production depuis le deploy
echo "📝 Copie template ecosystem.config.js..."
cp deploy/ecosystem.config.prod.js ecosystem.config.js

echo "▶️ Redémarrage de l'application..."
pm2 start ecosystem.config.js || pm2 restart taxi-manager
pm2 save

# Configuration nginx
echo "🌐 Configuration nginx..."
if [ -f "deploy/nginx-multi-domains.conf" ]; then
  cp deploy/nginx-multi-domains.conf /etc/nginx/sites-available/taxi-manager
  ln -sf /etc/nginx/sites-available/taxi-manager /etc/nginx/sites-enabled/
  rm -f /etc/nginx/sites-enabled/default
  nginx -t && systemctl reload nginx
  echo "✅ Nginx configuré"
else
  echo "⚠️ Fichier nginx non trouvé, configuration manuelle requise"
fi

# Nettoyage
echo "🧹 Nettoyage..."
rm -f /root/taxi-manager-new.tar.gz
rm -rf /var/www/app.flowcab.fr.old || true

echo "✅ Déploiement terminé avec succès!"