import { PrismaClient } from '@prisma/client'
import { addDays, addWeeks, addMonths } from 'date-fns'

const prisma = new PrismaClient()

async function seedVehicles() {
  console.log('🚗 Création des véhicules de test...')

  // Récupérer tous les chauffeurs existants
  const chauffeurs = await prisma.chauffeur.findMany()
  
  if (chauffeurs.length === 0) {
    console.error('❌ Aucun chauffeur trouvé. Veuillez d\'abord créer des chauffeurs.')
    return
  }

  const today = new Date()

  // Définir les véhicules de test avec différents niveaux d'alerte
  const vehiculesData = [
    {
      marque: "Peugeot",
      modele: "508",
      immatriculation: "AB-123-CD",
      couleur: "Gris métallisé",
      annee: 2020,
      kilometrage: 85000,
      carburant: "DIESEL",
      // Alerte critique - en retard
      prochaineVidange: addDays(today, -5), // 5 jours en retard
      prochainEntretien: addMonths(today, 2),
      prochainControleTechnique: addMonths(today, 8),
      notes: "Véhicule principal - vidange en retard",
      chauffeurId: chauffeurs[0]?.id
    },
    {
      marque: "Renault",
      modele: "Clio",
      immatriculation: "EF-456-GH",
      couleur: "Blanc nacré",
      annee: 2019,
      kilometrage: 72000,
      carburant: "ESSENCE",
      // Alerte danger - dans 3 jours
      prochaineVidange: addMonths(today, 1),
      prochainEntretien: addDays(today, 3), // 3 jours
      prochainControleTechnique: addMonths(today, 6),
      notes: "Véhicule compact - entretien urgent",
      chauffeurId: chauffeurs[1]?.id
    },
    {
      marque: "Citroën",
      modele: "C4",
      immatriculation: "IJ-789-KL",
      couleur: "Bleu métallisé",
      annee: 2021,
      kilometrage: 45000,
      carburant: "HYBRIDE",
      // Alerte warning - dans 2 semaines
      prochaineVidange: addWeeks(today, 2), // 2 semaines
      prochainEntretien: addMonths(today, 3),
      prochainControleTechnique: addDays(today, 25), // 25 jours
      notes: "Véhicule hybride récent",
      chauffeurId: chauffeurs[2]?.id
    },
    {
      marque: "Mercedes",
      modele: "E-Class",
      immatriculation: "MN-012-OP",
      couleur: "Noir",
      annee: 2022,
      kilometrage: 35000,
      carburant: "DIESEL",
      // Alerte info - dans 2 mois
      prochaineVidange: addMonths(today, 2), // 2 mois
      prochainEntretien: addMonths(today, 4),
      prochainControleTechnique: addMonths(today, 12),
      notes: "Véhicule premium - bon état",
      chauffeurId: chauffeurs[3]?.id
    },
    {
      marque: "BMW",
      modele: "Serie 3",
      immatriculation: "QR-345-ST",
      couleur: "Gris anthracite",
      annee: 2023,
      kilometrage: 18000,
      carburant: "ESSENCE",
      // Pas d'alerte - tout est dans les temps
      prochaineVidange: addMonths(today, 4),
      prochainEntretien: addMonths(today, 6),
      prochainControleTechnique: addMonths(today, 18),
      notes: "Véhicule récent - aucune alerte",
      chauffeurId: null // Non assigné
    },
    {
      marque: "Volkswagen",
      modele: "Passat",
      immatriculation: "UV-678-WX",
      couleur: "Rouge",
      annee: 2018,
      kilometrage: 125000,
      carburant: "DIESEL",
      // Multiples alertes critiques
      prochaineVidange: addDays(today, -10), // 10 jours en retard
      prochainEntretien: addDays(today, -3), // 3 jours en retard
      prochainControleTechnique: addDays(today, 4), // dans 4 jours
      notes: "Véhicule ancien - multiples alertes",
      chauffeurId: chauffeurs[4]?.id
    },
    {
      marque: "Tesla",
      modele: "Model 3",
      immatriculation: "YZ-901-AB",
      couleur: "Blanc",
      annee: 2024,
      kilometrage: 5000,
      carburant: "ELECTRIQUE",
      // Véhicule électrique - pas de vidange, entretien spécialisé
      prochaineVidange: null, // Pas de vidange pour électrique
      prochainEntretien: addMonths(today, 12), // Entretien annuel
      prochainControleTechnique: addMonths(today, 48), // CT à 4 ans pour véhicule neuf
      notes: "Véhicule électrique - maintenance spécialisée",
      chauffeurId: null // Non assigné
    }
  ]

  // Créer les véhicules
  for (const vehiculeData of vehiculesData) {
    try {
      const vehicule = await prisma.vehicule.create({
        data: {
          marque: vehiculeData.marque,
          modele: vehiculeData.modele,
          immatriculation: vehiculeData.immatriculation,
          couleur: vehiculeData.couleur,
          annee: vehiculeData.annee,
          kilometrage: vehiculeData.kilometrage,
          carburant: vehiculeData.carburant,
          prochaineVidange: vehiculeData.prochaineVidange,
          prochainEntretien: vehiculeData.prochainEntretien,
          prochainControleTechnique: vehiculeData.prochainControleTechnique,
          notes: vehiculeData.notes,
          actif: true,
        }
      })

      // Créer l'assignation si un chauffeur est spécifié
      if (vehiculeData.chauffeurId) {
        await prisma.vehiculeAssignation.create({
          data: {
            vehiculeId: vehicule.id,
            chauffeurId: vehiculeData.chauffeurId,
            dateDebut: addDays(today, -30), // Assigné depuis 30 jours
            actif: true,
            notes: `Assignation automatique lors du seeding`
          }
        })

        // Mettre à jour le chauffeur avec l'ID du véhicule
        await prisma.chauffeur.update({
          where: { id: vehiculeData.chauffeurId },
          data: { vehiculeId: vehicule.id }
        })
      }

      console.log(`✅ Véhicule créé: ${vehicule.marque} ${vehicule.modele} (${vehicule.immatriculation})`)
    } catch (error) {
      console.error(`❌ Erreur lors de la création du véhicule ${vehiculeData.immatriculation}:`, error)
    }
  }

  // Créer quelques assignations historiques
  console.log('📊 Création de l\'historique des assignations...')
  
  const vehicules = await prisma.vehicule.findMany()
  
  if (vehicules.length >= 2 && chauffeurs.length >= 2) {
    // Créer une assignation historique (terminée)
    await prisma.vehiculeAssignation.create({
      data: {
        vehiculeId: vehicules[0].id,
        chauffeurId: chauffeurs[1].id,
        dateDebut: addDays(today, -90), // Il y a 3 mois
        dateFin: addDays(today, -60),   // Terminée il y a 2 mois
        actif: false,
        notes: "Assignation temporaire - chauffeur remplaçant"
      }
    })

    // Créer une autre assignation historique
    await prisma.vehiculeAssignation.create({
      data: {
        vehiculeId: vehicules[1].id,
        chauffeurId: chauffeurs[0].id,
        dateDebut: addDays(today, -180), // Il y a 6 mois
        dateFin: addDays(today, -150),   // Terminée il y a 5 mois
        actif: false,
        notes: "Ancien chauffeur avant réassignation"
      }
    })

    console.log('✅ Historique des assignations créé')
  }

  console.log('🎉 Seeding des véhicules terminé!')
}

// Exécuter le script
seedVehicles()
  .catch((e) => {
    console.error('❌ Erreur lors du seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })