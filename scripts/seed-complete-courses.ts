import { PrismaClient } from '@prisma/client'
import { addDays, subDays, startOfDay, addHours, addWeeks, addMonths, subWeeks, subMonths } from 'date-fns'

const prisma = new PrismaClient()

const adressesOrigines = [
  'Gare du Nord, Paris', 'Châtelet-Les Halles, Paris', 'République, Paris', 'Bastille, Paris',
  'Montparnasse, Paris', 'Opéra, Paris', 'Champs-Élysées, Paris', 'Tour Eiffel, Paris',
  'Louvre, Paris', 'Marais, Paris', 'Saint-Germain, Paris', 'Belleville, Paris',
  'Place de la Nation, Paris', 'Pigalle, Paris', 'Trocadéro, Paris'
]

const adressesDestinations = [
  'Aéroport Charles de Gaulle', 'Aéroport d\'Orly', 'Gare de Lyon', 'Gare d\'Austerlitz',
  'La Défense', 'Vincennes', 'Boulogne-Billancourt', 'Neuilly-sur-Seine',
  'Créteil', 'Versailles', 'Saint-Denis', 'Nanterre', 'Issy-les-Moulineaux',
  'Levallois-Perret', 'Clichy', 'Courbevoie'
]

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)]
}

function getRandomPrice(): number {
  return Math.floor(Math.random() * 80) + 15 // Entre 15€ et 95€
}

function getRandomTimeInDay(baseDate: Date): Date {
  const hour = Math.floor(Math.random() * 17) + 6 // Entre 6h et 23h
  const minute = Math.floor(Math.random() * 60)
  const newDate = new Date(baseDate)
  newDate.setHours(hour, minute, 0, 0)
  return newDate
}

async function createCoursesForPeriod(
  clients: any[], 
  chauffeurs: any[], 
  baseDate: Date, 
  count: number, 
  defaultStatus: string = 'TERMINEE'
) {
  const statuts = ['EN_ATTENTE', 'ASSIGNEE', 'EN_COURS', 'TERMINEE', 'ANNULEE']
  
  for (let i = 0; i < count; i++) {
    const client = getRandomElement(clients)
    const chauffeur = Math.random() > 0.2 ? getRandomElement(chauffeurs) : null
    
    let statut = defaultStatus
    if (baseDate > new Date()) {
      // Courses futures : principalement EN_ATTENTE ou ASSIGNEE
      statut = Math.random() > 0.4 ? 'EN_ATTENTE' : 'ASSIGNEE'
    } else if (baseDate.toDateString() === new Date().toDateString()) {
      // Courses d'aujourd'hui : mix de tous les statuts
      const weights = [0.25, 0.35, 0.15, 0.2, 0.05]
      const rand = Math.random()
      let cumulative = 0
      for (let j = 0; j < statuts.length; j++) {
        cumulative += weights[j]
        if (rand <= cumulative) {
          statut = statuts[j]
          break
        }
      }
    }
    
    // Si pas de chauffeur et ce n'est pas en attente
    if (!chauffeur && statut !== 'EN_ATTENTE') {
      statut = 'EN_ATTENTE'
    }
    
    await prisma.course.create({
      data: {
        origine: getRandomElement(adressesOrigines),
        destination: getRandomElement(adressesDestinations),
        dateHeure: getRandomTimeInDay(baseDate),
        clientId: client.id,
        chauffeurId: chauffeur?.id || null,
        statut: statut as any,
        prix: statut === 'TERMINEE' ? getRandomPrice() : null,
        notes: Math.random() > 0.8 ? 'Instructions spéciales pour cette course' : null
      }
    })
  }
}

async function main() {
  console.log('🌱 Création de courses complètes pour toutes les périodes...')

  // Récupérer les clients et chauffeurs existants
  const clients = await prisma.client.findMany()
  const chauffeurs = await prisma.chauffeur.findMany()

  if (clients.length === 0 || chauffeurs.length === 0) {
    console.log('❌ Pas de clients ou chauffeurs trouvés. Exécutez d\'abord le seed principal.')
    return
  }

  // Supprimer toutes les courses existantes
  await prisma.course.deleteMany()

  const today = startOfDay(new Date())

  // COURSES PASSÉES
  console.log('📅 Création des courses passées...')
  
  // Hier (5 courses)
  await createCoursesForPeriod(clients, chauffeurs, subDays(today, 1), 5, 'TERMINEE')
  
  // Cette semaine passée (8 courses réparties)
  for (let i = 2; i <= 6; i++) {
    await createCoursesForPeriod(clients, chauffeurs, subDays(today, i), 2, 'TERMINEE')
  }
  
  // Semaine dernière (12 courses)
  const lastWeekStart = subWeeks(today, 1)
  for (let i = 0; i < 7; i++) {
    await createCoursesForPeriod(clients, chauffeurs, addDays(lastWeekStart, i), 2, 'TERMINEE')
  }
  
  // Ce mois passé (15 courses)
  for (let i = 8; i <= 20; i++) {
    await createCoursesForPeriod(clients, chauffeurs, subDays(today, i), 1, 'TERMINEE')
  }
  
  // Mois dernier (10 courses)
  const lastMonth = subMonths(today, 1)
  for (let i = 0; i < 10; i++) {
    const randomDay = Math.floor(Math.random() * 28) + 1
    await createCoursesForPeriod(clients, chauffeurs, new Date(lastMonth.getFullYear(), lastMonth.getMonth(), randomDay), 1, 'TERMINEE')
  }
  
  // Plus ancien (8 courses - il y a 2-3 mois)
  const olderDate = subMonths(today, 2)
  for (let i = 0; i < 8; i++) {
    const randomDay = Math.floor(Math.random() * 28) + 1
    await createCoursesForPeriod(clients, chauffeurs, new Date(olderDate.getFullYear(), olderDate.getMonth(), randomDay), 1, 'TERMINEE')
  }

  // COURSES PRÉSENTES
  console.log('🚗 Création des courses d\'aujourd\'hui...')
  // Aujourd'hui (12 courses avec statuts variés)
  await createCoursesForPeriod(clients, chauffeurs, today, 12, 'EN_COURS')

  // COURSES FUTURES
  console.log('📅 Création des courses futures...')
  
  // Demain (8 courses)
  await createCoursesForPeriod(clients, chauffeurs, addDays(today, 1), 8, 'EN_ATTENTE')
  
  // Cette semaine (10 courses réparties)
  for (let i = 2; i <= 6; i++) {
    await createCoursesForPeriod(clients, chauffeurs, addDays(today, i), 2, 'EN_ATTENTE')
  }
  
  // Semaine prochaine (14 courses)
  const nextWeekStart = addWeeks(today, 1)
  for (let i = 0; i < 7; i++) {
    await createCoursesForPeriod(clients, chauffeurs, addDays(nextWeekStart, i), 2, 'EN_ATTENTE')
  }
  
  // Ce mois (12 courses)
  for (let i = 8; i <= 25; i++) {
    await createCoursesForPeriod(clients, chauffeurs, addDays(today, i), 1, 'EN_ATTENTE')
  }
  
  // Mois prochain (8 courses)
  const nextMonth = addMonths(today, 1)
  for (let i = 0; i < 8; i++) {
    const randomDay = Math.floor(Math.random() * 28) + 1
    await createCoursesForPeriod(clients, chauffeurs, new Date(nextMonth.getFullYear(), nextMonth.getMonth(), randomDay), 1, 'EN_ATTENTE')
  }
  
  // Plus tard (6 courses - dans 2-3 mois)
  const futureDate = addMonths(today, 2)
  for (let i = 0; i < 6; i++) {
    const randomDay = Math.floor(Math.random() * 28) + 1
    await createCoursesForPeriod(clients, chauffeurs, new Date(futureDate.getFullYear(), futureDate.getMonth(), randomDay), 1, 'EN_ATTENTE')
  }

  const totalCourses = await prisma.course.count()
  
  console.log('✅ Courses créées avec succès!')
  console.log(`📊 Total: ${totalCourses} courses`)
  console.log(`📅 Répartition sur toutes les périodes temporelles`)
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors de la création des courses:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })