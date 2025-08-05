# Taxi Manager - Guide de Développement

Ce fichier fournit une documentation complète pour Claude Code et les développeurs travaillant sur cette application de gestion de taxi.

## 🚀 Démarrage Rapide

Ce projet Next.js utilise **pnpm** comme gestionnaire de packages. Commandes de base :

```bash
pnpm dev          # Serveur de développement (http://localhost:3000)
pnpm build        # Build de production
pnpm start        # Serveur de production
pnpm lint         # Analyse ESLint
pnpm dev:restart  # Redémarrage forcé (kill port 3000)
```

### Base de Données
```bash
pnpm exec prisma db push      # Appliquer le schéma
pnpm exec prisma generate     # Générer le client Prisma
pnpm exec prisma studio       # Interface graphique (http://localhost:5555)
pnpm run db:seed              # Peupler avec des données de test
pnpm run db:reset             # Reset rapide + seeding
pnpm run db:reset-full        # Reset complet + seeding véhicules
pnpm run db:check             # Vérifier la stabilité de la DB
```

**🔧 Solution aux problèmes de stabilité SQLite :**
- **Chemin fixe** : `DATABASE_URL="file:prisma/dev.db"`
- **Connexion robuste** : Client Prisma avec retry automatique
- **Vérification automatique** : Fonction `ensureDatabaseConnection()`
- **Scripts de maintenance** : Reset complet et vérification de stabilité

## 🏗️ Architecture de l'Application

### Vue d'Ensemble
**Système de gestion de taxi en français** construit avec :
- **Next.js 15** (App Router) + TypeScript
- **SQLite** + Prisma ORM  
- **Tailwind CSS v4** + shadcn/ui
- **Recharts** pour les graphiques
- **@dnd-kit** pour le drag-and-drop

### Modèles de Données Principaux

**Client**
- `nom`, `prenom`, `telephone`, `email?`, `adresses?` (JSON array)
- Relations: `courses[]`

**Chauffeur** 
- `nom`, `prenom`, `telephone`, `vehicule`
- `statut` : DISPONIBLE | OCCUPE | HORS_SERVICE
- Relations: `courses[]`

**Course**
- `origine`, `destination`, `dateHeure`, `prix?`, `notes?`
- `statut` : EN_ATTENTE | ASSIGNEE | EN_COURS | TERMINEE | ANNULEE
- Relations: `client`, `chauffeur?`

## 🎯 Fonctionnalités Principales

### 📊 Dashboard Avancé
- **KPIs en temps réel** : courses du jour, chauffeurs actifs, revenus
- **Graphiques interactifs** (Recharts) :
  - Timeline des courses (7 jours)
  - Performance des chauffeurs (barres) 
  - Évolution des revenus (aires)
- **Classement chauffeurs** avec métriques détaillées
- **Statistiques financières** avec taux de croissance

### 👥 Gestion des Clients
- **Répertoire alphabétique** avec séparateurs par lettre
- **Format "NOM, Prénom"** style Apple
- **Modal de détails** avec historique complet des courses
- **Statistiques client** : total courses, CA généré, taux d'annulation
- **CRUD complet** avec validation

### 🚗 Gestion des Chauffeurs  
- **Vue d'ensemble** avec statuts en temps réel
- **Métriques de performance** individuelles
- **CRUD complet** avec gestion des véhicules

### 📅 Planning Interactif
- **Interface drag-and-drop** pour assigner les courses
- **Navigation par date** avec localisation française
- **Colonnes par chauffeur** + colonne "non assignées"
- **Statuts visuels** avec codes couleur
- **Création de courses** depuis le planning

## 🛠️ Structure du Code

### APIs
```
/api/clients/          # CRUD clients
/api/chauffeurs/       # CRUD chauffeurs  
/api/courses/          # CRUD courses
  └── [id]/assign/     # Assignation drag-and-drop
/api/analytics/        # APIs pour dashboard
  ├── courses-timeline/     # Données temporelles
  ├── chauffeur-performance/ # Métriques chauffeurs
  └── revenue-stats/         # Statistiques financières
```

### Composants
```
src/components/
├── ui/                    # shadcn/ui base components
├── dashboard/
│   ├── charts/           # Graphiques Recharts
│   │   ├── CoursesTimeline.tsx
│   │   ├── ChauffeurPerformance.tsx
│   │   └── RevenueChart.tsx
│   └── metrics/          # Métriques business
│       └── TopChauffeurs.tsx
└── planning/             # Composants drag-and-drop
    ├── CourseCard.tsx
    ├── ChauffeurColumn.tsx
    └── UnassignedColumn.tsx
```

### Base de Données
- **Connection robuste** : `/src/lib/db.ts` avec retry automatique
- **Client Prisma** : Pool de connexions avec reconnexion
- **SQLite** : `prisma/dev.db` (development)
- **Seeding** diversifié avec noms multiculturels

## 🎨 Interface Utilisateur

### Design System
- **Tailwind CSS v4** avec variables CSS custom
- **shadcn/ui** pour cohérence visuelle
- **Responsive design** mobile-first
- **Mode sombre** supporté

### Conventions UX
- **Texte entièrement en français**
- **Indicateurs de statut** colorés (vert/orange/rouge)
- **Feedback utilisateur** avec états de chargement
- **Navigation intuitive** avec sidebar collapsible

## 📈 Analytics & Métriques

### KPIs Trackés
- **Courses** : total, terminées, en attente, croissance
- **Revenus** : jour/semaine/mois, prix moyen, taux de croissance
- **Chauffeurs** : disponibilité, efficacité, temps de conduite
- **Clients** : fidélité, CA individuel, historique

### Visualisations
- **Timeline** : évolution sur 7 jours
- **Barres** : top chauffeurs par performance  
- **Aires** : tendances de revenus
- **Classements** : podium avec trophées

## 🔧 Patterns de Développement

### Gestion d'État
- **React Hooks** (useState, useEffect)
- **Pas de state management** global (simplicité)
- **Chargement asynchrone** avec états loading/error

### Validation
- **React Hook Form** + **Zod** côté client
- **Validation basique** côté serveur APIs
- **Messages d'erreur** en français

### Dates & Localisation
- **date-fns** avec locale française
- **Formatage cohérent** : dd/MM/yyyy, HH:mm
- **Navigation temporelle** dans planning

## ⚠️ Points d'Attention

### Stabilité
- **Prisma** : Utiliser `/src/lib/db.ts` avec retry automatique
- **Node.js v23** : Peut avoir des incompatibilités, préférer LTS
- **Hot reload** : Redémarrer serveur après modifications importantes

### Performance
- **SQLite** : Limites de concurrence, considérer PostgreSQL en production
- **Recharts** : Optimisé pour datasets < 1000 points
- **Images** : Pas d'optimisation Next.js actuellement

### Maintenance
- **Tests** : Pas encore implémentés
- **Logs** : Console uniquement en development  
- **Monitoring** : Basique, à améliorer pour production

## 📋 État Actuel

### ✅ Fonctionnel
- Dashboard complet avec analytics
- CRUD toutes entités
- Planning drag-and-drop  
- Répertoire clients avec historique
- APIs robustes avec retry
- Interface responsive

### 🔄 En Cours / À Améliorer  
- Quelques requêtes SQL à optimiser
- Gestion d'erreurs à harmoniser
- Tests automatisés à implémenter
- Mode production à configurer

---

**Dernière mise à jour** : 29 janvier 2025
**Stack** : Next.js 15 + TypeScript + SQLite + Tailwind + shadcn/ui + Recharts
**Environnement** : Development avec pnpm + Node.js