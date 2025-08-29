# 🌐 Configuration Multi-Domaines - Taxi Manager

## ✅ Configuration Terminée

### 🏗️ Architecture Déployée

```
flowcab.fr / www.flowcab.fr
├── Landing page "Coming Soon"
├── Location: /var/www/landing/index.html
└── Status: ✅ Opérationnelle

app.flowcab.fr
├── Application Taxi Manager complète
├── Location: /var/www/flowcab.fr
├── Backend: Supabase PostgreSQL
└── Status: ✅ Opérationnelle

local.app.flowcab.fr:3000
├── Environnement de développement
├── Configuration: .env.local
└── Status: ✅ Configuré (nécessite ajout manuel dans /etc/hosts)
```

## 🔧 Modifications Effectuées

### 1. Configuration DNS Hostinger
```bash
# Ajout du sous-domaine app.flowcab.fr
A record: app.flowcab.fr → 69.62.108.105
```

### 2. Configuration Nginx Multi-Domaines
- **Fichier**: `/etc/nginx/sites-available/flowcab-multi`
- **www.flowcab.fr** → Landing page statique
- **app.flowcab.fr** → Proxy vers Next.js (port 3000)
- Security headers activés pour les deux domaines

### 3. Application Taxi Manager
- **URL de production**: Mise à jour vers `app.flowcab.fr`
- **Configuration**: `.env.production.local` sur VPS
- **Status PM2**: ✅ Opérationnelle et redémarrée

### 4. Environnement Local  
- **Fichier**: `.env.local` créé localement
- **URL locale**: `local.app.flowcab.fr:3000`
- **Base de données**: Supabase partagée avec la production

## 🚀 URLs Actives

| Environnement | URL | Status | Description |
|---------------|-----|--------|-------------|
| **Landing** | http://www.flowcab.fr | ✅ | Page "Coming Soon" |
| **Production** | http://app.flowcab.fr | ✅ | Application complète |
| **Local** | http://local.app.flowcab.fr:3000 | 🔧 | Développement |

## 📋 Actions Requises par l'Utilisateur

### 1. Configuration DNS Locale (Une fois)
```bash
# Ajouter dans /etc/hosts
echo "127.0.0.1 local.app.flowcab.fr" | sudo tee -a /etc/hosts
```

### 2. Démarrage Local
```bash
# Dans le dossier du projet
pnpm dev

# Application accessible sur :
# http://local.app.flowcab.fr:3000
```

## 🔐 Configuration GitHub Actions (À faire)

Le repository GitHub n'a pas encore les secrets configurés. Voici les étapes :

### Secrets à Ajouter
1. Aller sur : https://github.com/obaziere1986/taxi-manager/settings/secrets/actions
2. Ajouter ces secrets :

```bash
SSH_PRIVATE_KEY=<contenu de ~/.ssh/flowcab_key>
NEXTAUTH_SECRET=jBwUATLv5nOJPlHf2sE38QSj2JLVrSbY
NEXT_PUBLIC_SUPABASE_URL=https://pligynlgfmnequzijtqk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsaWd5bmxnZm1uZXF1emlqdHFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4MDQyNjksImV4cCI6MjA3MTM4MDI2OX0.Kkn1hK_NYiShHFamDKc0kOGm43C81yZq_StDawEw1os
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsaWd5bmxnZm1uZXF1emlqdHFrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTgwNDI2OSwiZXhwIjoyMDcxMzgwMjY5fQ.TqtaLJoEEM8Rz4MoxGgJxGmZFruKUfm0ZuqP4P-Kc5M
```

## 🛠️ Scripts Utiles

### Récupérer la Clé SSH
```bash
./deploy/setup-github-secrets.sh
```

### Configuration Locale
```bash
./deploy/setup-local-domain.sh
```

### Test des Domaines
```bash
curl -I http://www.flowcab.fr        # Landing page
curl -I http://app.flowcab.fr        # Application
```

## 🚨 Points d'Attention

### DNS www.flowcab.fr
- **Problème** : Redirige vers les serveurs Hostinger (SSL)
- **Solution temporaire** : Configuration HTTP en place
- **À faire** : Configuration SSL Let's Encrypt

### Workflow GitHub Actions  
- **Status** : Configuré mais secrets manquants
- **Workflow** : `.github/workflows/deploy.yml`
- **Cible** : Déploiement automatique vers `app.flowcab.fr`

## 🎯 Prochaines Étapes Recommandées

1. **Configurer les secrets GitHub** (5 min)
2. **Tester le déploiement automatique** (5 min)
3. **Configurer SSL Let's Encrypt** (15 min)
4. **Finaliser la landing page** (optionnel)

## 📊 Résultat Final

- ✅ **Application opérationnelle** sur `app.flowcab.fr`
- ✅ **Landing page** déployée sur `www.flowcab.fr`
- ✅ **Environnement local** configuré pour `local.app.flowcab.fr:3000`
- ✅ **Supabase** connecté et fonctionnel
- ✅ **Multi-domaines** avec Nginx
- 🔧 **GitHub Actions** prêt (secrets à configurer)

---

**Configuration multi-domaines terminée avec succès ! 🎉**

L'application Taxi Manager est maintenant accessible sur son propre sous-domaine avec une architecture professionnelle séparant la landing page de l'application.