// Types métier pour l'application Taxi Manager

export type RoleUtilisateur = 'Admin' | 'Planner' | 'Chauffeur'

export type StatutUtilisateur = 'DISPONIBLE' | 'OCCUPE' | 'HORS_SERVICE'

export type StatutCourse = 'EN_ATTENTE' | 'ASSIGNEE' | 'EN_COURS' | 'TERMINEE' | 'ANNULEE'

export type TypeCarburant = 'ESSENCE' | 'DIESEL' | 'HYBRIDE' | 'ELECTRIQUE'

// Types pour les données de base
export interface User {
  id: string
  nom: string
  prenom: string
  email: string
  telephone?: string
  role: RoleUtilisateur
  statut: StatutUtilisateur
  actif: boolean
  vehiculeId?: string
  avatar_url?: string
  created_at?: string
  updated_at?: string
}

export interface Client {
  id: string
  nom: string
  prenom: string
  telephone: string
  email?: string
  adresses?: string[]
  created_at?: string
  updated_at?: string
}

export interface Vehicule {
  id: string
  marque: string
  modele: string
  immatriculation: string
  couleur?: string
  annee?: number
  kilometrage?: number
  carburant?: TypeCarburant
  prochaineVidange?: string
  prochainEntretien?: string
  prochainControleTechnique?: string
  created_at?: string
  updated_at?: string
}

export interface Course {
  id: string
  origine: string
  destination: string
  dateHeure: string
  prix?: number
  notes?: string
  statut: StatutCourse
  clientId: string
  userId?: string
  created_at?: string
  updated_at?: string
  client?: Client
  user?: User
}

export interface VehiculeAssignation {
  id: string
  vehiculeId: string
  userId: string
  dateDebut: string
  dateFin?: string
  actif: boolean
  notes?: string
  created_at?: string
  updated_at?: string
  vehicule?: Vehicule
  user?: User
}