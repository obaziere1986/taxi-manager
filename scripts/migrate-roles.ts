import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function migrateRoles() {
  console.log('🔄 Migration des rôles et normalisation des données...')

  try {
    // 1. Mettre à jour les rôles existants en majuscules
    const roleMapping = {
      'ADMIN': 'Admin',
      'PLANNEUR': 'Planner', 
      'CHAUFFEUR': 'Chauffeur'
    }

    // Récupérer tous les users avec des rôles en majuscules
    const users = await prisma.user.findMany()
    console.log(`📊 ${users.length} utilisateurs trouvés`)

    for (const user of users) {
      const currentRole = user.role as string
      const newRole = roleMapping[currentRole as keyof typeof roleMapping] || currentRole

      if (currentRole !== newRole) {
        console.log(`🔧 Mise à jour: ${user.nom} ${user.prenom} - ${currentRole} → ${newRole}`)
        
        await prisma.user.update({
          where: { id: user.id },
          data: { 
            role: newRole as any,
            // Si c'est un chauffeur, définir un statut par défaut
            statut: newRole === 'Chauffeur' ? 'DISPONIBLE' : null
          }
        })
      } else if (user.role === 'Chauffeur' && !user.statut) {
        // Ajouter un statut par défaut aux chauffeurs existants
        console.log(`📝 Ajout statut DISPONIBLE pour: ${user.nom} ${user.prenom}`)
        
        await prisma.user.update({
          where: { id: user.id },
          data: { statut: 'DISPONIBLE' }
        })
      }
    }

    // 2. Vérifier la cohérence avec la table Chauffeur
    const chauffeurs = await prisma.chauffeur.findMany({
      include: {
        user: true
      }
    })

    console.log(`📊 ${chauffeurs.length} chauffeurs dans la table séparée`)

    for (const chauffeur of chauffeurs) {
      if (chauffeur.user) {
        // Synchroniser le statut
        if (chauffeur.user.statut !== chauffeur.statut) {
          console.log(`🔄 Sync statut: ${chauffeur.nom} ${chauffeur.prenom} - ${chauffeur.user.statut} → ${chauffeur.statut}`)
          
          await prisma.user.update({
            where: { id: chauffeur.user.id },
            data: { statut: chauffeur.statut }
          })
        }
      } else {
        // Chauffeur sans user associé - créer un user
        console.log(`➕ Création user pour chauffeur: ${chauffeur.nom} ${chauffeur.prenom}`)
        
        const newUser = await prisma.user.create({
          data: {
            nom: chauffeur.nom,
            prenom: chauffeur.prenom,
            email: `${chauffeur.prenom.toLowerCase()}.${chauffeur.nom.toLowerCase()}@taxi.local`,
            telephone: chauffeur.telephone,
            role: 'Chauffeur',
            statut: chauffeur.statut,
            actif: chauffeur.statut !== 'HORS_SERVICE'
          }
        })

        // Lier le chauffeur au nouvel user
        await prisma.chauffeur.update({
          where: { id: chauffeur.id },
          data: { userId: newUser.id }
        })
      }
    }

    console.log('✅ Migration des rôles terminée')

    // 3. Affichage du résultat final
    const finalUsers = await prisma.user.findMany({
      orderBy: [{ role: 'asc' }, { nom: 'asc' }]
    })

    console.log('\n📋 État final des utilisateurs:')
    finalUsers.forEach(user => {
      const status = user.statut ? ` (${user.statut})` : ''
      console.log(`   ${user.role}: ${user.nom.toUpperCase()}, ${user.prenom}${status}`)
    })

  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error)
  } finally {
    await prisma.$disconnect()
  }
}

migrateRoles().catch(console.error)