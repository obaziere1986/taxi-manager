#!/bin/bash

# ======================================
# SCRIPT DE MISE À JOUR - TAXI MANAGER
# ======================================

set -e  # Arrêt en cas d'erreur

# Configuration
VPS_IP="69.62.108.105"
VPS_USER="root"
APP_DIR="/var/www/flowcab.fr"
SSH_KEY="~/.ssh/flowcab_key"

echo "🚀 Mise à jour de Taxi Manager sur flowcab.fr"

# 1. Build local
echo "📦 Build de l'application..."
pnpm build

# 2. Création de l'archive
echo "📁 Création de l'archive..."
tar -czf taxi-manager-update.tar.gz \
  --exclude=node_modules \
  --exclude=.git \
  --exclude=.github \
  --exclude=deploy \
  --exclude=.next/cache \
  --exclude=taxi-manager-update.tar.gz \
  .

# 3. Upload vers le serveur
echo "📤 Transfert vers le serveur..."
scp -i $SSH_KEY taxi-manager-update.tar.gz $VPS_USER@$VPS_IP:~/

# 4. Déploiement sur le serveur
echo "🔄 Déploiement sur le serveur..."
ssh -i $SSH_KEY $VPS_USER@$VPS_IP << 'EOF'
set -e

echo "🔄 Début de la mise à jour..."

# Backup de l'ancienne version
BACKUP_DIR="/var/www/flowcab.fr.backup.$(date +%Y%m%d-%H%M%S)"
echo "💾 Backup vers $BACKUP_DIR"
cp -r /var/www/flowcab.fr $BACKUP_DIR

# Répertoire temporaire
mkdir -p /tmp/taxi-manager-update
cd /tmp/taxi-manager-update

# Extraction
echo "📦 Extraction de la nouvelle version..."
tar -xzf ~/taxi-manager-update.tar.gz

# Conservation des fichiers de configuration
echo "🔧 Conservation de la configuration..."
if [ -f "/var/www/flowcab.fr/.env.production.local" ]; then
  cp /var/www/flowcab.fr/.env.production.local .env.production.local
fi

if [ -f "/var/www/flowcab.fr/ecosystem.config.js" ]; then
  cp /var/www/flowcab.fr/ecosystem.config.js ecosystem.config.js
fi

# Installation des dépendances
echo "📥 Installation des dépendances..."
pnpm install --production

# Arrêt temporaire de l'application
echo "⏹️ Arrêt de l'application..."
pm2 stop taxi-manager || true

# Remplacement atomique des fichiers
echo "🔄 Mise à jour des fichiers..."
rm -rf /var/www/flowcab.fr.old || true
mv /var/www/flowcab.fr /var/www/flowcab.fr.old
mv /tmp/taxi-manager-update /var/www/flowcab.fr

# Redémarrage de l'application
echo "▶️ Redémarrage de l'application..."
cd /var/www/flowcab.fr
pm2 start ecosystem.config.js || pm2 restart taxi-manager
pm2 save

# Nettoyage
rm -f ~/taxi-manager-update.tar.gz
rm -rf /var/www/flowcab.fr.old

echo "✅ Mise à jour terminée avec succès!"
echo "🌍 Application disponible sur http://flowcab.fr"
EOF

# 5. Test final
echo "🧪 Test de l'application..."
sleep 5
curl -f -L -I http://flowcab.fr && echo "✅ Application accessible" || echo "❌ Problème détecté"

# Nettoyage local
rm -f taxi-manager-update.tar.gz

echo "🎉 Mise à jour terminée !"