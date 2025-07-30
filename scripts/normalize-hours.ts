import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Fonction pour arrondir les minutes aux valeurs 00, 15, 30, 45
function normalizeMinutes(date: Date): Date {
  const minutes = date.getMinutes()
  
  let normalizedMinutes: number
  if (minutes < 8) {
    normalizedMinutes = 0
  } else if (minutes < 23) {
    normalizedMinutes = 15
  } else if (minutes < 38) {
    normalizedMinutes = 30
  } else if (minutes < 53) {
    normalizedMinutes = 45
  } else {
    // Si >= 53 minutes, passer à l'heure suivante
    const nextHour = new Date(date)
    nextHour.setHours(date.getHours() + 1)
    nextHour.setMinutes(0)
    nextHour.setSeconds(0)
    nextHour.setMilliseconds(0)
    return nextHour
  }
  
  const normalizedDate = new Date(date)
  normalizedDate.setMinutes(normalizedMinutes)
  normalizedDate.setSeconds(0)
  normalizedDate.setMilliseconds(0)
  
  return normalizedDate
}

async function normalizeAllCourseHours() {
  console.log('🕐 Début de la normalisation des heures...')
  
  try {
    // Récupérer toutes les courses
    const courses = await prisma.course.findMany({
      select: {
        id: true,
        dateHeure: true
      }
    })
    
    console.log(`📊 ${courses.length} courses trouvées`)
    
    let updatedCount = 0
    
    for (const course of courses) {
      const originalDate = new Date(course.dateHeure)
      const normalizedDate = normalizeMinutes(originalDate)
      
      // Vérifier si une modification est nécessaire
      if (originalDate.getTime() !== normalizedDate.getTime()) {
        await prisma.course.update({
          where: { id: course.id },
          data: { dateHeure: normalizedDate }
        })
        
        console.log(`✅ Course ${course.id}: ${originalDate.toLocaleString('fr-FR')} → ${normalizedDate.toLocaleString('fr-FR')}`)
        updatedCount++
      }
    }
    
    console.log(`\n✅ Normalisation terminée!`)
    console.log(`📈 ${updatedCount} courses mises à jour sur ${courses.length}`)
    
  } catch (error) {
    console.error('❌ Erreur lors de la normalisation:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Exécution du script
normalizeAllCourseHours()