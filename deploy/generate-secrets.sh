#!/bin/bash

# ===============================
# GÉNÉRATEUR DE SECRETS SÉCURISÉS
# ===============================

echo "🔐 Génération de secrets sécurisés pour Taxi Manager"
echo "=================================================="

# Fonction pour générer un secret aléatoire
generate_secret() {
    openssl rand -base64 32 | tr -d "=+/" | cut -c1-32
}

# Génération des secrets
NEXTAUTH_SECRET=$(generate_secret)
SMTP_PASSWORD=$(generate_secret | cut -c1-16)  # Plus court pour SMTP

echo ""
echo "🔑 SECRETS GÉNÉRÉS :"
echo "==================="
echo ""
echo "NEXTAUTH_SECRET=\"$NEXTAUTH_SECRET\""
echo ""
echo "🔧 CONFIGURATION SMTP RECOMMANDÉE :"
echo "===================================="
echo "SMTP_HOST=\"smtp.titan.email\""
echo "SMTP_PORT=465"
echo "SMTP_USER=\"admin@flowcab.fr\""
echo "SMTP_PASS=\"[votre-mot-de-passe-email-hostinger]\""
echo ""
echo "📧 CONFIGURATION EMAIL :"
echo "========================"
echo "MAIL_FROM_NAME=\"Taxi Manager\""
echo "MAIL_SUPPORT_EMAIL=\"admin@flowcab.fr\""
echo ""
echo "⚠️  IMPORTANT :"
echo "- Sauvegardez ces secrets dans un endroit sûr"
echo "- Ne les committez JAMAIS dans Git"
echo "- Utilisez ces valeurs dans vos variables d'environnement"
echo "- Configurez votre email Hostinger dans le cPanel"
echo ""
echo "🚀 Prêt pour la configuration de production !"