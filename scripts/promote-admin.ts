import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function promoteToAdmin() {
  console.log('🔧 Promotion d\'un utilisateur en Admin...')

  // Récupérer le premier utilisateur
  const users = await prisma.user.findMany({
    take: 5,
    select: {
      id: true,
      nom: true,
      prenom: true,
      email: true,
      role: true
    }
  })

  if (users.length === 0) {
    console.log('❌ Aucun utilisateur trouvé')
    return
  }

  console.log('👥 Utilisateurs disponibles:')
  users.forEach((user, index) => {
    console.log(`${index + 1}. ${user.prenom} ${user.nom} (${user.email}) - ${user.role}`)
  })

  // Promouvoir le premier utilisateur en Admin
  const userToPromote = users[0]
  
  await prisma.user.update({
    where: { id: userToPromote.id },
    data: { role: 'Admin' }
  })

  console.log(`✅ ${userToPromote.prenom} ${userToPromote.nom} promu en Admin !`)
}

promoteToAdmin()
  .catch((e) => {
    console.error('❌ Erreur:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })