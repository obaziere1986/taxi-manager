import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const createPrismaClient = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    },
    // Configuration spécifique à SQLite pour améliorer la stabilité
    __internal: {
      engine: {
        enableEngineDebugMode: process.env.NODE_ENV === 'development'
      }
    }
  })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// Fonction pour vérifier et initialiser la base de données
export async function ensureDatabaseConnection() {
  try {
    // Test de connexion simple
    await prisma.$connect()
    
    // Vérification que les tables existent
    const tableCheck = await prisma.$queryRaw`SELECT name FROM sqlite_master WHERE type='table' AND name='Vehicule';`
    
    if (Array.isArray(tableCheck) && tableCheck.length === 0) {
      console.warn('🔄 Base de données vide détectée, initialisation requise...')
      throw new Error('DATABASE_EMPTY')
    }
    
    console.log('✅ Connexion à la base de données stable')
    return true
  } catch (error) {
    console.error('❌ Problème de connexion à la base de données:', error)
    
    if (error instanceof Error && error.message === 'DATABASE_EMPTY') {
      console.log('🔧 Tentative de réinitialisation automatique...')
      return false
    }
    
    // Tentative de reconnexion
    await prisma.$disconnect()
    await prisma.$connect()
    return false
  }
}

// Graceful shutdown amélioré
if (process.env.NODE_ENV !== 'production') {
  const cleanup = async () => {
    console.log('🔌 Fermeture des connexions à la base de données...')
    try {
      await prisma.$disconnect()
    } catch (error) {
      console.error('Erreur lors de la fermeture:', error)
    }
  }

  process.on('beforeExit', cleanup)
  process.on('SIGINT', cleanup)
  process.on('SIGTERM', cleanup)
}