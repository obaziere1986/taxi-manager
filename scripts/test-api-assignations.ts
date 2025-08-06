import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testAPI() {
  console.log('🧪 Test de l\'API des assignations...')

  try {
    // Reproduire exactement la requête de l'API
    const assignations = await prisma.vehiculeAssignation.findMany({
      include: {
        vehicule: {
          select: {
            id: true,
            marque: true,
            modele: true,
            immatriculation: true
          }
        },
        chauffeur: {
          select: {
            id: true,
            nom: true,
            prenom: true
          }
        },
        user: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            role: true
          }
        }
      },
      orderBy: [
        { actif: 'desc' },
        { dateDebut: 'desc' }
      ]
    })

    console.log(`✅ Requête réussie! ${assignations.length} assignations trouvées`)
    console.log('\n📋 Détails des assignations:')
    
    assignations.slice(0, 3).forEach((a, i) => {
      const person = a.chauffeur ? 
        `${a.chauffeur.nom} ${a.chauffeur.prenom} (Chauffeur)` : 
        a.user ? `${a.user.nom} ${a.user.prenom} (${a.user.role})` : 'Personne inconnue'
      
      console.log(`  ${i + 1}. ${a.vehicule.marque} ${a.vehicule.modele} → ${person} [${a.actif ? 'ACTIF' : 'TERMINÉ'}]`)
    })

    // Test du JSON serialization
    console.log('\n🔄 Test de sérialisation JSON...')
    const jsonString = JSON.stringify(assignations, null, 2)
    console.log(`✅ JSON sérialisé: ${jsonString.length} caractères`)

  } catch (error) {
    console.error('❌ Erreur dans la requête:', error)
    if (error instanceof Error) {
      console.error('Message:', error.message)
      console.error('Stack:', error.stack)
    }
  }
}

testAPI()
  .catch((e) => {
    console.error('❌ Erreur fatale:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })