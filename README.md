# 🚕 Taxi Manager

**Système de gestion de taxi professionnel** développé avec Next.js 15, TypeScript et SQLite.

## ✨ Fonctionnalités

- 📊 **Dashboard analytics** avec graphiques interactifs
- 👥 **Gestion clients** avec répertoire alphabétique  
- 🚗 **Gestion chauffeurs** et métriques de performance
- 📅 **Planning drag-and-drop** pour assigner les courses
- 💰 **Suivi des revenus** et KPIs business
- 🇫🇷 **Interface entièrement en français**

## 🚀 Démarrage Rapide

```bash
# Installation des dépendances
pnpm install

# Configuration de la base de données
pnpm run db:reset

# Lancement du serveur de développement  
pnpm dev
```

Ouvrir [http://localhost:3000](http://localhost:3000) dans votre navigateur.

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
│   ├── components/          # Composants React
│   │   ├── ui/             # shadcn/ui components
│   │   ├── dashboard/      # Analytics & graphiques
│   │   └── planning/       # Drag-and-drop
│   └── lib/                # Utilitaires
├── prisma/                 # Schema & migrations
├── scripts/                # Scripts (seeding...)
└── docs/                   # Documentation
```

---

**Développé avec ❤️ en France**  
*Dernière mise à jour : 29 janvier 2025*
