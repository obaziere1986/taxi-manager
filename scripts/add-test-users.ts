import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('👥 Ajout d\'utilisateurs de test...')

  // Vérifier si les utilisateurs existent déjà
  const existingAdmin = await prisma.user.findFirst({
    where: { role: 'ADMIN' }
  })
  
  const existingPlanneur = await prisma.user.findFirst({
    where: { role: 'PLANNEUR' }
  })

  if (!existingAdmin) {
    const admin = await prisma.user.create({
      data: {
        nom: 'Dubois',
        prenom: 'Jean',
        email: 'admin@taxi-manager.fr',
        telephone: '0601020304',
        role: 'ADMIN',
        actif: true
      }
    })
    console.log(`✅ Admin créé : ${admin.prenom} ${admin.nom}`)
  } else {
    console.log(`✓ Admin existant : ${existingAdmin.prenom} ${existingAdmin.nom}`)
  }

  if (!existingPlanneur) {
    const planneur = await prisma.user.create({
      data: {
        nom: 'Martin',
        prenom: 'Sophie',
        email: 'planneur@taxi-manager.fr',
        telephone: '0601020305',
        role: 'PLANNEUR',
        actif: true
      }
    })
    console.log(`✅ Planneur créé : ${planneur.prenom} ${planneur.nom}`)
  } else {
    console.log(`✓ Planneur existant : ${existingPlanneur.prenom} ${existingPlanneur.nom}`)
  }

  // Statistiques finales
  const totalUsers = await prisma.user.count()
  const totalChauffeurs = await prisma.chauffeur.count()
  const totalVehicules = await prisma.vehicule.count()

  console.log('\n📊 Statistiques :')
  console.log(`   - ${totalUsers} utilisateurs`)
  console.log(`   - ${totalChauffeurs} chauffeurs`)
  console.log(`   - ${totalVehicules} véhicules`)

  console.log('\n✅ Utilisateurs de test ajoutés!')
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors de l\'ajout des utilisateurs:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })