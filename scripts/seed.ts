import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const acteursHommes = [
  // Légendes du cinéma français (1930s-1980s)
  'Jean', 'Alain', 'Jean-Paul', 'Gérard', 'Pierre', 'Michel', 'Louis', 'Yves', 'Claude', 'Bernard',
  'Philippe', 'François', 'Daniel', 'André', 'Christian', 'Jean-Pierre', 'Jacques', 'Maurice', 'Robert', 'Henri',
  // Génération 1980s-2000s
  'Vincent', 'Guillaume', 'Fabrice', 'Thierry', 'Patrick', 'Christophe', 'Édouard', 'Mathieu', 'Dany', 'Romain',
  'Gilles', 'Éric', 'Serge', 'Bruno', 'Didier', 'Olivier', 'Pascal', 'Jean-Claude', 'Jean-Luc', 'Stéphane',
  // Génération actuelle (2000s-2020s)
  'Omar', 'Tahar', 'Saïd', 'Roschdy', 'Pio', 'Alex', 'Jonathan', 'Melvil', 'Swann', 'Félix',
  'Arthur', 'Niels', 'Finnegan', 'Raphaël', 'Gaspard', 'Louis-Do', 'Malik', 'Reda', 'César', 'Damien'
]

const actricesNoms = [
  // Légendes du cinéma français (1930s-1980s)
  'Brigitte', 'Catherine', 'Isabelle', 'Jeanne', 'Simone', 'Michèle', 'Françoise', 'Annie', 'Marie', 'Dominique',
  'Fanny', 'Romy', 'Marlène', 'Sylvie', 'Anouk', 'Danielle', 'Nathalie', 'Nicole', 'Miou-Miou', 'Carole',
  // Génération 1980s-2000s
  'Sophie', 'Juliette', 'Emmanuelle', 'Sandrine', 'Virginie', 'Valérie', 'Karin', 'Julie', 'Anne', 'Laetitia',
  'Clotilde', 'Valeria', 'Sabine', 'Cécile', 'Ariane', 'Béatrice', 'Christine', 'Élise', 'Florence', 'Hélène',
  // Génération actuelle (2000s-2020s)
  'Marion', 'Léa', 'Adèle', 'Louise', 'Eva', 'Ludivine', 'Chiara', 'Clémence', 'Mélanie', 'Bérénice',
  'Noémie', 'Alice', 'Diane', 'Camélia', 'Leïla', 'Sara', 'Aure', 'Blanche', 'Roxane', 'Camille'
]

const nomsActeurs = [
  // Légendes du cinéma français
  'Belmondo', 'Delon', 'Gabin', 'Ventura', 'Montand', 'Trintignant', 'Philipe', 'Noiret', 'Signoret', 'Morgan',
  'Deneuve', 'Bardot', 'Moreau', 'Adjani', 'Presle', 'Darrieux', 'Feuillère', 'Schneider', 'Girardot', 'Casarès',
  // Génération 1970s-1990s
  'Depardieu', 'Auteuil', 'Serrault', 'Rochefort', 'Richard', 'Galabru', 'Villeret', 'Lhermitte', 'Clavier', 'Reno',
  'Huppert', 'Binoche', 'Béart', 'Marceau', 'Ardant', 'Dussolier', 'Baye', 'Garcia', 'Parillaud', 'Azéma',
  // Génération 1990s-2010s
  'Canet', 'Dubosc', 'Cluzet', 'Luchini', 'Lindon', 'Kassovitz', 'Berléand', 'Cornillac', 'Wilson', 'Elmaleh',
  'Cotillard', 'Kiberlain', 'Viard', 'Marceau', 'Mastroianni', 'Casta', 'Renier', 'Klapisch', 'Poelvoorde', 'Magimel',
  // Génération actuelle
  'Dujardin', 'Niney', 'Ulliel', 'Amalric', 'Rahim', 'Zem', 'Sy', 'Poupaud', 'Mortensen', 'Forestier',
  'Seydoux', 'Exarchopoulos', 'Green', 'Merlant', 'Razafy', 'Jordana', 'Efira', 'Vega', 'Bejo', 'Nakache'
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

function getUniqueRandomActeur(usedCombinations: Set<string>): { prenom: string, nom: string } {
  let attempts = 0
  let prenom, nom, combination
  
  do {
    // Mélanger hommes et femmes pour plus de variété
    const tousPrenoms = [...acteursHommes, ...actricesNoms]
    prenom = getRandomElement(tousPrenoms)
    nom = getRandomElement(nomsActeurs)
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
  // Chauffeur supprimé - maintenant dans User
  await prisma.client.deleteMany()
  await prisma.user.deleteMany()
  await prisma.vehicule.deleteMany()
  await prisma.parametre.deleteMany()

  // Créer des utilisateurs avec différents rôles
  console.log('👥 Création des utilisateurs...')
  const users = []
  const usedUserNames = new Set<string>()
  
  // 8 chauffeurs
  for (let i = 0; i < 8; i++) {
    const { prenom, nom } = getUniqueRandomActeur(usedUserNames)
    const user = await prisma.user.create({
      data: {
        prenom,
        nom,
        email: `${prenom.toLowerCase()}.${nom.toLowerCase()}@taxicompany.fr`,
        telephone: getRandomPhone(),
        role: 'Chauffeur',
        vehicule: getRandomElement(véhicules),
        statut: i < 6 ? 'DISPONIBLE' : i === 6 ? 'OCCUPE' : 'HORS_SERVICE'
      }
    })
    users.push(user)
  }
  
  // 1 planneur
  const { prenom: prenomPlanneur, nom: nomPlanneur } = getUniqueRandomActeur(usedUserNames)
  const planneur = await prisma.user.create({
    data: {
      prenom: prenomPlanneur,
      nom: nomPlanneur,
      email: `${prenomPlanneur.toLowerCase()}.${nomPlanneur.toLowerCase()}@taxicompany.fr`,
      telephone: getRandomPhone(),
      role: 'Planner',
      statut: 'DISPONIBLE'
    }
  })
  users.push(planneur)
  
  // 1 admin
  const { prenom: prenomAdmin, nom: nomAdmin } = getUniqueRandomActeur(usedUserNames)
  const admin = await prisma.user.create({
    data: {
      prenom: prenomAdmin,
      nom: nomAdmin,
      email: `${prenomAdmin.toLowerCase()}.${nomAdmin.toLowerCase()}@taxicompany.fr`,
      telephone: getRandomPhone(),
      role: 'Admin',
      statut: 'DISPONIBLE'
    }
  })
  users.push(admin)
  
  const chauffeurs = users.filter(u => u.role === 'Chauffeur')

  // Créer des véhicules
  console.log('🚗 Création des véhicules...')
  const vehicules = []
  const immatriculations = [
    'AB-123-CD', 'EF-456-GH', 'IJ-789-KL', 'MN-012-OP', 'QR-345-ST',
    'UV-678-WX', 'YZ-901-AB', 'CD-234-EF', 'GH-567-IJ', 'KL-890-MN'
  ]
  
  for (let i = 0; i < 10; i++) {
    const vehicule = await prisma.vehicule.create({
      data: {
        marque: ['Mercedes', 'BMW', 'Audi', 'Volkswagen', 'Peugeot', 'Renault', 'Citroën', 'Ford', 'Toyota', 'Honda'][i],
        modele: ['Classe E', 'Série 5', 'A6', 'Passat', '508', 'Talisman', 'C5', 'Mondeo', 'Camry', 'Accord'][i],
        immatriculation: immatriculations[i],
        couleur: getRandomElement(['Gris métallisé', 'Noir', 'Blanc', 'Bleu nuit', 'Argent']),
        annee: Math.floor(Math.random() * 10) + 2015, // 2015-2024
        actif: true,
        kilometrage: Math.floor(Math.random() * 200000) + 10000, // 10k-210k km
        carburant: getRandomElement(['DIESEL', 'ESSENCE', 'HYBRIDE']),
        notes: i < 3 ? 'Véhicule récent en excellent état' : null
      }
    })
    vehicules.push(vehicule)
  }

  // Créer des assignations de véhicules aux chauffeurs
  console.log('🔗 Création des assignations véhicules...')
  for (let i = 0; i < Math.min(chauffeurs.length, vehicules.length); i++) {
    await prisma.vehiculeAssignation.create({
      data: {
        vehiculeId: vehicules[i].id,
        userId: chauffeurs[i].id,
        dateDebut: new Date(),
        actif: true,
        notes: `Assignation de ${vehicules[i].marque} ${vehicules[i].modele} à ${chauffeurs[i].prenom} ${chauffeurs[i].nom}`
      }
    })
  }

  // Créer 50 clients
  console.log('👥 Création des clients...')
  const clients = []
  const usedClientNames = new Set<string>()
  for (let i = 0; i < 50; i++) {
    const { prenom, nom } = getUniqueRandomActeur(usedClientNames)
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

  // Créer des courses pour les 2 dernières semaines et les 3 prochaines semaines
  console.log('🚗 Création des courses...')
  
  const statuts = ['EN_ATTENTE', 'ASSIGNEE', 'EN_COURS', 'TERMINEE', 'ANNULEE']
  
  let coursesCount = 0
  for (let day = -14; day <= 21; day++) { // De -14 jours à +21 jours
    let coursesForDay = 12 // Base de 12 courses par jour
    let statusWeights = [0.2, 0.3, 0.1, 0.35, 0.05] // Probabilités par défaut
    
    // Ajuster le nombre de courses selon le jour
    if (day === 0) { // Aujourd'hui - plus de courses
      coursesForDay = 25
    } else if (day >= -7 && day < 0) { // Semaine dernière - courses terminées principalement
      coursesForDay = 18
      statusWeights = [0.05, 0.1, 0.02, 0.8, 0.03] // Principalement terminées
    } else if (day > 0) { // Courses futures - principalement en attente
      coursesForDay = 15
      statusWeights = [0.7, 0.25, 0.02, 0.02, 0.01] // Principalement en attente et assignées
    }
    
    coursesCount += coursesForDay
    
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
          userId: chauffeur?.id || null,
          statut: statut as any,
          prix: statut === 'TERMINEE' ? getRandomPrice() : null,
          notes: Math.random() > 0.7 ? 'Instructions spéciales pour cette course' : null
        }
      })
    }
  }

  console.log('✅ Seeding terminé!')
  console.log(`📊 Créé:`)
  console.log(`   - ${users.length} utilisateurs (${chauffeurs.length} chauffeurs, 1 planneur, 1 admin)`)
  console.log(`   - ${vehicules.length} véhicules avec ${Math.min(chauffeurs.length, vehicules.length)} assignations`)
  console.log(`   - ${clients.length} clients`) 
  console.log(`   - ~${coursesCount} courses (sur 5 semaines: 2 passées + 3 futures)`)
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })