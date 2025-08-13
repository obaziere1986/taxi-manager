# 🚕 Taxi Manager

**Système de gestion de taxi professionnel** développé avec Next.js 15, TypeScript et SQLite.

## ✨ Fonctionnalités

- 📊 **Dashboard analytics** avec graphiques interactifs et top chauffeurs
- 👥 **Gestion clients & utilisateurs** avec noms d'acteurs français célèbres
- 🚙 **Gestion véhicules** complète avec assignations et historique  
- 🔗 **Système d'assignation** véhicules ↔ utilisateurs en temps réel
- 📅 **Planning drag-and-drop** avec courses sur 5 semaines
- ⚙️ **Page paramètres** pour gestion complète du parc et des effectifs
- 💰 **Suivi des revenus** et KPIs business (30 derniers jours)
- 🎬 **Noms d'acteurs français** de toutes générations pour plus d'authenticité
- 🇫🇷 **Interface entièrement en français** avec dates complètes

## 🚀 Démarrage Rapide

```bash
# Installation des dépendances
pnpm install

# Configuration de la base de données
pnpm exec prisma db push
pnpm run db:seed

# Lancement du serveur de développement  
pnpm dev
```

Ouvrir [http://localhost:3000](http://localhost:3000) dans votre navigateur.

### 🎬 Données de démonstration
Le script de seeding génère automatiquement :
- **10 utilisateurs** avec des noms d'acteurs français (Jean Dujardin, Marion Cotillard, etc.)
- **10 véhicules** avec 8 assignations actives
- **50 clients** avec noms d'acteurs de toutes générations
- **~550 courses** réparties sur 5 semaines (2 passées + 3 futures)

## 📚 Documentation

**🔗 Pour la documentation complète, voir [CLAUDE.md](./CLAUDE.md)**

Ce fichier contient :
- Architecture détaillée
- Guide des APIs
- Patterns de développement
- Commandes utiles
- Points d'attention

## 🛠️ Stack Technique

- **Framework** : Next.js 15 (App Router)
- **Language** : TypeScript
- **Base de données** : SQLite + Prisma ORM
- **UI** : Tailwind CSS + shadcn/ui
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

# Base de données
pnpm run db:seed  # Données de test
pnpm run db:reset # Reset + seeding
```

## 🏗️ Structure du Projet

```
taxi-manager/
├── src/
│   ├── app/                 # Pages Next.js (App Router)
│   │   ├── api/            # APIs REST (clients, users, véhicules, courses)
│   │   ├── parametres/     # Page gestion utilisateurs/véhicules
│   │   └── [pages]/        # Dashboard, planning, clients, courses
│   ├── components/          # Composants React
│   │   ├── ui/             # shadcn/ui + composants custom
│   │   ├── dashboard/      # Analytics & graphiques (30 jours)
│   │   ├── effectifs/      # Gestion utilisateurs/assignations
│   │   ├── vehicules/      # Gestion véhicules complet
│   │   └── planning/       # Drag-and-drop sur 5 semaines
│   └── lib/                # Utilitaires + connexion DB robuste
├── prisma/                 # Schema & base SQLite
├── scripts/                # Seeding avec acteurs français
└── [docs]/                 # Documentation (CLAUDE.md, README.md)
```

## 🎭 Spécificités Françaises

- **Plus de 140 noms d'acteurs** français de toutes générations
- **Légendes** : Gabin, Belmondo, Deneuve, Bardot, Moreau...
- **Génération moderne** : Dujardin, Cotillard, Sy, Exarchopoulos...
- **Diversité** : Acteurs d'origines diverses du cinéma français
- **Interface** : Dates françaises, statuts, messages en français

---

**Développé avec ❤️ en France** 🇫🇷  
*Dernière mise à jour : 13 août 2025 - Version avec acteurs français*
