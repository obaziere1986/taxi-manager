# Déploiement Taxi Manager sur flowcab.fr

## 🎯 Vue d'ensemble

Ce guide détaille le déploiement de l'application Taxi Manager sur votre VPS Hostinger (69.62.108.105) avec le domaine flowcab.fr.

## 📋 Prérequis

- **VPS :** KVM 2 - Ubuntu 24.04 (2 vCores, 8GB RAM, 100GB SSD)
- **Domaine :** flowcab.fr (DNS configuré vers 69.62.108.105)
- **Application :** Next.js 15 + Supabase

## 🚀 Déploiement Étape par Étape

### 1. Préparation locale

```bash
# Dans le répertoire du projet
cd /Users/olivier/Documents/Hub\ FD/05.\ Dev/Docker/willy/taxi-manager

# Exécuter le script de build
./deploy/deploy.sh
```

### 2. Transfert vers le VPS

```bash
# Transférer l'archive
scp taxi-manager-deploy.tar.gz root@69.62.108.105:~/

# Transférer les fichiers de configuration
scp deploy/ecosystem.config.js root@69.62.108.105:~/
scp deploy/nginx.conf root@69.62.108.105:~/
```

### 3. Configuration du VPS

Se connecter au VPS :
```bash
ssh root@69.62.108.105
```

Installation des dépendances :
```bash
# Mise à jour du système
apt update && apt upgrade -y

# Installation Node.js, npm, nginx, certbot
apt install -y nodejs npm nginx certbot python3-certbot-nginx

# Installation PM2 et pnpm
npm install -g pm2 pnpm

# Vérification des versions
node --version
npm --version
pnpm --version
```

### 4. Déploiement de l'application

```bash
# Création du répertoire de déploiement
mkdir -p /var/www/flowcab.fr
cd /var/www/flowcab.fr

# Extraction de l'application
tar -xzf ~/taxi-manager-deploy.tar.gz

# Installation des dépendances
pnpm install --production

# Build de production (si nécessaire)
pnpm build
```

### 5. Configuration des variables d'environnement

```bash
# Créer le fichier .env.production.local
cat > .env.production.local << 'EOF'
NODE_ENV=production
NEXTAUTH_URL=https://flowcab.fr
NEXTAUTH_SECRET=your-super-secret-nextauth-key-here
NEXT_PUBLIC_SUPABASE_URL=https://pligynlgfmnequzijtqk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
EOF
```

**⚠️ Important :** Remplacez les valeurs placeholder par les vraies clés Supabase.

### 6. Configuration Nginx

```bash
# Sauvegarder la configuration par défaut
cp /etc/nginx/sites-available/default /etc/nginx/sites-available/default.backup

# Copier notre configuration
cp ~/nginx.conf /etc/nginx/sites-available/flowcab.fr

# Activer le site
ln -s /etc/nginx/sites-available/flowcab.fr /etc/nginx/sites-enabled/
rm /etc/nginx/sites-enabled/default

# Tester la configuration
nginx -t

# Redémarrer nginx
systemctl restart nginx
```

### 7. Configuration SSL avec Let's Encrypt

```bash
# Installation du certificat SSL
certbot --nginx -d flowcab.fr -d www.flowcab.fr

# Vérifier le renouvellement automatique
certbot renew --dry-run
```

### 8. Lancement de l'application avec PM2

```bash
# Copier la configuration PM2
cp ~/ecosystem.config.js /var/www/flowcab.fr/

# Lancer l'application
cd /var/www/flowcab.fr
pm2 start ecosystem.config.js

# Configurer le démarrage automatique
pm2 startup
pm2 save

# Vérifier le statut
pm2 status
pm2 logs taxi-manager
```

## 🔍 Vérifications

### Tests de fonctionnement

```bash
# Vérifier que l'application répond
curl -I http://localhost:3000

# Vérifier le redirections HTTPS
curl -I http://flowcab.fr
curl -I https://flowcab.fr

# Vérifier les logs
pm2 logs taxi-manager
tail -f /var/log/nginx/access.log
```

### Surveillance

```bash
# Statut des services
systemctl status nginx
pm2 status

# Ressources système
htop
df -h
free -h
```

## 🔧 Maintenance

### Mise à jour de l'application

```bash
# Arrêter l'application
pm2 stop taxi-manager

# Backup
cp -r /var/www/flowcab.fr /var/www/flowcab.fr.backup.$(date +%Y%m%d)

# Déployer la nouvelle version
cd /var/www/flowcab.fr
tar -xzf ~/nouvelle-version.tar.gz
pnpm install --production
pnpm build

# Relancer
pm2 restart taxi-manager
```

### Logs et debugging

```bash
# Logs PM2
pm2 logs taxi-manager --lines 100

# Logs Nginx
tail -f /var/log/nginx/error.log
tail -f /var/log/nginx/access.log

# Logs système
journalctl -u nginx -f
```

## 🔐 Sécurité

### Firewall (recommandé)

```bash
# Configuration UFW
ufw allow 22    # SSH
ufw allow 80    # HTTP
ufw allow 443   # HTTPS
ufw --force enable
```

### Mises à jour de sécurité

```bash
# Mise à jour automatique des paquets de sécurité
apt install unattended-upgrades
dpkg-reconfigure -plow unattended-upgrades
```

## 📞 Support

En cas de problème :

1. **Vérifier les logs** : `pm2 logs taxi-manager`
2. **Vérifier Nginx** : `nginx -t && systemctl status nginx`  
3. **Vérifier les ressources** : `htop` et `df -h`
4. **Redémarrer les services** : `pm2 restart taxi-manager && systemctl restart nginx`

## ✅ Checklist de déploiement

- [ ] VPS configuré (Node.js, PM2, Nginx)
- [ ] Archive applicative transférée
- [ ] Variables d'environnement configurées
- [ ] Nginx configuré avec SSL
- [ ] Application lancée avec PM2
- [ ] Tests de fonctionnement OK
- [ ] Firewall configuré
- [ ] Monitoring mis en place

Une fois terminé, votre application sera accessible sur **https://flowcab.fr** ! 🎉