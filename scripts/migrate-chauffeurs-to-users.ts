import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function migrateChauffeurs() {
  console.log('🚀 Migration Chauffeurs → Users - Début')
  
  try {
    // 1. Récupérer tous les chauffeurs existants
    const chauffeurs = await prisma.chauffeur.findMany({
      include: {
        courses: true,
        assignations: true,
        user: true
      }
    })
    
    console.log(`📊 ${chauffeurs.length} chauffeurs à migrer`)
    
    // 2. Créer/mettre à jour les utilisateurs correspondants
    for (const chauffeur of chauffeurs) {
      console.log(`🔄 Migration de ${chauffeur.prenom} ${chauffeur.nom}...`)
      
      let user
      
      if (chauffeur.user) {
        // Utilisateur déjà existant - mettre à jour
        console.log(`  ↗️ Mise à jour utilisateur existant`)
        user = await prisma.user.update({
          where: { id: chauffeur.user.id },
          data: {
            nom: chauffeur.nom,
            prenom: chauffeur.prenom,
            telephone: chauffeur.telephone,
            role: 'Chauffeur',
            statut: chauffeur.statut,
            vehicule: chauffeur.vehicule,
            vehiculeId: chauffeur.vehiculeId,
          }
        })
      } else {
        // Créer un nouvel utilisateur
        console.log(`  ✨ Création nouvel utilisateur`)
        user = await prisma.user.create({
          data: {
            nom: chauffeur.nom,
            prenom: chauffeur.prenom,
            email: `${chauffeur.prenom.toLowerCase()}.${chauffeur.nom.toLowerCase()}@taxicompany.fr`,
            telephone: chauffeur.telephone,
            role: 'Chauffeur',
            statut: chauffeur.statut,
            vehicule: chauffeur.vehicule,
            vehiculeId: chauffeur.vehiculeId,
          }
        })
      }
      
      // 3. Mettre à jour les courses liées
      if (chauffeur.courses.length > 0) {
        console.log(`  📝 Migration de ${chauffeur.courses.length} courses`)
        await prisma.course.updateMany({
          where: { chauffeurId: chauffeur.id },
          data: { 
            userId: user.id,
            // Garder chauffeurId pour la compatibilité temporaire
          }
        })
      }
      
      // 4. Mettre à jour les assignations véhicules
      if (chauffeur.assignations.length > 0) {
        console.log(`  🚗 Migration de ${chauffeur.assignations.length} assignations`)
        await prisma.vehiculeAssignation.updateMany({
          where: { chauffeurId: chauffeur.id },
          data: { 
            userId: user.id,
            // Garder chauffeurId pour la compatibilité temporaire
          }
        })
      }
      
      console.log(`  ✅ ${chauffeur.prenom} ${chauffeur.nom} migré vers User ID: ${user.id}`)
    }
    
    console.log('🎉 Migration terminée avec succès!')
    console.log('⚠️  Les anciennes données Chauffeur sont conservées pour sécurité')
    console.log('   Vous pouvez les supprimer après validation avec le script de nettoyage')
    
  } catch (error) {
    console.error('💥 Erreur lors de la migration:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Fonction de validation
async function validateMigration() {
  console.log('\n🔍 Validation de la migration...')
  
  const chauffeurs = await prisma.chauffeur.findMany()
  const users = await prisma.user.findMany({ where: { role: 'Chauffeur' } })
  const coursesWithUserId = await prisma.course.findMany({ where: { userId: { not: null } } })
  const assignationsWithUserId = await prisma.vehiculeAssignation.findMany({ where: { userId: { not: null } } })
  
  console.log(`📊 Statistiques après migration:`)
  console.log(`   - ${chauffeurs.length} chauffeurs originaux`)
  console.log(`   - ${users.length} utilisateurs avec rôle Chauffeur`)
  console.log(`   - ${coursesWithUserId.length} courses avec userId`)
  console.log(`   - ${assignationsWithUserId.length} assignations avec userId`)
  
  if (users.length >= chauffeurs.length) {
    console.log('✅ Migration validée - tous les chauffeurs ont été migrés')
  } else {
    console.log('❌ Migration incomplète - vérification nécessaire')
  }
}

// Script principal
async function main() {
  await migrateChauffeurs()
  await validateMigration()
}

if (require.main === module) {
  main()
    .catch((e) => {
      console.error(e)
      process.exit(1)
    })
}

export { migrateChauffeurs, validateMigration }