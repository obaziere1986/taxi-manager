import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function createPlanner() {
  console.log('👤 Création d\'un utilisateur Planner...')

  const hashedPassword = await bcrypt.hash('planner123', 10)

  const planner = await prisma.user.create({
    data: {
      nom: 'Martin',
      prenom: 'Sophie',
      email: 'sophie.martin@taxicompany.fr',
      telephone: '+33123456789',
      role: 'Planner',
      statut: 'DISPONIBLE',
      actif: true,
      login: 'sophie.martin',
      passwordHash: hashedPassword
    }
  })

  console.log(`✅ Planner créé : ${planner.prenom} ${planner.nom}`)
  console.log(`📧 Email: ${planner.email}`)
  console.log(`🔑 Login: sophie.martin`)
  console.log(`🔒 Mot de passe: planner123`)
}

createPlanner()
  .catch((e) => {
    console.error('❌ Erreur:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })