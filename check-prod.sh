#!/bin/bash

echo "🔍 Vérification serveur de production..."

echo "📊 Statut PM2:"
pm2 status

echo ""
echo "📋 Logs PM2 (dernières 20 lignes):"
pm2 logs taxi-manager --lines 20

echo ""
echo "🌐 Test connexion locale:"
curl -s -I http://localhost:3000 | head -3

echo ""
echo "📂 Vérification des fichiers:"
ls -la /var/www/flowcab.fr/.env* 2>/dev/null || echo "Aucun fichier .env trouvé"

echo ""
echo "📦 Vérification build:"
ls -la /var/www/flowcab.fr/.next 2>/dev/null | head -5 || echo ".next non trouvé"

echo ""
echo "🔧 Processus écoutant sur port 3000:"
netstat -tulpn | grep :3000 || echo "Aucun processus sur port 3000"