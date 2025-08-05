import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedUsers() {
  console.log('👥 Création des utilisateurs de test...')

  try {
    // Créer un utilisateur admin
    const admin = await prisma.user.create({
      data: {
        nom: 'MARTIN',
        prenom: 'Marie',
        email: 'marie.martin@taxi.com',
        telephone: '06.12.34.56.78',
        role: 'ADMIN',
        actif: true
      }
    })
    console.log(`✅ Admin créé: ${admin.nom}, ${admin.prenom}`)

    // Créer un utilisateur planneur
    const planneur = await prisma.user.create({
      data: {
        nom: 'PLANNEUR',
        prenom: 'Pierre',
        email: 'pierre.planneur@taxi.com',
        telephone: '06.87.65.43.21',
        role: 'PLANNEUR',
        actif: true
      }
    })
    console.log(`✅ Planneur créé: ${planneur.nom}, ${planneur.prenom}`)

    // Créer quelques utilisateurs chauffeurs liés aux chauffeurs existants
    const chauffeurs = await prisma.chauffeur.findMany({ take: 3 })
    
    for (const chauffeur of chauffeurs) {
      const user = await prisma.user.create({
        data: {
          nom: chauffeur.nom,
          prenom: chauffeur.prenom,
          email: `${chauffeur.prenom.toLowerCase()}.${chauffeur.nom.toLowerCase()}@taxi.com`,
          telephone: chauffeur.telephone,
          role: 'CHAUFFEUR',
          actif: true
        }
      })

      // Lier l'utilisateur au chauffeur
      await prisma.chauffeur.update({
        where: { id: chauffeur.id },
        data: { userId: user.id }
      })

      console.log(`✅ Utilisateur chauffeur créé: ${user.nom}, ${user.prenom}`)
    }

    console.log('🎉 Seeding des utilisateurs terminé!')

  } catch (error) {
    console.error('❌ Erreur lors du seeding des utilisateurs:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

seedUsers()