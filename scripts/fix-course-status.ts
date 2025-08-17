#!/usr/bin/env tsx

/**
 * Script pour corriger les incohérences dans la base de données :
 * - Les courses avec statut "EN_ATTENTE" qui ont un chauffeur assigné doivent passer à "ASSIGNEE"
 * - Les courses avec statut différent de "EN_ATTENTE" qui n'ont pas de chauffeur doivent passer à "EN_ATTENTE"
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixCourseStatuses() {
  console.log('🔍 Vérification des incohérences dans les statuts de courses...')
  
  try {
    // 1. Trouver les courses EN_ATTENTE qui ont un chauffeur assigné
    const coursesWithUserButEnAttente = await prisma.course.findMany({
      where: {
        statut: 'EN_ATTENTE',
        userId: {
          not: null
        }
      },
      include: {
        user: {
          select: { nom: true, prenom: true }
        },
        client: {
          select: { nom: true, prenom: true }
        }
      }
    })

    console.log(`📋 Trouvé ${coursesWithUserButEnAttente.length} courses EN_ATTENTE avec chauffeur assigné`)

    if (coursesWithUserButEnAttente.length > 0) {
      console.log('\n📝 Courses à corriger (EN_ATTENTE → ASSIGNEE):')
      coursesWithUserButEnAttente.forEach(course => {
        console.log(`  - ${course.client.nom} ${course.client.prenom} (${new Date(course.dateHeure).toLocaleString('fr-FR')}) → Chauffeur: ${course.user?.nom} ${course.user?.prenom}`)
      })

      // Corriger ces courses
      const result1 = await prisma.course.updateMany({
        where: {
          statut: 'EN_ATTENTE',
          userId: {
            not: null
          }
        },
        data: {
          statut: 'ASSIGNEE'
        }
      })

      console.log(`✅ ${result1.count} courses corrigées vers ASSIGNEE`)
    }

    // 2. Trouver les courses ASSIGNEE/EN_COURS qui n'ont pas de chauffeur
    const coursesWithoutUserButAssigned = await prisma.course.findMany({
      where: {
        OR: [
          { statut: 'ASSIGNEE' },
          { statut: 'EN_COURS' }
        ],
        userId: null
      },
      include: {
        client: {
          select: { nom: true, prenom: true }
        }
      }
    })

    console.log(`\n📋 Trouvé ${coursesWithoutUserButAssigned.length} courses ASSIGNEE/EN_COURS sans chauffeur`)

    if (coursesWithoutUserButAssigned.length > 0) {
      console.log('\n📝 Courses à corriger (ASSIGNEE/EN_COURS → EN_ATTENTE):')
      coursesWithoutUserButAssigned.forEach(course => {
        console.log(`  - ${course.client.nom} ${course.client.prenom} (${new Date(course.dateHeure).toLocaleString('fr-FR')}) - Statut: ${course.statut}`)
      })

      // Corriger ces courses
      const result2 = await prisma.course.updateMany({
        where: {
          OR: [
            { statut: 'ASSIGNEE' },
            { statut: 'EN_COURS' }
          ],
          userId: null
        },
        data: {
          statut: 'EN_ATTENTE'
        }
      })

      console.log(`✅ ${result2.count} courses corrigées vers EN_ATTENTE`)
    }

    // 3. Afficher un résumé final
    console.log('\n📊 Résumé final des statuts:')
    const finalStats = await prisma.course.groupBy({
      by: ['statut'],
      _count: {
        id: true
      }
    })

    finalStats.forEach(stat => {
      console.log(`  ${stat.statut}: ${stat._count.id} courses`)
    })

    console.log('\n✅ Nettoyage terminé avec succès !')

  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Exécuter le script
fixCourseStatuses()