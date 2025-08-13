import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkDatabase() {
  console.log('🔍 Vérification de la stabilité de la base de données...')
  
  try {
    // Test de connexion basique
    await prisma.$connect()
    console.log('✅ Connexion établie')
    
    // Compter les enregistrements dans chaque table
    const counts = await Promise.all([
      prisma.vehicule.count(),
      prisma.client.count(),
      prisma.course.count(),
      prisma.vehiculeAssignation.count(),
      prisma.user.count()
    ])
    
    console.log('📊 Données dans la base :')
    console.log(`   - Véhicules: ${counts[0]}`)
    console.log(`   - Clients: ${counts[1]}`)
    console.log(`   - Courses: ${counts[2]}`)
    console.log(`   - Assignations: ${counts[3]}`)
    console.log(`   - Utilisateurs: ${counts[4]}`)
    
    // Test de requête complexe
    const vehiculesAvecAlertes = await prisma.vehicule.findMany({
      where: {
        OR: [
          { prochaineVidange: { not: null } },
          { prochainEntretien: { not: null } },
          { prochainControleTechnique: { not: null } }
        ]
      },
      include: {
        users: true
      }
    })
    
    console.log(`🚗 Véhicules avec alertes: ${vehiculesAvecAlertes.length}`)
    
    console.log('✅ Base de données stable et fonctionnelle!')
    
  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

checkDatabase()