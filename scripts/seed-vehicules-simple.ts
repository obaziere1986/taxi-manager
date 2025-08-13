import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedVehicules() {
  console.log('🚗 Création des véhicules de test...')

  const vehicules = [
    {
      marque: 'Peugeot',
      modele: '508',
      immatriculation: 'AB-123-CD',
      couleur: 'Noir',
      annee: 2021,
      actif: true,
      kilometrage: 45000,
      carburant: 'DIESEL',
      notes: 'Véhicule en excellente condition'
    },
    {
      marque: 'Renault',
      modele: 'Talisman',
      immatriculation: 'EF-456-GH',
      couleur: 'Gris',
      annee: 2020,
      actif: true,
      kilometrage: 62000,
      carburant: 'ESSENCE',
      notes: 'Véhicule de direction'
    },
    {
      marque: 'Mercedes',
      modele: 'Classe E',
      immatriculation: 'IJ-789-KL',
      couleur: 'Blanc',
      annee: 2022,
      actif: true,
      kilometrage: 28000,
      carburant: 'HYBRIDE',
      notes: 'Véhicule premium'
    },
    {
      marque: 'Volkswagen',
      modele: 'Passat',
      immatriculation: 'MN-012-OP',
      couleur: 'Bleu',
      annee: 2019,
      actif: true,
      kilometrage: 78000,
      carburant: 'DIESEL',
      notes: 'Véhicule standard'
    },
    {
      marque: 'BMW',
      modele: 'Série 3',
      immatriculation: 'QR-345-ST',
      couleur: 'Noir',
      annee: 2021,
      actif: true,
      kilometrage: 35000,
      carburant: 'ESSENCE',
      notes: 'Véhicule sport'
    },
    {
      marque: 'Audi',
      modele: 'A4',
      immatriculation: 'UV-678-WX',
      couleur: 'Gris',
      annee: 2020,
      actif: false,
      kilometrage: 95000,
      carburant: 'DIESEL',
      notes: 'En maintenance - hors service'
    }
  ]

  for (const vehiculeData of vehicules) {
    try {
      // Vérifier si le véhicule existe déjà
      const existingVehicule = await prisma.vehicule.findFirst({
        where: {
          immatriculation: vehiculeData.immatriculation
        }
      })

      if (!existingVehicule) {
        await prisma.vehicule.create({
          data: vehiculeData
        })
        console.log(`✅ Véhicule créé: ${vehiculeData.marque} ${vehiculeData.modele} (${vehiculeData.immatriculation})`)
      } else {
        console.log(`⏭️  Véhicule existant: ${vehiculeData.immatriculation}`)
      }
    } catch (error) {
      console.error(`❌ Erreur lors de la création du véhicule ${vehiculeData.immatriculation}:`, error)
    }
  }

  console.log('✅ Seeding des véhicules terminé!')
}

seedVehicules()
  .catch((error) => {
    console.error('❌ Erreur lors du seeding des véhicules:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })