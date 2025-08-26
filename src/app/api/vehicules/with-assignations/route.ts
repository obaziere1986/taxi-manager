import { NextRequest, NextResponse } from 'next/server'
import { executeWithRetry } from '@/lib/supabase'

export async function GET() {
  try {
    console.log('🔄 API Véhicules avec assignations - début')
    
    // Récupérer tous les véhicules d'abord
    const vehicules = await executeWithRetry(async (supabase) => {
      const { data, error } = await supabase
        .from('vehicules')
        .select('*')
        .order('actif', { ascending: false })
        .order('marque', { ascending: true })
        .order('modele', { ascending: true })
      
      if (error) throw error
      return data || []
    })

    // Récupérer les assignations actives séparément
    const assignationsActives = await executeWithRetry(async (supabase) => {
      const { data, error } = await supabase
        .from('vehicule_assignations')
        .select(`
          *,
          user:users(
            id,
            nom,
            prenom,
            role
          )
        `)
        .eq('actif', true)
      
      if (error) throw error
      return data || []
    })

    // Transformer pour organiser par catégories
    const vehiculesWithStatus = vehicules.map(vehicule => {
      // Trouver l'assignation active pour ce véhicule
      const assignationActive = assignationsActives.find(a => a.vehicule_id === vehicule.id) || null
      
      return {
        id: vehicule.id,
        marque: vehicule.marque,
        modele: vehicule.modele,
        immatriculation: vehicule.immatriculation,
        couleur: vehicule.couleur,
        annee: vehicule.annee,
        actif: vehicule.actif,
        isAssigned: !!assignationActive,
        assignation: assignationActive ? {
          id: assignationActive.id,
          dateDebut: assignationActive.date_debut,
          assignedTo: `${assignationActive.user.nom.toUpperCase()}, ${assignationActive.user.prenom}`,
          assignedToRole: assignationActive.user.role,
          assignedToId: assignationActive.user.id
        } : null
      }
    })

    console.log(`✅ ${vehiculesWithStatus.length} véhicules récupérés avec statut d'assignation`)
    
    return NextResponse.json(vehiculesWithStatus, { status: 200 })

  } catch (error) {
    console.error('❌ Erreur dans l\'API véhicules avec assignations:', error)
    return NextResponse.json([], { 
      status: 200,
      headers: { 'X-Error': 'true' }
    })
  }
}