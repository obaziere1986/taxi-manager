# 🚀 Configuration GitHub pour Déploiement Automatique

## 📋 Secrets à Configurer dans GitHub

Aller sur **GitHub > Settings > Secrets and Variables > Actions** et ajouter :

### 🔐 Secrets de Base
```
SSH_PRIVATE_KEY = contenu de ~/.ssh/flowcab_key (clé privée complète)
NEXTAUTH_SECRET = [généré par deploy/generate-secrets.sh]
```

### 🗄️ Secrets Supabase (DÉJÀ FOURNIS)
```
NEXT_PUBLIC_SUPABASE_URL = https://pligynlgfmnequzijtqk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsaWd5bmxnZm1uZXF1emlqdHFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4MDQyNjksImV4cCI6MjA3MTM4MDI2OX0.Kkn1hK_NYiShHFamDKc0kOGm43C81yZq_StDawEw1os
SUPABASE_SERVICE_ROLE_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsaWd5bmxnZm1uZXF1emlqdHFrIiwicm9sZSI6InNlcnZpY2Vfc29sZSIsImlhdCI6MTc1NTgwNDI2OSwiZXhwIjoyMDcxMzgwMjY5fQ.TqtaLJoEEM8Rz4MoxGgJxGmZFruKUfm0ZuqP4P-Kc5M
```

## 🔑 Récupération de la Clé SSH

```bash
# Sur votre machine locale
cat ~/.ssh/flowcab_key
```

Copier TOUT le contenu (y compris les lignes BEGIN/END) dans le secret `SSH_PRIVATE_KEY`.

## 🎯 Configuration Étape par Étape

### 1. Accéder aux Secrets GitHub
1. Aller sur https://github.com/obaziere1986/taxi-manager
2. **Settings** > **Secrets and variables** > **Actions**
3. Cliquer **"New repository secret"**

### 2. Ajouter les Secrets Un par Un
Pour chaque secret :
- **Name** : nom exact (ex: `SSH_PRIVATE_KEY`)
- **Value** : valeur correspondante
- Cliquer **"Add secret"**

### 3. Vérification
Une fois tous les secrets ajoutés, vous devriez voir :
- ✅ `SSH_PRIVATE_KEY`
- ✅ `NEXTAUTH_SECRET` 
- ✅ `NEXT_PUBLIC_SUPABASE_URL`
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- ✅ `SUPABASE_SERVICE_ROLE_KEY`

## 🚀 Test du Déploiement

### Déclenchement Manuel
1. **Actions** > **🚀 Deploy to Production**
2. **Run workflow** > **Run workflow**

### Déclenchement Automatique  
Chaque push sur `main` déclenche automatiquement le déploiement.

## 📊 Surveillance

### Logs de Déploiement
- **Actions** tab pour voir les logs en temps réel
- Chaque étape est tracée avec des émojis

### Vérification Post-Déploiement
Le workflow teste automatiquement :
```bash
curl -f -L -I https://flowcab.fr
```

## ⚠️ Dépannage

### Échec SSH
```
Permission denied (publickey)
```
**Solution** : Vérifier que `SSH_PRIVATE_KEY` contient la clé complète avec BEGIN/END

### Échec Build  
```
Module not found
```
**Solution** : Vérifier que les secrets Supabase sont bien configurés

### Timeout de Déploiement
```
The job running on runner GitHub Actions has exceeded the maximum execution time
```
**Solution** : Le VPS peut être surchargé, relancer le workflow

## 📈 Workflow Optimisé

Le workflow actuel :
1. 📂 Checkout du code
2. 📦 Setup Node.js + pnpm
3. 🔧 Installation des dépendances  
4. 🏗️ Build avec variables d'environnement
5. 📁 Création de l'archive de déploiement
6. 🔑 Configuration SSH
7. 📤 Transfert vers le VPS
8. 🔄 Déploiement avec backup automatique
9. 🧪 Test de santé de l'application

## 🎉 Avantages

- ✅ **Déploiement zéro-downtime** avec backup automatique
- ✅ **Rollback automatique** en cas d'échec
- ✅ **Variables d'environnement** sécurisées
- ✅ **Test post-déploiement** automatique
- ✅ **Logs détaillés** pour debugging