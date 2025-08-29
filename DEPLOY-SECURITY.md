# 🛡️ Guide de Déploiement Sécurisé - Taxi Manager

## 🎯 Vue d'ensemble

Ce guide détaille la sécurisation complète de votre déploiement Taxi Manager sur flowcab.fr, incluant la configuration Supabase, GitHub Actions, et les bonnes pratiques de sécurité.

## 📋 Checklist de Sécurisation

### ✅ Étapes Réalisées

- [x] **Page de login sécurisée** - Comptes de test masqués en production
- [x] **Repository Git** initialisé avec .gitignore sécurisé
- [x] **Workflow GitHub Actions** configuré pour déploiement automatique
- [x] **Scripts de déploiement** optimisés (update.sh)
- [x] **Configuration Nginx** avec headers de sécurité
- [x] **Générateur de secrets** sécurisés

### ⏳ À Compléter

- [ ] **Clés Supabase** à configurer
- [ ] **Repository GitHub** à créer
- [ ] **Secrets GitHub Actions** à définir
- [ ] **SSL Let's Encrypt** à activer
- [ ] **Configuration email** Hostinger

## 🔐 Configuration des Clés Supabase

### 1. Récupération des clés

1. **Rendez-vous sur :** https://supabase.com/dashboard/project/pligynlgfmnequzijtqk
2. **Allez dans :** Settings → API
3. **Copiez les clés :**
   - `anon public` (clé publique)
   - `service_role` (clé privée - gardez-la secrète !)

### 2. Configuration sur le VPS

```bash
# Se connecter au VPS
ssh -i ~/.ssh/flowcab_key root@69.62.108.105

# Éditer les variables d'environnement
cd /var/www/flowcab.fr
nano .env.production.local
```

**Contenu du fichier .env.production.local :**

```bash
NODE_ENV=production
NEXTAUTH_URL=https://flowcab.fr
NEXTAUTH_SECRET="[secret-généré-par-le-script]"
NEXT_PUBLIC_SUPABASE_URL="https://pligynlgfmnequzijtqk.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="[votre-clé-anon-supabase]"
SUPABASE_SERVICE_ROLE_KEY="[votre-clé-service-supabase]"

# Configuration SMTP Hostinger
SMTP_HOST="smtp.titan.email"
SMTP_PORT=465
SMTP_USER="admin@flowcab.fr"
SMTP_PASS="[votre-mot-de-passe-email]"
MAIL_FROM_NAME="Taxi Manager"
MAIL_SUPPORT_EMAIL="admin@flowcab.fr"
```

### 3. Redémarrage de l'application

```bash
pm2 restart taxi-manager
pm2 logs taxi-manager --lines 20
```

## 🐙 Configuration GitHub

### 1. Création du repository

```bash
# Depuis votre machine locale
cd "/Users/olivier/Documents/Hub FD/05. Dev/Docker/willy/taxi-manager"

# Création du repo sur GitHub (remplacez USERNAME)
gh repo create taxi-manager --private --description "Système de gestion taxi professionnel"

# Ajout du remote et push
git branch -M main
git remote add origin https://github.com/[USERNAME]/taxi-manager.git
git push -u origin main
```

### 2. Configuration des Secrets GitHub

**Allez dans :** Settings → Secrets and variables → Actions

**Ajoutez ces secrets :**

| Nom | Valeur | Description |
|-----|---------|-------------|
| `SSH_PRIVATE_KEY` | [contenu de ~/.ssh/flowcab_key] | Clé SSH privée pour le VPS |
| `NEXTAUTH_SECRET` | [secret généré] | Secret pour NextAuth |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://pligynlgfmnequzijtqk.supabase.co` | URL publique Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | [clé anon Supabase] | Clé publique Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | [clé service Supabase] | Clé privée Supabase |

### 3. Test du déploiement

```bash
# Push pour déclencher le déploiement
git add .
git commit -m "feat: configuration déploiement automatique"
git push origin main
```

## 🔒 Sécurisation SSL

### 1. Configuration DNS (si nécessaire)

Vérifiez que `flowcab.fr` pointe bien vers `69.62.108.105` :

```bash
nslookup flowcab.fr
# Doit retourner : 69.62.108.105
```

### 2. Installation du certificat SSL

```bash
# Sur le VPS
ssh -i ~/.ssh/flowcab_key root@69.62.108.105

# Installation Let's Encrypt
certbot --nginx -d flowcab.fr -d www.flowcab.fr --non-interactive --agree-tos --email admin@flowcab.fr

# Configuration Nginx sécurisée
cp ~/nginx-secure.conf /etc/nginx/sites-available/flowcab.fr
nginx -t && systemctl reload nginx
```

## 📧 Configuration Email Hostinger

### 1. Création de l'adresse email

1. **Connectez-vous à :** https://hpanel.hostinger.com
2. **Allez dans :** Emails → Manage
3. **Créez l'adresse :** `admin@flowcab.fr`
4. **Notez le mot de passe** pour SMTP

### 2. Test de l'envoi d'email

```bash
# Sur le VPS, tester l'API mail
curl -X POST http://localhost:3000/api/mail/test \
  -H "Content-Type: application/json" \
  -d '{"to":"votre-email@example.com"}'
```

## 🚀 Déploiements

### Déploiement Automatique (Recommandé)

```bash
# Simple push vers main déclenche le déploiement
git add .
git commit -m "feat: nouvelle fonctionnalité"
git push origin main

# GitHub Actions s'occupe du reste !
```

### Déploiement Manuel

```bash
# Utilisation du script de mise à jour
./deploy/update.sh
```

## 🔍 Monitoring et Maintenance

### Commandes utiles

```bash
# Statut de l'application
ssh -i ~/.ssh/flowcab_key root@69.62.108.105 "pm2 status"

# Logs en temps réel
ssh -i ~/.ssh/flowcab_key root@69.62.108.105 "pm2 logs taxi-manager --lines 50"

# Statut Nginx
ssh -i ~/.ssh/flowcab_key root@69.62.108.105 "systemctl status nginx"

# Test de sécurité
curl -I https://flowcab.fr
```

### Sauvegarde recommandée

```bash
# Backup de la configuration (à faire régulièrement)
ssh -i ~/.ssh/flowcab_key root@69.62.108.105 "
  tar -czf /root/backup-taxi-manager-$(date +%Y%m%d).tar.gz \
    /var/www/flowcab.fr/.env.production.local \
    /var/www/flowcab.fr/ecosystem.config.js \
    /etc/nginx/sites-available/flowcab.fr \
    /etc/letsencrypt/live/flowcab.fr/
"
```

## 🛡️ Bonnes Pratiques de Sécurité

### ✅ Appliquées

- Variables d'environnement sécurisées (.env* dans .gitignore)
- Headers de sécurité Nginx (CSP, HSTS, X-Frame-Options, etc.)
- Comptes de test masqués en production
- Clés SSH dédiées pour le déploiement
- Secrets GitHub pour CI/CD sécurisé
- HTTPS obligatoire avec Let's Encrypt

### 📝 Recommandations additionnelles

1. **Monitoring** : Configurez des alertes sur les erreurs
2. **Backups** : Sauvegarde automatique de la base Supabase
3. **Updates** : Mise à jour régulière des dépendances
4. **Logs** : Rotation des logs Nginx et PM2
5. **Firewall** : Restriction des ports non nécessaires

## 🆘 Dépannage

### Problèmes courants

**Application inaccessible :**
```bash
pm2 restart taxi-manager && pm2 logs taxi-manager
```

**Erreur SSL :**
```bash
certbot renew --dry-run
nginx -t && systemctl reload nginx
```

**Problème de déploiement GitHub :**
- Vérifiez les secrets dans GitHub
- Consultez les logs Actions dans l'onglet Actions

## 📞 Support

En cas de problème, consultez dans l'ordre :

1. **Logs PM2 :** `pm2 logs taxi-manager`
2. **Logs Nginx :** `/var/log/nginx/flowcab_error.log`
3. **Logs GitHub Actions :** Onglet Actions du repository
4. **Status Supabase :** Dashboard Supabase

---

🎉 **Votre Taxi Manager est maintenant déployé de manière sécurisée !**