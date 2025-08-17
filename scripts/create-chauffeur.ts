import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function createChauffeur() {
  console.log('🚗 Création d\'un utilisateur Chauffeur...')

  const hashedPassword = await bcrypt.hash('chauffeur123', 10)

  const chauffeur = await prisma.user.create({
    data: {
      nom: 'Durand',
      prenom: 'Marc',
      email: 'marc.durand@taxicompany.fr',
      telephone: '+33987654321',
      role: 'Chauffeur',
      statut: 'DISPONIBLE',
      actif: true,
      login: 'marc.durand',
      passwordHash: hashedPassword
    }
  })

  console.log(`✅ Chauffeur créé : ${chauffeur.prenom} ${chauffeur.nom}`)
  console.log(`📧 Email: ${chauffeur.email}`)
  console.log(`🔑 Login: marc.durand`)
  console.log(`🔒 Mot de passe: chauffeur123`)
}

createChauffeur()
  .catch((e) => {
    console.error('❌ Erreur:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })