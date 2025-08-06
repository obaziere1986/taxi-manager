import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'

const DB_PATH = path.join(process.cwd(), 'prisma', 'prisma', 'dev.db')

async function resetDatabase() {
  console.log('🔄 Réinitialisation complète de la base de données...')
  
  try {
    // 1. Supprimer le fichier de base de données s'il existe
    if (fs.existsSync(DB_PATH)) {
      console.log('🗑️  Suppression de l\'ancienne base de données...')
      fs.unlinkSync(DB_PATH)
    }
    
    // 2. Pousser le schéma pour créer les tables
    console.log('📋 Création des tables...')
    execSync('pnpm exec prisma db push', { stdio: 'inherit' })
    
    // 3. Générer le client Prisma
    console.log('⚙️  Génération du client Prisma...')
    execSync('pnpm exec prisma generate', { stdio: 'inherit' })
    
    // 4. Exécuter le seeding principal
    console.log('🌱 Seeding des données de base...')
    execSync('pnpm run db:seed', { stdio: 'inherit' })
    
    // 5. Exécuter le seeding des véhicules
    console.log('🚗 Seeding des véhicules...')
    execSync('pnpm exec ts-node scripts/seed-vehicles.ts', { stdio: 'inherit' })
    
    // 6. Vérifier la taille du fichier de base de données
    if (fs.existsSync(DB_PATH)) {
      const stats = fs.statSync(DB_PATH)
      console.log(`📊 Taille de la base de données: ${(stats.size / 1024).toFixed(2)} KB`)
      
      if (stats.size === 0) {
        throw new Error('La base de données est encore vide après l\'initialisation')
      }
    } else {
      console.warn('⚠️  Fichier de base de données non trouvé après l\'initialisation')
    }
    
    console.log('✅ Base de données réinitialisée avec succès!')
    console.log('🎯 Prêt pour le développement!')
    
  } catch (error) {
    console.error('❌ Erreur lors de la réinitialisation:', error)
    process.exit(1)
  }
}

// Exécuter le script
resetDatabase()