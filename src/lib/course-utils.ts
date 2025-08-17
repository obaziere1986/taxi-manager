import { differenceInDays, isToday, isTomorrow, isYesterday, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isBefore, isAfter } from 'date-fns'
import { fr } from 'date-fns/locale'

export interface Course {
  id: string
  origine: string
  destination: string
  dateHeure: string
  statut: 'EN_ATTENTE' | 'ASSIGNEE' | 'EN_COURS' | 'TERMINEE' | 'ANNULEE'
  prix: number | null
  notes: string | null
  client: {
    nom: string
    prenom: string
    telephone: string
  }
  chauffeur: {
    nom: string
    prenom: string
    vehicule: string
  } | null
}

export interface CourseCategory {
  id: string
  title: string
  description: string
  courses: Course[]
  count: number
}

export function categorizeCourses(courses: Course[]): {
  aVenir: CourseCategory[]
  passees: CourseCategory[]
} {
  const now = new Date()
  const coursesAVenir = courses.filter(course => new Date(course.dateHeure) >= now)
  const coursesPassees = courses.filter(course => new Date(course.dateHeure) < now)

  // Catégories à venir
  const aVenir: CourseCategory[] = [
    {
      id: 'aujourd-hui',
      title: 'Aujourd\'hui',
      description: 'Courses d\'aujourd\'hui à venir ou en cours',
      courses: courses.filter(course => 
        isToday(new Date(course.dateHeure)) && 
        !['TERMINEE', 'ANNULEE'].includes(course.statut)
      ),
      count: 0
    },
    {
      id: 'demain',
      title: 'Demain',
      description: 'Courses de demain',
      courses: coursesAVenir.filter(course => isTomorrow(new Date(course.dateHeure))),
      count: 0
    },
    {
      id: 'cette-semaine',
      title: 'Cette semaine',
      description: 'Courses de cette semaine (après demain)',
      courses: coursesAVenir.filter(course => {
        const courseDate = new Date(course.dateHeure)
        const startWeek = startOfWeek(now, { locale: fr })
        const endWeek = endOfWeek(now, { locale: fr })
        return courseDate >= startWeek && 
               courseDate <= endWeek && 
               !isToday(courseDate) && 
               !isTomorrow(courseDate)
      }),
      count: 0
    },
    {
      id: 'semaine-prochaine',
      title: 'Semaine prochaine',
      description: 'Courses de la semaine prochaine',
      courses: coursesAVenir.filter(course => {
        const courseDate = new Date(course.dateHeure)
        const nextWeekStart = new Date(now)
        nextWeekStart.setDate(now.getDate() + (7 - now.getDay()))
        const nextWeekEnd = new Date(nextWeekStart)
        nextWeekEnd.setDate(nextWeekStart.getDate() + 6)
        return courseDate >= nextWeekStart && courseDate <= nextWeekEnd
      }),
      count: 0
    },
    {
      id: 'ce-mois',
      title: 'Ce mois',
      description: 'Courses de ce mois (après cette semaine)',
      courses: coursesAVenir.filter(course => {
        const courseDate = new Date(course.dateHeure)
        const startMonth = startOfMonth(now)
        const endMonth = endOfMonth(now)
        const endWeek = endOfWeek(now, { locale: fr })
        return courseDate >= startMonth && 
               courseDate <= endMonth && 
               courseDate > endWeek
      }),
      count: 0
    },
    {
      id: 'mois-prochain',
      title: 'Mois prochain',
      description: 'Courses du mois prochain',
      courses: coursesAVenir.filter(course => {
        const courseDate = new Date(course.dateHeure)
        const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
        const endNextMonth = endOfMonth(nextMonth)
        return courseDate >= nextMonth && courseDate <= endNextMonth
      }),
      count: 0
    },
    {
      id: 'plus-tard',
      title: 'Plus tard',
      description: 'Courses dans plus d\'un mois',
      courses: coursesAVenir.filter(course => {
        const courseDate = new Date(course.dateHeure)
        const nextMonth = endOfMonth(new Date(now.getFullYear(), now.getMonth() + 1, 1))
        return courseDate > nextMonth
      }),
      count: 0
    }
  ]

  // Catégories passées
  const passees: CourseCategory[] = [
    {
      id: 'aujourd-hui-terminees',
      title: 'Aujourd\'hui - Terminées',
      description: 'Courses terminées aujourd\'hui',
      courses: courses.filter(course => 
        isToday(new Date(course.dateHeure)) && 
        ['TERMINEE', 'ANNULEE'].includes(course.statut)
      ),
      count: 0
    },
    {
      id: 'hier',
      title: 'Hier',
      description: 'Courses d\'hier',
      courses: coursesPassees.filter(course => isYesterday(new Date(course.dateHeure))),
      count: 0
    },
    {
      id: 'cette-semaine-passee',
      title: 'Cette semaine',
      description: 'Courses de cette semaine (avant hier)',
      courses: coursesPassees.filter(course => {
        const courseDate = new Date(course.dateHeure)
        const startWeek = startOfWeek(now, { locale: fr })
        return courseDate >= startWeek && 
               courseDate < now && 
               !isYesterday(courseDate)
      }),
      count: 0
    },
    {
      id: 'semaine-derniere',
      title: 'Semaine dernière',
      description: 'Courses de la semaine dernière',
      courses: coursesPassees.filter(course => {
        const courseDate = new Date(course.dateHeure)
        const lastWeekStart = new Date(now)
        lastWeekStart.setDate(now.getDate() - now.getDay() - 7)
        const lastWeekEnd = new Date(lastWeekStart)
        lastWeekEnd.setDate(lastWeekStart.getDate() + 6)
        return courseDate >= lastWeekStart && courseDate <= lastWeekEnd
      }),
      count: 0
    },
    {
      id: 'ce-mois-passe',
      title: 'Ce mois',
      description: 'Courses de ce mois (avant cette semaine)',
      courses: coursesPassees.filter(course => {
        const courseDate = new Date(course.dateHeure)
        const startMonth = startOfMonth(now)
        const startWeek = startOfWeek(now, { locale: fr })
        return courseDate >= startMonth && 
               courseDate < startWeek
      }),
      count: 0
    },
    {
      id: 'mois-dernier',
      title: 'Mois dernier',
      description: 'Courses du mois dernier',
      courses: coursesPassees.filter(course => {
        const courseDate = new Date(course.dateHeure)
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        const endLastMonth = endOfMonth(lastMonth)
        return courseDate >= lastMonth && courseDate <= endLastMonth
      }),
      count: 0
    },
    {
      id: 'plus-ancien',
      title: 'Plus ancien',
      description: 'Courses de plus d\'un mois',
      courses: coursesPassees.filter(course => {
        const courseDate = new Date(course.dateHeure)
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        return courseDate < lastMonth
      }),
      count: 0
    }
  ]

  // Calculer les compteurs et filtrer les catégories vides
  const aVenirFiltered = aVenir.map(cat => ({ ...cat, count: cat.courses.length })).filter(cat => cat.count > 0)
  const passeesFiltered = passees.map(cat => ({ ...cat, count: cat.courses.length })).filter(cat => cat.count > 0)

  return { aVenir: aVenirFiltered, passees: passeesFiltered }
}