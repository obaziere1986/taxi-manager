const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkCourseHours() {
  try {
    console.log('🔍 Vérification des heures des courses...')
    
    const courses = await prisma.course.findMany({
      select: {
        id: true,
        dateHeure: true,
        origine: true,
        destination: true,
        client: {
          select: {
            nom: true,
            prenom: true
          }
        }
      }
    })

    console.log(`📊 Total de ${courses.length} courses dans la base`)

    const coursesOutOfRange = courses.filter(course => {
      const hour = new Date(course.dateHeure).getHours()
      return hour < 7 || hour > 22
    })

    console.log(`⏰ Courses hors plage 7h-22h : ${coursesOutOfRange.length}`)

    if (coursesOutOfRange.length > 0) {
      console.log('\n❌ Courses problématiques :')
      coursesOutOfRange.forEach(course => {
        const date = new Date(course.dateHeure)
        console.log(`- ${course.id} : ${date.toLocaleString('fr-FR')} (${date.getHours()}h${date.getMinutes().toString().padStart(2, '0')})`)
        console.log(`  ${course.origine} → ${course.destination}`)
        console.log(`  Client: ${course.client.nom.toUpperCase()}, ${course.client.prenom}`)
        console.log('')
      })
    } else {
      console.log('✅ Toutes les courses sont dans la plage horaire 7h-22h')
    }

    // Statistiques par heure
    const hourStats = {}
    courses.forEach(course => {
      const hour = new Date(course.dateHeure).getHours()
      hourStats[hour] = (hourStats[hour] || 0) + 1
    })

    console.log('\n📈 Répartition par heure :')
    for (let hour = 0; hour <= 23; hour++) {
      if (hourStats[hour]) {
        const status = hour >= 7 && hour <= 22 ? '✅' : '❌'
        console.log(`${status} ${hour}h : ${hourStats[hour]} courses`)
      }
    }

  } catch (error) {
    console.error('❌ Erreur :', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkCourseHours()