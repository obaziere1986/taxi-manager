import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Configuration Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Instance du client Supabase
let supabaseInstance: SupabaseClient | null = null
let connectionAttempts = 0
const MAX_RETRIES = 3

export function getSupabaseClient(): SupabaseClient {
  if (!supabaseInstance) {
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Les variables d\'environnement Supabase ne sont pas configurées')
    }
    
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false // Désactiver la persistence des sessions côté serveur
      }
    })
  }
  
  return supabaseInstance
}

// Fonction utilitaire pour exécuter des opérations avec retry automatique
export async function executeWithRetry<T>(
  operation: (supabase: SupabaseClient) => Promise<T>,
  retries = MAX_RETRIES
): Promise<T> {
  try {
    const supabase = getSupabaseClient()
    const result = await operation(supabase)
    connectionAttempts = 0 // Reset sur succès
    return result
  } catch (error) {
    connectionAttempts++
    
    if (retries > 0 && connectionAttempts <= MAX_RETRIES) {
      console.warn(`Erreur Supabase, tentative ${connectionAttempts}/${MAX_RETRIES}:`, error)
      
      // Recréer l'instance en cas d'erreur de connexion
      supabaseInstance = null
      
      // Attendre un peu avant retry
      await new Promise(resolve => setTimeout(resolve, 1000 * connectionAttempts))
      
      return executeWithRetry(operation, retries - 1)
    }
    
    throw error
  }
}

// Types pour les entités de base de données
export interface DatabaseClient {
  id: string
  nom: string
  prenom: string
  telephone: string
  email?: string
  adresses?: any[] // JSON
  created_at: string
  updated_at: string
}

export interface DatabaseUser {
  id: string
  nom: string
  prenom: string
  email: string
  telephone: string
  role: 'Admin' | 'Planner' | 'Chauffeur'
  statut?: 'DISPONIBLE' | 'OCCUPE' | 'HORS_SERVICE'
  actif: boolean
  login?: string
  password_hash?: string
  last_login_at?: string
  failed_logins: number
  locked_until?: string
  notifications_email: boolean
  notifications_sms: boolean
  notifications_desktop: boolean
  avatar_url?: string
  vehicule?: string
  vehicule_id?: string
  created_at: string
  updated_at: string
}

export interface DatabaseCourse {
  id: string
  origine: string
  destination: string
  date_heure: string
  statut: 'EN_ATTENTE' | 'ASSIGNEE' | 'EN_COURS' | 'TERMINEE' | 'ANNULEE'
  notes?: string
  client_id: string
  user_id?: string
  created_at: string
  updated_at: string
}

export interface DatabaseVehicule {
  id: string
  marque: string
  modele: string
  immatriculation: string
  couleur?: string
  annee?: number
  actif: boolean
  kilometrage?: number
  carburant?: string
  prochaine_vidange?: string
  prochain_entretien?: string
  prochain_controle_technique?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface DatabaseVehiculeAssignation {
  id: string
  date_debut: string
  date_fin?: string
  actif: boolean
  notes?: string
  vehicule_id: string
  user_id?: string
  created_at: string
  updated_at: string
}

export interface DatabaseAvisClient {
  id: string
  note: number
  commentaire?: string
  course_id: string
  client_id: string
  created_at: string
  updated_at: string
}

export interface DatabaseParametre {
  id: string
  cle: string
  valeur: string
  type: string
  description?: string
  created_at: string
  updated_at: string
}

export interface DatabasePermission {
  id: string
  nom: string
  description?: string
  module: string
  action: string
  created_at: string
}

export interface DatabaseRolePermission {
  id: string
  role: 'Admin' | 'Planner' | 'Chauffeur'
  permission_id: string
  active: boolean
  created_at: string
  updated_at: string
}

// Type pour la base de données complète
export interface Database {
  public: {
    Tables: {
      clients: {
        Row: DatabaseClient
        Insert: Omit<DatabaseClient, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<DatabaseClient, 'id' | 'created_at'>>
      }
      users: {
        Row: DatabaseUser
        Insert: Omit<DatabaseUser, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<DatabaseUser, 'id' | 'created_at'>>
      }
      courses: {
        Row: DatabaseCourse
        Insert: Omit<DatabaseCourse, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<DatabaseCourse, 'id' | 'created_at'>>
      }
      vehicules: {
        Row: DatabaseVehicule
        Insert: Omit<DatabaseVehicule, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<DatabaseVehicule, 'id' | 'created_at'>>
      }
      vehicule_assignations: {
        Row: DatabaseVehiculeAssignation
        Insert: Omit<DatabaseVehiculeAssignation, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<DatabaseVehiculeAssignation, 'id' | 'created_at'>>
      }
      avis_clients: {
        Row: DatabaseAvisClient
        Insert: Omit<DatabaseAvisClient, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<DatabaseAvisClient, 'id' | 'created_at'>>
      }
      parametres: {
        Row: DatabaseParametre
        Insert: Omit<DatabaseParametre, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<DatabaseParametre, 'id' | 'created_at'>>
      }
      permissions: {
        Row: DatabasePermission
        Insert: Omit<DatabasePermission, 'id' | 'created_at'>
        Update: Partial<Omit<DatabasePermission, 'id' | 'created_at'>>
      }
      role_permissions: {
        Row: DatabaseRolePermission
        Insert: Omit<DatabaseRolePermission, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<DatabaseRolePermission, 'id' | 'created_at'>>
      }
    }
  }
}

// Export du client typé
export const supabase = getSupabaseClient() as SupabaseClient<Database>