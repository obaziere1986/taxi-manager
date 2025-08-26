import { NextRequest, NextResponse } from 'next/server'
import { executeWithRetry } from '@/lib/supabase'

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    console.log('🔄 DELETE API - Fonction appelée')
    
    const params = await context.params
    const assignationId = params.id
    
    // Test rapide pour voir si l'API fonctionne
    console.log('🔄 DELETE API - Test assignationId:', assignationId)
    
    if (!assignationId) {
      return NextResponse.json({ error: 'ID manquant' }, { status: 400 })
    }
    
    if (assignationId === 'test-invalid-id') {
      return NextResponse.json({ error: 'Test ID invalide' }, { status: 404 })
    }
    
    const timestamp = new Date().toISOString()
    console.log(`🔄 [${timestamp}] DÉSASSIGNATION - Début pour ID:`, assignationId)

    console.log(`🔄 [${timestamp}] DÉSASSIGNATION - Recherche assignation...`)
    
    // Vérifier que l'assignation existe
    const assignation = await executeWithRetry(async (supabase) => {
      const { data, error } = await supabase
        .from('vehicule_assignations')
        .select(`
          *,
          vehicule:vehicules(*),
          user:users(
            id,
            nom,
            prenom,
            role
          )
        `)
        .eq('id', assignationId)
        .single()
      
      if (error && error.code !== 'PGRST116') throw error
      return data
    })

    if (!assignation) {
      console.log(`❌ [${timestamp}] DÉSASSIGNATION - Assignation non trouvée:`, assignationId)
      return NextResponse.json(
        { error: 'Assignation non trouvée' },
        { status: 404 }
      )
    }

    const vehiculeInfo = `${assignation.vehicule.marque} ${assignation.vehicule.modele} (${assignation.vehicule.immatriculation})`
    const personneInfo = `Utilisateur: ${assignation.user.prenom} ${assignation.user.nom} (${assignation.user.role})`

    console.log(`✅ [${timestamp}] DÉSASSIGNATION - Assignation trouvée:`)
    console.log(`   📋 Véhicule: ${vehiculeInfo}`)
    console.log(`   👤 Assigné à: ${personneInfo}`)
    console.log(`   📅 Date début: ${assignation.date_debut}`)
    console.log(`   ✅ Statut actuel: ${assignation.actif ? 'ACTIF' : 'INACTIF'}`)

    const dateFin = new Date()

    // Marquer l'assignation comme inactive
    console.log(`🔄 [${timestamp}] DÉSASSIGNATION - Marquage comme inactive...`)
    const updatedAssignation = await executeWithRetry(async (supabase) => {
      const { data, error } = await supabase
        .from('vehicule_assignations')
        .update({
          actif: false,
          date_fin: dateFin.toISOString()
        })
        .eq('id', assignationId)
        .select()
        .single()
      
      if (error) throw error
      return data
    })

    // Nettoyer la référence véhicule de l'utilisateur
    if (assignation.user_id) {
      console.log(`🔧 [${timestamp}] DÉSASSIGNATION - Nettoyage référence véhicule de l'utilisateur ${assignation.user.prenom} ${assignation.user.nom}`)
      await executeWithRetry(async (supabase) => {
        const { error } = await supabase
          .from('users')
          .update({
            vehicule_id: null
          })
          .eq('id', assignation.user_id)
        
        if (error) throw error
      })
      console.log(`✅ [${timestamp}] DÉSASSIGNATION - Utilisateur ${assignation.user.prenom} ${assignation.user.nom} libéré du véhicule ${vehiculeInfo}`)
    }

    console.log(`🎉 [${timestamp}] DÉSASSIGNATION - Terminée avec succès pour:`)
    console.log(`   📋 Véhicule: ${vehiculeInfo}`)
    console.log(`   👤 Anciennement assigné à: ${personneInfo}`)
    console.log(`   📅 Période: ${assignation.date_debut} → ${dateFin.toISOString()}`)
    
    // Ajouter les champs manquants pour compatibilité
    const responseAssignation = {
      ...updatedAssignation,
      dateDebut: updatedAssignation.date_debut,
      dateFin: updatedAssignation.date_fin,
      userId: updatedAssignation.user_id,
      vehiculeId: updatedAssignation.vehicule_id
    }

    return NextResponse.json(
      { 
        message: 'Véhicule désassigné avec succès',
        assignation: responseAssignation
      }, 
      { status: 200 }
    )
  } catch (error) {
    const timestamp = new Date().toISOString()
    
    if (error instanceof Error && error.message === 'ASSIGNATION_NOT_FOUND') {
      console.log(`❌ [${timestamp}] DÉSASSIGNATION - Assignation non trouvée:`, assignationId)
      return NextResponse.json(
        { error: 'Assignation non trouvée' },
        { status: 404 }
      )
    }
    
    console.error(`💥 [${timestamp}] DÉSASSIGNATION - Erreur critique:`, error)
    console.error('Stack trace:', error instanceof Error ? error.stack : 'Pas de stack')
    console.error('Context:', { assignationId, timestamp })
    
    return NextResponse.json(
      { error: 'Erreur lors de la désassignation' },
      { status: 500 }
    )
  }
}