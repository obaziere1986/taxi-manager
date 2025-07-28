# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development
- `npm run dev` - Start development server with Turbopack on http://localhost:3000
- `npm run build` - Build production application
- `npm run start` - Start production server
- `npm run lint` - Run ESLint on codebase

### Database Management
- `npx prisma db push` - Apply schema changes to SQLite database
- `npx prisma generate` - Generate Prisma client after schema changes
- `npx prisma studio` - Open Prisma Studio on http://localhost:5555
- `npx ts-node scripts/seed.ts` - Populate database with test data (10 chauffeurs, 50 clients, ~55 courses)

### Database Reset
When changing models or need fresh data:
```bash
rm prisma/dev.db
npx prisma db push
npx ts-node scripts/seed.ts
```

## Architecture Overview

### Application Structure
This is a **French-language taxi management system** built with Next.js 15, TypeScript, and SQLite. The application manages clients, chauffeurs (drivers), and courses (rides) with a drag-and-drop planning interface.

### Core Data Models
- **Client**: `nom`, `prenom`, `telephone`, `email`, `adresses` (JSON array)
- **Chauffeur**: `nom`, `prenom`, `telephone`, `vehicule`, `statut` (DISPONIBLE/OCCUPE/HORS_SERVICE)
- **Course**: `origine`, `destination`, `dateHeure`, `statut` (EN_ATTENTE/ASSIGNEE/EN_COURS/TERMINEE/ANNULEE), `prix`, `notes`

### Key Features
- **Dashboard**: Real-time statistics with day-over-day comparisons
- **CRUD Operations**: Full create/read/update/delete for all entities
- **Planning Interface**: Drag-and-drop course assignment using @dnd-kit
- **Date Navigation**: Filter courses by date with French localization

### Component Architecture
- **shadcn/ui**: Base UI components in `/src/components/ui/`
- **Feature Components**: Planning-specific components in `/src/components/planning/`
- **AppSidebar**: Collapsible navigation with French labels
- **Drag & Drop**: CourseCard (draggable), ChauffeurColumn/UnassignedColumn (droppable)

### API Structure
RESTful APIs follow pattern: `/api/{entity}` (GET/POST) and `/api/{entity}/[id]` (GET/PUT/DELETE)
Special endpoint: `/api/courses/[id]/assign` for drag-and-drop assignment

### Database Connection
- Prisma client singleton in `/src/lib/prisma.ts`
- SQLite database at `prisma/dev.db`
- French field names and enums throughout schema

### Development Patterns
- All UI text in French
- Client-side components with "use client" directive
- React Hook Form + Zod validation for forms
- date-fns with French locale for date handling
- Cursor pointer CSS applied globally to all buttons

### Styling
- Tailwind CSS v4 with custom CSS variables
- shadcn/ui color system with light/dark mode support
- Responsive grid layouts with mobile-first approach
- Status indicators with color coding (green/orange/red)

## Important Notes
- The application is fully localized in French - maintain this when adding features
- Drag-and-drop planning is the core feature - test thoroughly when modifying
- Form validation uses both frontend (Zod) and basic backend validation
- Dashboard statistics calculate from real data - no hardcoded values
- Database seeding script creates realistic French names and Parisian addresses