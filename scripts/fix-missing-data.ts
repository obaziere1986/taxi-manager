import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔧 Correction des données manquantes...')

  // 1. Lister tous les chauffeurs et utilisateurs
  console.log('📋 Vérification des données existantes...')
  const chauffeurs = await prisma.chauffeur.findMany()
  const users = await prisma.user.findMany()
  
  console.log(`   - ${chauffeurs.length} chauffeurs trouvés`)
  console.log(`   - ${users.length} utilisateurs trouvés`)

  // 3. Vérifier les champs manquants et les corriger
  console.log('🔍 Vérification des champs manquants...')
  
  // Chauffeurs sans statut
  const chauffeursWithoutStatus = await prisma.chauffeur.updateMany({
    where: { statut: null },
    data: { statut: 'DISPONIBLE' }
  })
  
  console.log(`✅ ${chauffeursWithoutStatus.count} statuts chauffeurs corrigés`)

  // Users sans actif défini
  const usersWithoutActif = await prisma.user.updateMany({
    where: { actif: null },
    data: { actif: true }
  })
  
  console.log(`✅ ${usersWithoutActif.count} statuts utilisateurs corrigés`)

  // 4. Créer quelques utilisateurs admin/planneur de test
  console.log('👥 Création d\'utilisateurs admin/planneur pour test...')
  
  const existingAdmin = await prisma.user.findFirst({
    where: { role: 'ADMIN' }
  })
  
  if (!existingAdmin) {
    await prisma.user.create({
      data: {
        nom: 'Dubois',
        prenom: 'Jean',
        email: 'admin@taxi-manager.fr',
        telephone: '0601020304',
        role: 'ADMIN',
        actif: true
      }
    })
    console.log('✅ Administrateur créé')
  }

  const existingPlanneur = await prisma.user.findFirst({
    where: { role: 'PLANNEUR' }
  })
  
  if (!existingPlanneur) {
    await prisma.user.create({
      data: {
        nom: 'Martin',
        prenom: 'Sophie',
        email: 'planneur@taxi-manager.fr',
        telephone: '0601020305',
        role: 'PLANNEUR',
        actif: true
      }
    })
    console.log('✅ Planneur créé')
  }

  // 5. Statistiques finales
  const totalChauffeurs = await prisma.chauffeur.count()
  const totalUsers = await prisma.user.count()
  const totalVehicules = await prisma.vehicule.count()
  const totalAssignations = await prisma.vehiculeAssignation.count()

  console.log('\n📊 Statistiques de la base de données :')
  console.log(`   - ${totalChauffeurs} chauffeurs`)
  console.log(`   - ${totalUsers} utilisateurs`)
  console.log(`   - ${totalVehicules} véhicules`)
  console.log(`   - ${totalAssignations} assignations`)

  console.log('\n✅ Toutes les corrections sont terminées!')
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors de la correction:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })