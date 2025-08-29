#!/bin/bash

# ===============================================
# CONFIGURATION DOMAINE LOCAL : local.app.flowcab.fr
# ===============================================

echo "🏠 Configuration du domaine local pour Taxi Manager"
echo "===================================================="

# Configuration
LOCAL_DOMAIN="local.app.flowcab.fr"
HOSTS_FILE="/etc/hosts"
HOSTS_ENTRY="127.0.0.1 $LOCAL_DOMAIN"

echo ""
echo "📋 ÉTAPES DE CONFIGURATION"
echo "=========================="

# Vérifier si l'entrée existe déjà
if grep -q "$LOCAL_DOMAIN" "$HOSTS_FILE" 2>/dev/null; then
    echo "✅ $LOCAL_DOMAIN est déjà configuré dans /etc/hosts"
else
    echo "📝 Ajout de $LOCAL_DOMAIN dans /etc/hosts..."
    echo "⚠️  Cette opération nécessite les droits administrateur"
    echo ""
    echo "Commande à exécuter:"
    echo "sudo echo '$HOSTS_ENTRY' >> $HOSTS_FILE"
    echo ""
    
    # Demander confirmation
    read -p "Voulez-vous l'ajouter automatiquement ? (y/n): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "$HOSTS_ENTRY" | sudo tee -a "$HOSTS_FILE" > /dev/null
        echo "✅ $LOCAL_DOMAIN ajouté avec succès !"
    else
        echo "💡 Ajoutez manuellement cette ligne dans /etc/hosts :"
        echo "   $HOSTS_ENTRY"
    fi
fi

echo ""
echo "🔧 CONFIGURATION DE L'APPLICATION"
echo "=================================="

# Créer/Modifier le fichier .env.local
cat > .env.local << EOF
# Configuration locale pour local.app.flowcab.fr
NODE_ENV=development
NEXTAUTH_URL=http://local.app.flowcab.fr:3000
NEXTAUTH_SECRET=dev-secret-key-local-only

# Supabase Configuration (même que production)
NEXT_PUBLIC_SUPABASE_URL=https://pligynlgfmnequzijtqk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsaWd5bmxnZm1uZXF1emlqdHFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4MDQyNjksImV4cCI6MjA3MTM4MDI2OX0.Kkn1hK_NYiShHFamDKc0kOGm43C81yZq_StDawEw1os
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsaWd5bmxnZm1uZXF1emlqdHFrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTgwNDI2OSwiZXhwIjoyMDcxMzgwMjY5fQ.TqtaLJoEEM8Rz4MoxGgJxGmZFruKUfm0ZuqP4P-Kc5M
EOF

echo "✅ Fichier .env.local créé avec la configuration locale"

echo ""
echo "🚀 DÉMARRAGE DE L'APPLICATION"
echo "============================="
echo "1. Démarrer l'application : pnpm dev"
echo "2. Accéder à l'app : http://local.app.flowcab.fr:3000"
echo ""
echo "🌐 URLs DISPONIBLES :"
echo "- Local : http://local.app.flowcab.fr:3000"
echo "- Prod : http://app.flowcab.fr"
echo "- Landing : http://www.flowcab.fr (en cours de configuration DNS)"

echo ""
echo "🔍 VÉRIFICATION DNS LOCALE"
echo "=========================="
ping -c 1 "$LOCAL_DOMAIN" 2>/dev/null && echo "✅ $LOCAL_DOMAIN résout correctement" || echo "❌ Problème de résolution DNS"

echo ""
echo "✅ Configuration locale terminée !"