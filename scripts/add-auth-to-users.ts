import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function addAuthToUsers() {
  console.log('🔐 Ajout de l\'authentification aux utilisateurs existants...')

  try {
    // Récupérer tous les utilisateurs
    const users = await prisma.user.findMany()
    console.log(`📋 ${users.length} utilisateurs trouvés`)

    const updates = []

    for (const user of users) {
      let login = ''
      let password = ''

      // Définir login et mot de passe selon le rôle
      switch (user.role) {
        case 'Admin':
          login = 'admin'
          password = 'admin123'
          break
        case 'Planner':
          login = 'planner'
          password = 'planner123'
          break
        case 'Chauffeur':
          // Utiliser prénom en minuscules comme login
          login = user.prenom.toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g, '')
          password = 'chauffeur123'
          break
        default:
          continue
      }

      // Hacher le mot de passe
      const passwordHash = await bcrypt.hash(password, 12)

      // Mettre à jour l'utilisateur
      const updatePromise = prisma.user.update({
        where: { id: user.id },
        data: {
          login,
          passwordHash
        }
      })

      updates.push(updatePromise)
      console.log(`✅ ${user.prenom} ${user.nom} (${user.role}): login="${login}", password="${password}"`)
    }

    // Exécuter toutes les mises à jour
    await Promise.all(updates)

    console.log(`\\n🎉 Authentification ajoutée pour ${updates.length} utilisateurs!`)
    console.log('\\n📋 Comptes créés:')
    console.log('   Admin: login="admin", password="admin123"')
    console.log('   Planner: login="planner", password="planner123"')
    console.log('   Chauffeurs: login="[prenom]", password="chauffeur123"')

  } catch (error) {
    console.error('❌ Erreur lors de l\'ajout de l\'authentification:', error)
    process.exit(1)
  }
}

addAuthToUsers()
  .catch((e) => {
    console.error('❌ Erreur:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })