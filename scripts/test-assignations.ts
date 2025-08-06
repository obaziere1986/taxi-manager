import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔧 Création d\'assignations de test...')

  // Récupérer des véhicules et des personnes
  const vehicules = await prisma.vehicule.findMany({ take: 3 })
  const chauffeurs = await prisma.chauffeur.findMany({ take: 2 })
  const users = await prisma.user.findMany({ take: 2 })

  if (vehicules.length === 0) {
    console.log('❌ Pas de véhicules trouvés. Lancez d\'abord seed-vehicles.ts')
    return
  }

  // Créer des assignations de test
  if (chauffeurs.length > 0 && vehicules.length > 0) {
    await prisma.vehiculeAssignation.create({
      data: {
        vehiculeId: vehicules[0].id,
        chauffeurId: chauffeurs[0].id,
        actif: true,
        notes: 'Assignation chauffeur de test'
      }
    })
    console.log(`✅ Assignation chauffeur: ${chauffeurs[0].prenom} ${chauffeurs[0].nom} → ${vehicules[0].marque} ${vehicules[0].modele}`)
  }

  if (users.length > 0 && vehicules.length > 1) {
    await prisma.vehiculeAssignation.create({
      data: {
        vehiculeId: vehicules[1].id,
        userId: users[0].id,
        actif: true,
        notes: 'Assignation utilisateur de test'
      }
    })
    console.log(`✅ Assignation utilisateur: ${users[0].prenom} ${users[0].nom} (${users[0].role}) → ${vehicules[1].marque} ${vehicules[1].modele}`)
  }

  if (vehicules.length > 2) {
    // Créer une assignation terminée
    await prisma.vehiculeAssignation.create({
      data: {
        vehiculeId: vehicules[2].id,
        chauffeurId: chauffeurs.length > 1 ? chauffeurs[1].id : chauffeurs[0].id,
        actif: false,
        dateFin: new Date(),
        notes: 'Assignation terminée de test'
      }
    })
    console.log(`✅ Assignation terminée créée pour ${vehicules[2].marque} ${vehicules[2].modele}`)
  }

  const totalAssignations = await prisma.vehiculeAssignation.count()
  console.log(`\n📊 Total assignations: ${totalAssignations}`)

  console.log('\n✅ Assignations de test créées!')
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors de la création des assignations:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })