#!/bin/bash

# ===============================================
# CONFIGURATION AUTOMATIQUE DES SECRETS GITHUB
# ===============================================

echo "🔐 Configuration des Secrets GitHub pour Taxi Manager"
echo "======================================================"

# Configuration
REPO="obaziere1986/taxi-manager"
NEXTAUTH_SECRET="jBwUATLv5nOJPlHf2sE38QSj2JLVrSbY"

echo ""
echo "📋 SECRETS À CONFIGURER DANS GITHUB"
echo "===================================="
echo ""
echo "Aller sur : https://github.com/$REPO/settings/secrets/actions"
echo ""

echo "🔑 1. SSH_PRIVATE_KEY"
echo "===================="
echo "Contenu de la clé privée SSH :"
echo "------------------------------"
if [ -f ~/.ssh/flowcab_key ]; then
    cat ~/.ssh/flowcab_key
else
    echo "❌ Clé SSH non trouvée à ~/.ssh/flowcab_key"
    echo "💡 Générer la clé avec : ssh-keygen -t rsa -b 4096 -f ~/.ssh/flowcab_key"
fi

echo ""
echo "🔐 2. NEXTAUTH_SECRET"
echo "==================="
echo "$NEXTAUTH_SECRET"

echo ""
echo "🗄️ 3. SECRETS SUPABASE"
echo "====================="
echo "NEXT_PUBLIC_SUPABASE_URL=https://pligynlgfmnequzijtqk.supabase.co"
echo ""
echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsaWd5bmxnZm1uZXF1emlqdHFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4MDQyNjksImV4cCI6MjA3MTM4MDI2OX0.Kkn1hK_NYiShHFamDKc0kOGm43C81yZq_StDawEw1os"
echo ""
echo "SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsaWd5bmxnZm1uZXF1emlqdHFrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTgwNDI2OSwiZXhwIjoyMDcxMzgwMjY5fQ.TqtaLJoEEM8Rz4MoxGgJxGmZFruKUfm0ZuqP4P-Kc5M"

echo ""
echo "📝 ÉTAPES À SUIVRE :"
echo "==================="
echo "1. Copier chaque valeur ci-dessus"
echo "2. Aller sur https://github.com/$REPO/settings/secrets/actions"
echo "3. Cliquer 'New repository secret'"
echo "4. Ajouter chaque secret avec son nom exact"
echo "5. Tester le déploiement : Actions > Deploy to Production > Run workflow"

echo ""
echo "✅ Une fois configuré, chaque push sur 'main' déclenche un déploiement automatique !"