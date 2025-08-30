# 🚕 Taxi Manager

**Système de gestion de taxi professionnel** développé avec Next.js 15, TypeScript et Supabase PostgreSQL.

## ✨ Fonctionnalités

- 📊 **Dashboard analytics** avec graphiques interactifs et top chauffeurs
- 👥 **Gestion clients & utilisateurs** avec noms d'acteurs français célèbres
- 🚙 **Gestion véhicules** complète avec assignations et historique  
- 🔗 **Système d'assignation** véhicules ↔ utilisateurs en temps réel
- 📅 **Planning drag-and-drop** avec courses sur 6 mois
- ⚙️ **Page paramètres** pour gestion complète du parc et des effectifs
- 💰 **Suivi des revenus** et KPIs business (30 derniers jours)
- 🎬 **Noms d'acteurs français** de toutes générations pour plus d'authenticité
- 🇫🇷 **Interface entièrement en français** avec dates complètes
- 🔒 **Sécurité avancée** avec Row Level Security (RLS)

## 🚀 Démarrage Rapide

### Prérequis
- Node.js 18+ ou 20+
- pnpm (gestionnaire de packages)
- Compte Supabase

### Configuration

```bash
# Installation des dépendances
pnpm install

# Configuration des variables d'environnement
cp .env.example .env.local
# Complétez avec vos clés Supabase
```

Variables d'environnement requises dans `.env.local` :
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# NextAuth
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=http://localhost:3000
```

### Lancement

```bash
# Serveur de développement  
pnpm dev
```

Ouvrir [http://localhost:3000](http://localhost:3000) dans votre navigateur.

### 🎬 Données de démonstration
La base Supabase contient automatiquement :
- **10 utilisateurs** avec des noms d'acteurs français (Jean Dujardin, Marion Cotillard, etc.)
- **10 véhicules** avec assignations actives
- **50 clients** avec noms d'acteurs de toutes générations
- **295 courses réalistes** réparties sur 6 mois (3 passés + 3 futurs)

## 📚 Documentation

**🔗 Pour la documentation complète, voir [CLAUDE.md](./CLAUDE.md)**

Ce fichier contient :
- Architecture détaillée avec Supabase
- Guide des APIs et RLS
- Patterns de développement
- Commandes utiles
- Points d'attention

## 🛠️ Stack Technique

- **Framework** : Next.js 15 (App Router)
- **Language** : TypeScript
- **Base de données** : PostgreSQL via Supabase
- **ORM/Client** : Client Supabase officiel
- **Sécurité** : Row Level Security (RLS)
- **Auth** : NextAuth.js + Supabase Adapter
- **UI** : Tailwind CSS v4 + shadcn/ui
- **Graphiques** : Recharts
- **Drag & Drop** : @dnd-kit
- **Package Manager** : pnpm

## 📋 Scripts Disponibles

```bash
pnpm dev          # Serveur de développement
pnpm build        # Build de production  
pnpm start        # Serveur de production
pnpm lint         # Analyse ESLint
pnpm dev:restart  # Redémarrage forcé

# Supabase
pnpm supabase:types  # Génération des types TypeScript
pnpm supabase:reset  # Reset via interface Supabase
pnpm supabase:seed   # Seeding via interface Supabase
```

## 🏗️ Structure du Projet

```
taxi-manager/
├── src/
│   ├── app/                 # Pages Next.js (App Router)
│   │   ├── api/            # APIs REST sécurisées (clients, users, véhicules, courses)
│   │   ├── parametres/     # Page gestion utilisateurs/véhicules
│   │   └── [pages]/        # Dashboard, planning, clients, courses
│   ├── components/          # Composants React
│   │   ├── ui/             # shadcn/ui + composants custom
│   │   ├── dashboard/      # Analytics & graphiques (30 jours)
│   │   ├── effectifs/      # Gestion utilisateurs/assignations
│   │   ├── vehicules/      # Gestion véhicules complet
│   │   └── planning/       # Drag-and-drop sur 6 mois
│   └── lib/                # Utilitaires + client Supabase
└── [docs]/                 # Documentation (CLAUDE.md, README.md)
```

## 🔒 Sécurité et Authentification

### Row Level Security (RLS)
Toutes les tables sont protégées par des politiques RLS :
- **Users** : Accès selon les rôles (Admin, Planner, Chauffeur)
- **Courses** : Visibilité selon les permissions utilisateur
- **Clients/Véhicules** : Accès contrôlé par organisation

### Rôles utilisateur
- **Admin** : Accès complet à toutes les fonctionnalités
- **Planner** : Gestion du planning et assignations
- **Chauffeur** : Vue limitée aux courses assignées

## 🎭 Spécificités Françaises

- **Plus de 140 noms d'acteurs** français de toutes générations
- **Légendes** : Gabin, Belmondo, Deneuve, Bardot, Moreau...
- **Génération moderne** : Dujardin, Cotillard, Sy, Exarchopoulos...
- **Diversité** : Acteurs d'origines diverses du cinéma français
- **Interface** : Dates françaises, statuts, messages en français

## 🚨 Production & Déploiement

### Configuration GitHub Actions
Le projet utilise GitHub Actions pour le déploiement automatique sur VPS.

**Secrets GitHub requis** (Settings > Secrets and Variables > Actions) :
- `SSH_PRIVATE_KEY` : Clé privée SSH pour connexion VPS
- `NEXTAUTH_SECRET` : Secret NextAuth généré
- `NEXT_PUBLIC_SUPABASE_URL` : URL du projet Supabase
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` : Clé anonyme Supabase
- `SUPABASE_SERVICE_ROLE_KEY` : Clé service Supabase

**Workflow automatisé** :
- Déclenchement sur push `main` ou manuel
- Build sécurisé avec variables d'environnement
- Déploiement zéro-downtime avec backup automatique
- Test post-déploiement automatique
- Rollback en cas d'échec

**Surveillance** :
- Logs détaillés dans Actions tab
- Test de santé : `curl -f -L -I https://app.flowcab.fr`

## 🔧 Développement

### Tests
```bash
# Tests à implémenter
pnpm test
```

### Debugging
- Logs Supabase dans le dashboard
- Console développeur pour les erreurs client
- Variables d'environnement pour les APIs

---

**Développé avec ❤️ en France** 🇫🇷  
*Dernière mise à jour : 26 août 2025 - Version Supabase PostgreSQL*# Déploiement production - sam. 30 août 2025 21:17:42 CEST
