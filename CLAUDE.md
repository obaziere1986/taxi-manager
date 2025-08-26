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
**Migration vers Supabase :**
- **PostgreSQL** hébergé sur Supabase (projet: pligynlgfmnequzijtqk)
- **API sécurisée** avec Row Level Security (RLS)
- **Client Supabase** : `/src/lib/supabase.ts`
- **Connection robuste** : `/src/lib/db.ts` migré vers Supabase
- **Plus de Prisma** : Toutes les requêtes via client Supabase

**🔧 Configuration Supabase :**
- **URL projet** : `https://pligynlgfmnequzijtqk.supabase.co`
- **Données réalistes** : 295 courses réparties sur 50 clients (~6 par client)
- **Période temporelle** : 6 mois (-3 mois à +3 mois)
- **Statuts cohérents** : Courses futures = EN_ATTENTE/ASSIGNEE/ANNULEE, Passées = TERMINEE/ANNULEE

## 🏗️ Architecture de l'Application

### Vue d'Ensemble
**Système de gestion de taxi en français** construit avec :
- **Next.js 15** (App Router) + TypeScript
- **Supabase** (PostgreSQL) + client Supabase
- **Tailwind CSS v4** + shadcn/ui
- **Recharts** pour les graphiques
- **@dnd-kit** pour le drag-and-drop

### Modèles de Données Principaux

**User** (remplace Chauffeur)
- `nom`, `prenom`, `email`, `telephone`, `role` (Admin | Planner | Chauffeur)
- `statut` : DISPONIBLE | OCCUPE | HORS_SERVICE
- `vehicule?`, `vehiculeId?` : Référence au véhicule assigné
- Relations: `courses[]`, `assignations[]`

**Client**
- `nom`, `prenom`, `telephone`, `email?`, `adresses?` (JSON array)
- Relations: `courses[]`, `avis[]`

**Vehicule**
- `marque`, `modele`, `immatriculation` (unique), `couleur?`, `annee?`
- `kilometrage?`, `carburant?` (ESSENCE | DIESEL | HYBRIDE | ELECTRIQUE)
- `prochaineVidange?`, `prochainEntretien?`, `prochainControleTechnique?`
- Relations: `users[]`, `assignations[]`

**VehiculeAssignation**
- `dateDebut`, `dateFin?`, `actif`, `notes?`
- Relations: `vehicule`, `user`

**Course**
- `origine`, `destination`, `dateHeure`, `prix?`, `notes?`
- `statut` : EN_ATTENTE | ASSIGNEE | EN_COURS | TERMINEE | ANNULEE
- Relations: `client`, `user?` (chauffeur assigné)

## 🎯 Fonctionnalités Principales

### 📊 Dashboard Avancé
- **KPIs en temps réel** : courses du jour, chauffeurs actifs, revenus
- **Graphiques interactifs** (Recharts) :
  - Timeline des courses (7 jours)
  - Performance des chauffeurs - **30 derniers jours uniquement**
  - Évolution des revenus (aires)
- **Top Chauffeurs** : Classement par courses terminées (sans revenus)
- **Historique courses** : Avec dates complètes (JJ/MM/AAAA à HH:MM)
- **Statistiques financières** avec taux de croissance

### 👥 Gestion des Clients
- **Répertoire alphabétique** avec séparateurs par lettre
- **Format "NOM, Prénom"** style Apple
- **Modal de détails** avec historique complet des courses
- **Statistiques client** : total courses, CA généré, taux d'annulation
- **CRUD complet** avec validation
- **Noms d'acteurs français** : Toutes générations confondues

### 🚗 Gestion des Utilisateurs (ex-Chauffeurs)
- **Système de rôles** : Admin, Planner, Chauffeur
- **Vue d'ensemble** avec statuts en temps réel
- **Métriques de performance** individuelles
- **CRUD complet** avec gestion des véhicules
- **Assignation véhicules** : Système complet avec historique

### 🚙 Gestion des Véhicules
- **CRUD complet** : Création, modification, suppression
- **Caractéristiques techniques** : Kilométrage, carburant, entretien
- **Assignations actives** : Suivi en temps réel
- **Historique assignations** : Avec notes et dates
- **Maintenance** : Dates de vidange, entretien, contrôle technique

### 📅 Planning Interactif
- **Interface drag-and-drop** pour assigner les courses
- **Navigation par date** avec localisation française
- **Colonnes par chauffeur** + colonne "non assignées"
- **Statuts visuels** avec codes couleur
- **Création de courses** depuis le planning
- **Courses sur 5 semaines** : 2 passées + 3 futures

## 🛠️ Structure du Code

### APIs
```
/api/clients/          # CRUD clients
/api/users/            # CRUD utilisateurs (ex-chauffeurs)
  └── [id]/           # Actions utilisateur individuel
/api/courses/          # CRUD courses
  └── [id]/assign/     # Assignation drag-and-drop
/api/vehicules/        # CRUD véhicules
  ├── [id]/           # Actions véhicule individuel
  ├── with-assignations/ # Véhicules avec assignations actives
  └── assignations/    # Gestion assignations véhicules
    ├── assign/       # Création assignation
    ├── robust/       # Récupération robuste
    └── [id]/         # Actions assignation individuelle
/api/analytics/        # APIs pour dashboard
  ├── courses-timeline/     # Données temporelles
  ├── chauffeur-performance/ # Métriques chauffeurs (30 jours)
  └── revenue-stats/         # Statistiques financières
```

### Composants
```
src/components/
├── ui/                    # shadcn/ui base components
│   ├── phone-input.tsx   # Composant téléphone français
│   └── vehicle-combobox.tsx # Sélecteur véhicule
├── dashboard/
│   ├── charts/           # Graphiques Recharts
│   │   ├── CoursesTimeline.tsx
│   │   ├── ChauffeurPerformance.tsx (30 jours)
│   │   └── RevenueChart.tsx
│   └── metrics/          # Métriques business
│       └── VehiculeAlerts.tsx
├── effectifs/            # Gestion utilisateurs et véhicules
│   ├── UserModal.tsx     # CRUD utilisateurs
│   ├── DeleteUserModal.tsx
│   ├── VehiculeAssignationModal.tsx
│   ├── ChauffeurModal.tsx
│   └── DeleteChauffeurModal.tsx
├── vehicules/            # Gestion véhicules
│   ├── VehiculeModal.tsx # CRUD véhicules complet
│   ├── VehicleAssignModal.tsx
│   └── DeleteVehiculeModal.tsx
└── planning/             # Composants drag-and-drop
    ├── CourseCard.tsx
    ├── ChauffeurColumn.tsx
    └── UnassignedColumn.tsx
```

### Base de Données
- **Connection Supabase** : `/src/lib/supabase.ts` avec client configuré
- **PostgreSQL** : Base hébergée avec Row Level Security
- **Migration complète** : Toutes les APIs utilisent Supabase
- **Seeding** avec noms d'acteurs français célèbres (toutes générations)
- **Données réalistes** : 10 utilisateurs, 10 véhicules, 50 clients, 295 courses (6 mois)

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
- **Dashboard complet** avec analytics et top chauffeurs (30 jours)
- **CRUD toutes entités** : Utilisateurs, clients, véhicules, courses
- **Système d'assignation** véhicules ↔ utilisateurs avec historique
- **Planning drag-and-drop** avec courses sur 5 semaines
- **Répertoire clients** avec historique et noms d'acteurs français
- **Page paramètres** complète pour gestion utilisateurs/véhicules
- **APIs robustes** avec retry automatique et gestion d'erreurs
- **Interface responsive** avec dates complètes partout

### 🔄 En Cours / À Améliorer  
- Quelques requêtes SQL à optimiser
- Tests automatisés à implémenter
- Mode production à configurer
- Optimisation des performances pour datasets plus larges

### 🎬 Spécificités Françaises
- **Noms d'acteurs français** : Plus de 140 noms d'acteurs célèbres
- **Toutes générations** : Des années 30 (Gabin, Signoret) aux stars actuelles (Sy, Exarchopoulos)
- **Diversité** : Acteurs d'origines diverses du cinéma français
- **Interface française** : Dates, heures, statuts, messages d'erreur

---

**Dernière mise à jour** : 13 août 2025  
**Stack** : Next.js 15 + TypeScript + SQLite + Tailwind + shadcn/ui + Recharts  
**Environnement** : Development avec pnpm + Node.js  
**Base de données** : SQLite avec seeding complet d'acteurs français