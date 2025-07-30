import { PrismaClient } from '@prisma/client'

// Pool de connexions pour éviter les conflits
let prismaInstance: PrismaClient | null = null
let connectionAttempts = 0
const MAX_RETRIES = 3

export async function getPrismaClient(): Promise<PrismaClient> {
  if (prismaInstance && connectionAttempts < MAX_RETRIES) {
    try {
      // Test rapide de la connexion
      await prismaInstance.$queryRaw`SELECT 1`
      return prismaInstance
    } catch {
      // Connexion morte, on la ferme
      await prismaInstance.$disconnect().catch(() => {})
      prismaInstance = null
    }
  }

  // Créer une nouvelle connexion
  if (!prismaInstance) {
    prismaInstance = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['error'] : [],
      datasources: {
        db: {
          url: process.env.DATABASE_URL
        }
      }
    })
    connectionAttempts = 0
  }

  return prismaInstance
}

export async function executeWithRetry<T>(
  operation: (prisma: PrismaClient) => Promise<T>,
  retries = MAX_RETRIES
): Promise<T> {
  try {
    const prisma = await getPrismaClient()
    const result = await operation(prisma)
    connectionAttempts = 0 // Reset sur succès
    return result
  } catch (error) {
    connectionAttempts++
    
    if (retries > 0 && connectionAttempts <= MAX_RETRIES) {
      console.warn(`Erreur DB, tentative ${connectionAttempts}/${MAX_RETRIES}:`, error)
      
      // Forcer la reconnexion
      if (prismaInstance) {
        await prismaInstance.$disconnect().catch(() => {})
        prismaInstance = null
      }
      
      // Attendre un peu avant retry
      await new Promise(resolve => setTimeout(resolve, 1000 * connectionAttempts))
      
      return executeWithRetry(operation, retries - 1)
    }
    
    throw error
  }
}

// Cleanup lors du shutdown
if (typeof window === 'undefined') {
  process.on('beforeExit', async () => {
    if (prismaInstance) {
      await prismaInstance.$disconnect().catch(() => {})
      prismaInstance = null
    }
  })
  
  process.on('SIGINT', async () => {
    if (prismaInstance) {
      await prismaInstance.$disconnect().catch(() => {})
      prismaInstance = null
    }
    process.exit(0)
  })
  
  process.on('SIGTERM', async () => {
    if (prismaInstance) {
      await prismaInstance.$disconnect().catch(() => {})
      prismaInstance = null
    }
    process.exit(0)
  })
}