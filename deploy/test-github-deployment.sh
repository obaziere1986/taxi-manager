#!/bin/bash

# ========================================
# TEST DE DÉPLOIEMENT GITHUB ACTIONS
# ========================================

echo "🧪 Test de Déploiement GitHub Actions"
echo "====================================="

# Configuration
REPO="obaziere1986/taxi-manager"
BRANCH="main"

echo ""
echo "📋 VÉRIFICATION PRÉALABLE"
echo "========================="

# Vérifier la branche actuelle
CURRENT_BRANCH=$(git branch --show-current)
echo "Branche actuelle : $CURRENT_BRANCH"

if [ "$CURRENT_BRANCH" != "$BRANCH" ]; then
    echo "⚠️  Vous n'êtes pas sur la branche $BRANCH"
    echo "💡 Basculer avec : git checkout $BRANCH"
    echo ""
fi

# Vérifier les secrets GitHub
echo ""
echo "🔐 SECRETS GITHUB À VÉRIFIER"
echo "============================="
echo "Aller sur : https://github.com/$REPO/settings/secrets/actions"
echo ""
echo "Secrets requis :"
echo "✅ SSH_PRIVATE_KEY"
echo "✅ NEXTAUTH_SECRET" 
echo "✅ NEXT_PUBLIC_SUPABASE_URL"
echo "✅ NEXT_PUBLIC_SUPABASE_ANON_KEY"
echo "✅ SUPABASE_SERVICE_ROLE_KEY"

echo ""
echo "🚀 OPTIONS DE TEST"
echo "=================="
echo ""
echo "1. TEST MANUEL (Recommandé)"
echo "   https://github.com/$REPO/actions"
echo "   > Cliquer '🚀 Deploy to Production'"
echo "   > Run workflow > Run workflow"
echo ""
echo "2. TEST AUTOMATIQUE (Push)"
echo "   git add ."
echo "   git commit -m 'test: déploiement GitHub Actions'"
echo "   git push origin $BRANCH"
echo ""

echo "📊 SURVEILLANCE DU DÉPLOIEMENT"
echo "==============================="
echo "- Logs en temps réel : https://github.com/$REPO/actions"
echo "- Application en ligne : http://flowcab.fr"
echo "- Test de santé : curl -I http://flowcab.fr"

echo ""
echo "⏱️  DURÉE ESTIMÉE"
echo "================="
echo "- Build : ~2-3 minutes"
echo "- Déploiement : ~1-2 minutes"  
echo "- Total : ~5 minutes"

echo ""
echo "🎯 VALIDATION POST-DÉPLOIEMENT"
echo "==============================="
echo "1. Application accessible sur http://flowcab.fr"
echo "2. Login sécurisé (pas de comptes test affichés)"
echo "3. Connexion Supabase fonctionnelle"
echo "4. PM2 status : pm2 list (sur le VPS)"

echo ""
echo "🛠️  DÉPANNAGE RAPIDE"
echo "==================="
echo ""
echo "❌ Erreur SSH :"
echo "   > Vérifier SSH_PRIVATE_KEY dans les secrets"
echo ""
echo "❌ Erreur Build :"
echo "   > Vérifier les secrets Supabase"
echo ""  
echo "❌ Application offline :"
echo "   > ssh root@69.62.108.105"
echo "   > pm2 logs taxi-manager"
echo "   > pm2 restart taxi-manager"

echo ""
echo "✅ Prêt pour le test de déploiement automatisé !"