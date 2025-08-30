# 🚀 Guide de Déploiement - Taxi Manager

## Architecture Multi-Domaines

### Domaines
- **App principale** : `https://app.flowcab.fr` 
- **Landing page** : `https://flowcab.fr` (futur)

### Configuration Serveur

#### Variables d'environnement requises sur le VPS
Créer `/var/www/app.flowcab.fr/.env.production.local` :

```bash
NODE_ENV=production
NEXTAUTH_URL=https://app.flowcab.fr
NEXTAUTH_SECRET=your-production-nextauth-secret
NEXT_PUBLIC_SUPABASE_URL=https://pligynlgfmnequzijtqk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-production-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-production-service-role-key
```

#### Configuration Nginx Multi-Domaines

**IMPORTANT** : Pour utiliser l'architecture app.flowcab.fr, vous devez activer la configuration multi-domaines :

```bash
# Sur le serveur VPS
sudo cp deploy/nginx-multi-domains.conf /etc/nginx/sites-available/taxi-manager
sudo ln -sf /etc/nginx/sites-available/taxi-manager /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

**Vérification de la configuration active** :
```bash
# Vérifier le lien symbolique
ls -la /etc/nginx/sites-enabled/taxi-manager
# Doit pointer vers /etc/nginx/sites-available/taxi-manager

# Tester la configuration Nginx
sudo nginx -t
```

Cette configuration active :
- `app.flowcab.fr` → Application Taxi Manager (port 3000)
- `flowcab.fr` → Landing page (répertoire `/var/www/landing`)

**Sans cette activation**, l'app ne sera accessible que sur `flowcab.fr` avec l'ancienne config.

## Stratégie de Build

**Build côté serveur uniquement** :
- CI transfère le code source
- Le serveur rebuild avec ses variables d'environnement
- Plus simple et évite les désynchronisations

## Secrets Sécurisés

### Anciennes fuites nettoyées
- ❌ `.mcp.json` : tokens Supabase/Hostinger purgés
- ✅ Variables déplacées vers l'environnement

### Rotation des tokens
**IMPORTANT** : Les tokens suivants doivent être régénérés car ils étaient committés :
- `SUPABASE_ACCESS_TOKEN` dans Supabase Dashboard > Settings > Access tokens
- `APITOKEN` Hostinger dans hPanel > API

## Déploiement

### Automatique (recommandé)
Push sur `main` déclenche le déploiement automatique via GitHub Actions.

### Manuel d'urgence
```bash
# Sur le serveur
cd /var/www/app.flowcab.fr
git pull origin main
pnpm install
pnpm build
pm2 restart taxi-manager
```

## Sanity Checks Post-Déploiement

### URLs à tester
- ✅ `https://app.flowcab.fr` - Application
- ✅ `https://app.flowcab.fr/api/health` - API
- ✅ `https://app.flowcab.fr/login` - Authentification

### Authentification
1. Login avec identifiants valides
2. Vérifier redirection vers dashboard  
3. Tester déconnexion

### APIs critiques
```bash
curl -I https://app.flowcab.fr/api/current-user
curl -I https://app.flowcab.fr/api/users
curl -I https://app.flowcab.fr/api/courses
```

## Sécurité et Monitoring

### SSL et Certificats
```bash
# Configuration SSL Let's Encrypt
certbot --nginx -d app.flowcab.fr -d flowcab.fr --non-interactive --agree-tos --email admin@flowcab.fr

# Test SSL
curl -I https://app.flowcab.fr
```

### Monitoring et Maintenance
```bash
# Statut application
pm2 status

# Logs en temps réel
pm2 logs taxi-manager --lines 50

# Test de santé
curl -f -L -I https://app.flowcab.fr

# Backup configuration
tar -czf /root/backup-taxi-$(date +%Y%m%d).tar.gz \
  /var/www/app.flowcab.fr/.env.production.local \
  /var/www/app.flowcab.fr/ecosystem.config.js \
  /etc/nginx/sites-available/taxi-manager
```

### Bonnes Pratiques de Sécurité
- Variables d'environnement sécurisées (.env* dans .gitignore)
- Headers de sécurité Nginx (CSP, HSTS, X-Frame-Options)
- HTTPS obligatoire avec Let's Encrypt
- Comptes de test masqués en production
- Clés SSH dédiées pour déploiement
- Rotation régulière des tokens API

## Environnement de Développement Local

### Configuration DNS locale
```bash
# Ajouter dans /etc/hosts pour développement
echo "127.0.0.1 local.app.flowcab.fr" | sudo tee -a /etc/hosts
```

### Variables locales (.env.local)
```bash
NODE_ENV=development
NEXTAUTH_URL=http://local.app.flowcab.fr:3000
NEXTAUTH_SECRET=dev-secret-key-local-only
NEXT_PUBLIC_SUPABASE_URL=https://pligynlgfmnequzijtqk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Changements Récents

### ✅ Auth Unifiée
- Supprimé JWT custom
- 100% NextAuth partout
- Endpoints obsolètes supprimés

### ✅ Sécurité
- Routes debug limitées au développement
- Secrets purgés et externalisés
- Headers de sécurité renforcés

### ✅ Performance
- Build unique côté serveur
- Middleware optimisé
- Cache configuré

---

**Dernière mise à jour** : 30 août 2025  
**Architecture** : app.flowcab.fr (App) + flowcab.fr (Landing)  
**Build** : Server-side uniquement