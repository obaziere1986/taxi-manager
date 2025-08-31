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
# Force la copie du bon ecosystem.config.js depuis le repo déployé
if [ -f "ecosystem.config.js" ]; then
  echo "✅ Utilisation ecosystem.config.js du repo"
else
  echo "⚠️ ecosystem.config.js manquant, création basique"
  cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'taxi-manager',
    script: 'npm',
    args: 'start',
    cwd: '/var/www/app.flowcab.fr',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G'
  }]
}
EOF
fi

echo "▶️ Redémarrage de l'application..."
pm2 start ecosystem.config.js || pm2 restart taxi-manager
pm2 save

# Nettoyage
echo "🧹 Nettoyage..."
rm -f /root/taxi-manager-new.tar.gz
rm -rf /var/www/app.flowcab.fr.old || true

echo "✅ Déploiement terminé avec succès!"