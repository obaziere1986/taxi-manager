import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const prénoms = [
  // Prénoms français traditionnels
  'Jean', 'Pierre', 'Marie', 'Catherine', 'Philippe', 'Isabelle', 'Alain', 'Sylvie', 'Bernard', 'Anne',
  // Prénoms maghrébins
  'Ahmed', 'Mohamed', 'Fatima', 'Aicha', 'Omar', 'Khadija', 'Hassan', 'Amina', 'Youssef', 'Leila',
  // Prénoms africains
  'Mamadou', 'Aminata', 'Ibrahim', 'Fatoumata', 'Moussa', 'Awa', 'Cheikh', 'Mariam', 'Abdoulaye', 'Aissatou',
  // Prénoms européens/internationaux
  'Alessandro', 'Sofia', 'Miguel', 'Carmen', 'Klaus', 'Ingrid', 'Dimitri', 'Elena', 'João', 'Ana',
  // Prénoms asiatiques
  'Chen', 'Li', 'Raj', 'Priya', 'Hiroshi', 'Yuki', 'David', 'Sarah', 'Kevin', 'Léa'
]

const noms = [
  // Noms français
  'Martin', 'Dubois', 'Leroy', 'Moreau', 'Simon', 'Laurent', 'Lefebvre', 'Bertrand', 'Roux', 'Vincent',
  // Noms maghrébins
  'Benali', 'Benaissa', 'El Mansouri', 'Kaddour', 'Meziane', 'Ouali', 'Zerrouki', 'Belkacem', 'Hamidi', 'Cherif',
  // Noms africains
  'Diallo', 'Traoré', 'Camara', 'Koné', 'Diouf', 'Ndiaye', 'Ba', 'Sy', 'Fall', 'Kane',
  // Noms européens/internationaux  
  'Rossi', 'Silva', 'González', 'García', 'Schmidt', 'Müller', 'Petrov', 'Popović', 'Santos', 'Costa',
  // Noms asiatiques
  'Wang', 'Li', 'Patel', 'Sharma', 'Tanaka', 'Suzuki', 'Kim', 'Park', 'Nguyen', 'Tran'
]

const véhicules = [
  'Mercedes Classe E', 'BMW Série 5', 'Audi A6', 'Volkswagen Passat', 'Peugeot 508',
  'Renault Talisman', 'Citroën C5', 'Ford Mondeo', 'Toyota Camry', 'Honda Accord'
]

const adressesOrigines = [
  'Gare du Nord, Paris', 'Châtelet-Les Halles, Paris', 'République, Paris', 'Bastille, Paris',
  'Montparnasse, Paris', 'Opéra, Paris', 'Champs-Élysées, Paris', 'Tour Eiffel, Paris',
  'Louvre, Paris', 'Marais, Paris', 'Saint-Germain, Paris', 'Belleville, Paris'
]

const adressesDestinations = [
  'Aéroport Charles de Gaulle', 'Aéroport d\'Orly', 'Gare de Lyon', 'Gare d\'Austerlitz',
  'La Défense', 'Vincennes', 'Boulogne-Billancourt', 'Neuilly-sur-Seine',
  'Créteil', 'Versailles', 'Saint-Denis', 'Nanterre'
]

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)]
}

function getUniqueRandomPerson(usedCombinations: Set<string>): { prenom: string, nom: string } {
  let attempts = 0
  let prenom, nom, combination
  
  do {
    prenom = getRandomElement(prénoms)
    nom = getRandomElement(noms)
    combination = `${prenom}-${nom}`
    attempts++
    
    // Si on a fait trop d'essais, on accepte le doublon pour éviter une boucle infinie
    if (attempts > 100) break
  } while (usedCombinations.has(combination))
  
  usedCombinations.add(combination)
  return { prenom, nom }
}

function getRandomPhone(): string {
  return `06${Math.floor(Math.random() * 90000000 + 10000000)}`
}

function getRandomEmail(prenom: string, nom: string): string {
  const domains = ['gmail.com', 'yahoo.fr', 'orange.fr', 'hotmail.fr', 'outlook.fr']
  const domain = getRandomElement(domains)
  return `${prenom.toLowerCase()}.${nom.toLowerCase()}@${domain}`
}

function getRandomPrice(): number {
  return Math.floor(Math.random() * 80) + 15 // Entre 15€ et 95€
}

function getRandomDateTime(daysFromNow: number = 0): Date {
  const now = new Date()
  const targetDate = new Date(now.getTime() + daysFromNow * 24 * 60 * 60 * 1000)
  
  // Heure entre 6h et 23h
  const hour = Math.floor(Math.random() * 17) + 6
  const minute = Math.floor(Math.random() * 60)
  
  targetDate.setHours(hour, minute, 0, 0)
  return targetDate
}

async function main() {
  console.log('🌱 Début du seeding...')

  // Supprimer les données existantes dans l'ordre correct (dépendances d'abord)
  await prisma.course.deleteMany()
  await prisma.vehiculeAssignation.deleteMany()
  await prisma.avisClient.deleteMany()
  await prisma.chauffeur.deleteMany()
  await prisma.client.deleteMany()
  await prisma.user.deleteMany()
  await prisma.vehicule.deleteMany()
  await prisma.parametre.deleteMany()

  // Créer 10 chauffeurs
  console.log('👨‍💼 Création des chauffeurs...')
  const chauffeurs = []
  const usedChauffeurNames = new Set<string>()
  for (let i = 0; i < 10; i++) {
    const { prenom, nom } = getUniqueRandomPerson(usedChauffeurNames)
    const chauffeur = await prisma.chauffeur.create({
      data: {
        prenom,
        nom,
        telephone: getRandomPhone(),
        vehicule: getRandomElement(véhicules),
        statut: i < 8 ? 'DISPONIBLE' : i === 8 ? 'OCCUPE' : 'HORS_SERVICE'
      }
    })
    chauffeurs.push(chauffeur)
  }

  // Créer 50 clients
  console.log('👥 Création des clients...')
  const clients = []
  const usedClientNames = new Set<string>()
  for (let i = 0; i < 50; i++) {
    const { prenom, nom } = getUniqueRandomPerson(usedClientNames)
    const client = await prisma.client.create({
      data: {
        prenom,
        nom,
        telephone: getRandomPhone(),
        email: Math.random() > 0.3 ? getRandomEmail(prenom, nom) : null,
        adresses: Math.random() > 0.5 ? [getRandomElement(adressesOrigines)] as any : null
      }
    })
    clients.push(client)
  }

  // Créer des courses pour aujourd'hui, hier et demain
  console.log('🚗 Création des courses...')
  
  const statuts = ['EN_ATTENTE', 'ASSIGNEE', 'EN_COURS', 'TERMINEE', 'ANNULEE']
  const statusWeights = [0.2, 0.3, 0.1, 0.35, 0.05] // Probabilités
  
  for (let day = -1; day <= 1; day++) {
    const coursesForDay = day === 0 ? 25 : 15 // Plus de courses aujourd'hui
    
    for (let i = 0; i < coursesForDay; i++) {
      const client = getRandomElement(clients)
      const chauffeur = Math.random() > 0.3 ? getRandomElement(chauffeurs) : null
      
      // Sélectionner un statut selon les probabilités
      let statut = 'EN_ATTENTE'
      const rand = Math.random()
      let cumulative = 0
      for (let j = 0; j < statuts.length; j++) {
        cumulative += statusWeights[j]
        if (rand <= cumulative) {
          statut = statuts[j]
          break
        }
      }
      
      // Si pas de chauffeur assigné, statut = EN_ATTENTE
      if (!chauffeur) statut = 'EN_ATTENTE'
      
      await prisma.course.create({
        data: {
          origine: getRandomElement(adressesOrigines),
          destination: getRandomElement(adressesDestinations),
          dateHeure: getRandomDateTime(day),
          clientId: client.id,
          chauffeurId: chauffeur?.id || null,
          statut: statut as any,
          prix: statut === 'TERMINEE' ? getRandomPrice() : null,
          notes: Math.random() > 0.7 ? 'Instructions spéciales pour cette course' : null
        }
      })
    }
  }

  console.log('✅ Seeding terminé!')
  console.log(`📊 Créé:`)
  console.log(`   - 10 chauffeurs`)
  console.log(`   - 50 clients`) 
  console.log(`   - ~55 courses (sur 3 jours)`)
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })