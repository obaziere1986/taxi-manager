const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function fixCourseHours() {
  try {
    console.log('🔧 Correction des heures des courses...')
    
    // Trouver toutes les courses hors plage 7h-22h
    const courses = await prisma.course.findMany({
      where: {
        dateHeure: {
          gte: new Date('2020-01-01'),
        }
      },
      select: {
        id: true,
        dateHeure: true,
        origine: true,
        destination: true,
      }
    })

    const coursesToUpdate = courses.filter(course => {
      const hour = new Date(course.dateHeure).getHours()
      return hour < 7 || hour > 22
    })

    console.log(`📊 ${coursesToUpdate.length} courses à corriger`)

    let updated = 0
    for (const course of coursesToUpdate) {
      const currentDate = new Date(course.dateHeure)
      const hour = currentDate.getHours()
      
      let newHour
      if (hour < 7) {
        newHour = 7 + Math.floor(Math.random() * 3) // 7h, 8h ou 9h
      } else if (hour > 22) {
        newHour = 20 + Math.floor(Math.random() * 3) // 20h, 21h ou 22h
      }

      const newDate = new Date(currentDate)
      newDate.setHours(newHour)
      
      await prisma.course.update({
        where: { id: course.id },
        data: { dateHeure: newDate }
      })

      console.log(`✅ Course ${course.id} : ${hour}h → ${newHour}h`)
      updated++
    }

    console.log(`\n🎉 ${updated} courses mises à jour`)
    
    // Vérification finale
    const remainingOutOfRange = await prisma.course.count({
      where: {
        OR: [
          {
            dateHeure: {
              gte: new Date('2020-01-01T00:00:00Z'),
              lt: new Date('2020-01-01T07:00:00Z')
            }
          },
          {
            dateHeure: {
              gt: new Date('2020-01-01T22:59:59Z'),
              lt: new Date('2020-01-02T00:00:00Z')
            }
          }
        ]
      }
    })

    if (remainingOutOfRange === 0) {
      console.log('✅ Toutes les courses sont maintenant dans la plage 7h-22h')
    } else {
      console.log(`⚠️ Il reste ${remainingOutOfRange} courses hors plage`)
    }

  } catch (error) {
    console.error('❌ Erreur :', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixCourseHours()