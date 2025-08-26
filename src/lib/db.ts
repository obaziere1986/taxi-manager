import { SupabaseClient } from '@supabase/supabase-js'
import { getSupabaseClient, executeWithRetry as supabaseExecuteWithRetry } from './supabase'

// Adapter les types Prisma vers Supabase pour maintenir la compatibilité
export interface SupabaseAdapter {
  client: {
    findMany: (args?: any) => Promise<any[]>
    findUnique: (args?: any) => Promise<any | null>
    findFirst: (args?: any) => Promise<any | null>
    create: (args?: any) => Promise<any>
    update: (args?: any) => Promise<any>
    delete: (args?: any) => Promise<any>
    count: (args?: any) => Promise<number>
  }
  user: {
    findMany: (args?: any) => Promise<any[]>
    findUnique: (args?: any) => Promise<any | null>
    findFirst: (args?: any) => Promise<any | null>
    create: (args?: any) => Promise<any>
    update: (args?: any) => Promise<any>
    delete: (args?: any) => Promise<any>
    count: (args?: any) => Promise<number>
  }
  course: {
    findMany: (args?: any) => Promise<any[]>
    findUnique: (args?: any) => Promise<any | null>
    findFirst: (args?: any) => Promise<any | null>
    create: (args?: any) => Promise<any>
    update: (args?: any) => Promise<any>
    delete: (args?: any) => Promise<any>
    count: (args?: any) => Promise<number>
  }
  vehicule: {
    findMany: (args?: any) => Promise<any[]>
    findUnique: (args?: any) => Promise<any | null>
    findFirst: (args?: any) => Promise<any | null>
    create: (args?: any) => Promise<any>
    update: (args?: any) => Promise<any>
    delete: (args?: any) => Promise<any>
    count: (args?: any) => Promise<number>
  }
  vehiculeAssignation: {
    findMany: (args?: any) => Promise<any[]>
    findUnique: (args?: any) => Promise<any | null>
    findFirst: (args?: any) => Promise<any | null>
    create: (args?: any) => Promise<any>
    update: (args?: any) => Promise<any>
    delete: (args?: any) => Promise<any>
    count: (args?: any) => Promise<number>
  }
  avisClient: {
    findMany: (args?: any) => Promise<any[]>
    findUnique: (args?: any) => Promise<any | null>
    findFirst: (args?: any) => Promise<any | null>
    create: (args?: any) => Promise<any>
    update: (args?: any) => Promise<any>
    delete: (args?: any) => Promise<any>
    count: (args?: any) => Promise<number>
  }
  parametre: {
    findMany: (args?: any) => Promise<any[]>
    findUnique: (args?: any) => Promise<any | null>
    findFirst: (args?: any) => Promise<any | null>
    create: (args?: any) => Promise<any>
    update: (args?: any) => Promise<any>
    delete: (args?: any) => Promise<any>
    count: (args?: any) => Promise<number>
  }
  permission: {
    findMany: (args?: any) => Promise<any[]>
    findUnique: (args?: any) => Promise<any | null>
    findFirst: (args?: any) => Promise<any | null>
    create: (args?: any) => Promise<any>
    update: (args?: any) => Promise<any>
    delete: (args?: any) => Promise<any>
    count: (args?: any) => Promise<number>
  }
  rolePermission: {
    findMany: (args?: any) => Promise<any[]>
    findUnique: (args?: any) => Promise<any | null>
    findFirst: (args?: any) => Promise<any | null>
    create: (args?: any) => Promise<any>
    update: (args?: any) => Promise<any>
    delete: (args?: any) => Promise<any>
    count: (args?: any) => Promise<number>
  }
  $queryRaw: (query: any) => Promise<any>
  $disconnect: () => Promise<void>
}

let adapterInstance: SupabaseAdapter | null = null

// Fonction helper pour créer les opérations CRUD génériques
function createCRUDOperations(tableName: string, supabase: SupabaseClient): any {
  return {
    async findMany(args: any = {}) {
      let query = supabase.from(tableName).select('*')
      
      // Gérer les filtres where
      if (args.where) {
        Object.entries(args.where).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            query = query.eq(key, value)
          }
        })
      }
      
      // Gérer l'ordre
      if (args.orderBy) {
        if (Array.isArray(args.orderBy)) {
          args.orderBy.forEach((order: any) => {
            Object.entries(order).forEach(([key, direction]) => {
              query = query.order(key, { ascending: direction === 'asc' })
            })
          })
        } else {
          Object.entries(args.orderBy).forEach(([key, direction]) => {
            query = query.order(key, { ascending: direction === 'asc' })
          })
        }
      }
      
      // Gérer les includes (joins) - pour l'instant basique
      if (args.include) {
        // Pour les includes complexes, nous devrons faire des requêtes séparées
        // ou utiliser des vues/fonctions SQL personnalisées
      }
      
      const { data, error } = await query
      if (error) throw error
      return data || []
    },

    async findUnique(args: any) {
      const { where } = args
      let query = supabase.from(tableName).select('*')
      
      Object.entries(where).forEach(([key, value]) => {
        query = query.eq(key, value)
      })
      
      const { data, error } = await query.single()
      if (error && error.code !== 'PGRST116') throw error // PGRST116 = not found
      return data
    },

    async findFirst(args: any) {
      const result = await this.findMany({ ...args, take: 1 })
      return result[0] || null
    },

    async create(args: any) {
      const { data: insertData } = args
      const { data, error } = await supabase
        .from(tableName)
        .insert(insertData)
        .select()
        .single()
      
      if (error) throw error
      return data
    },

    async update(args: any) {
      const { where, data: updateData } = args
      let query = supabase.from(tableName).update(updateData)
      
      Object.entries(where).forEach(([key, value]) => {
        query = query.eq(key, value)
      })
      
      const { data, error } = await query.select().single()
      if (error) throw error
      return data
    },

    async delete(args: any) {
      const { where } = args
      let query = supabase.from(tableName).delete()
      
      Object.entries(where).forEach(([key, value]) => {
        query = query.eq(key, value)
      })
      
      const { data, error } = await query.select().single()
      if (error) throw error
      return data
    },

    async count(args: any = {}) {
      let query = supabase.from(tableName).select('*', { count: 'exact', head: true })
      
      if (args.where) {
        Object.entries(args.where).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            query = query.eq(key, value)
          }
        })
      }
      
      const { count, error } = await query
      if (error) throw error
      return count || 0
    }
  }
}

export async function getPrismaClient(): Promise<SupabaseAdapter> {
  if (!adapterInstance) {
    const supabase = getSupabaseClient()
    
    adapterInstance = {
      client: createCRUDOperations('clients', supabase),
      user: createCRUDOperations('users', supabase),
      course: createCRUDOperations('courses', supabase),
      vehicule: createCRUDOperations('vehicules', supabase),
      vehiculeAssignation: createCRUDOperations('vehicule_assignations', supabase),
      avisClient: createCRUDOperations('avis_clients', supabase),
      parametre: createCRUDOperations('parametres', supabase),
      permission: createCRUDOperations('permissions', supabase),
      rolePermission: createCRUDOperations('role_permissions', supabase),
      
      async $queryRaw(query: any) {
        // Pour les requêtes SQL brutes, utiliser rpc() ou sql direct
        const { data, error } = await supabase.rpc('execute_sql', { query: query.strings[0] })
        if (error) throw error
        return data
      },
      
      async $disconnect() {
        // Supabase ne nécessite pas de déconnexion explicite
        return Promise.resolve()
      }
    }
  }
  
  return adapterInstance
}

export async function executeWithRetry<T>(
  operation: (adapter: SupabaseAdapter) => Promise<T>,
  retries = 3
): Promise<T> {
  return supabaseExecuteWithRetry(async (supabase) => {
    const adapter = await getPrismaClient()
    return operation(adapter)
  }, retries)
}