import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔍 Vérification des assignations...')

  try {
    // Compter les assignations
    const count = await prisma.vehiculeAssignation.count()
    console.log(`📊 Nombre total d'assignations: ${count}`)

    // Récupérer les assignations sans include
    const assignationsBasic = await prisma.vehiculeAssignation.findMany({
      take: 5
    })
    console.log('\n📋 Assignations basiques:')
    assignationsBasic.forEach(a => {
      console.log(`  - ${a.id}: vehicule=${a.vehiculeId}, chauffeur=${a.chauffeurId}, user=${a.userId}, actif=${a.actif}`)
    })

    // Essayer avec include
    console.log('\n🔗 Test avec relations...')
    const assignationsWithRelations = await prisma.vehiculeAssignation.findMany({
      take: 3,
      include: {
        vehicule: {
          select: {
            marque: true,
            modele: true
          }
        },
        chauffeur: {
          select: {
            nom: true,
            prenom: true
          }
        },
        user: {
          select: {
            nom: true,
            prenom: true,
            role: true
          }
        }
      }
    })
    
    console.log('✅ Relations récupérées avec succès:')
    assignationsWithRelations.forEach(a => {
      const person = a.chauffeur ? 
        `${a.chauffeur.nom} ${a.chauffeur.prenom} (Chauffeur)` : 
        `${a.user?.nom} ${a.user?.prenom} (${a.user?.role})`
      console.log(`  - ${a.vehicule.marque} ${a.vehicule.modele} → ${person}`)
    })

  } catch (error) {
    console.error('❌ Erreur:', error)
  }
}

main()
  .catch((e) => {
    console.error('❌ Erreur fatale:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })