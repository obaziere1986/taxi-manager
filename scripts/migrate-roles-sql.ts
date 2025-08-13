import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function migrateRolesSql() {
  console.log('🔄 Migration des rôles via SQL...')

  try {
    // Mise à jour directe SQL des rôles
    console.log('📝 Mise à jour ADMIN → Admin')
    await prisma.$executeRaw`UPDATE User SET role = 'Admin' WHERE role = 'ADMIN'`

    console.log('📝 Mise à jour PLANNEUR → Planner')  
    await prisma.$executeRaw`UPDATE User SET role = 'Planner' WHERE role = 'PLANNEUR'`

    console.log('📝 Mise à jour CHAUFFEUR → Chauffeur')
    await prisma.$executeRaw`UPDATE User SET role = 'Chauffeur' WHERE role = 'CHAUFFEUR'`

    // Ajouter un statut par défaut aux chauffeurs
    console.log('📝 Ajout statut DISPONIBLE pour les chauffeurs')
    await prisma.$executeRaw`UPDATE User SET statut = 'DISPONIBLE' WHERE role = 'Chauffeur' AND statut IS NULL`

    console.log('✅ Migration SQL terminée')

    // Vérification
    const users = await prisma.user.findMany({
      orderBy: [{ role: 'asc' }, { nom: 'asc' }]
    })

    console.log('\n📋 État des utilisateurs après migration:')
    users.forEach(user => {
      const status = user.statut ? ` (${user.statut})` : ''
      console.log(`   ${user.role}: ${user.nom.toUpperCase()}, ${user.prenom}${status}`)
    })

  } catch (error) {
    console.error('❌ Erreur lors de la migration SQL:', error)
  } finally {
    await prisma.$disconnect()
  }
}

migrateRolesSql().catch(console.error)