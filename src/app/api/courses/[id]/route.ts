import { NextRequest, NextResponse } from 'next/server'
import { executeWithRetry } from '@/lib/supabase'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { origine, destination, dateHeure, clientId, userId, notes, statut } = body

    const course = await executeWithRetry(async (supabase) => {
      // D'abord récupérer la course existante pour la logique automatique
      const { data: existingCourse, error: fetchError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', id)
        .single()
      
      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          throw new Error('Course non trouvée')
        }
        throw fetchError
      }
      
      if (!existingCourse) {
        throw new Error('Course non trouvée')
      }
      
      // Construire l'objet data seulement avec les champs fournis
      const updateData: any = {}
      
      if (origine !== undefined) updateData.origine = origine
      if (destination !== undefined) updateData.destination = destination
      if (dateHeure !== undefined) updateData.date_heure = new Date(dateHeure).toISOString()
      if (clientId !== undefined) updateData.client_id = clientId
      if (userId !== undefined) updateData.user_id = userId || null
      if (notes !== undefined) updateData.notes = notes || null
      if (statut !== undefined) updateData.statut = statut
      
      // Logique automatique du statut si userId change et que statut n'est pas explicitement fourni
      if (userId !== undefined && statut === undefined) {
        const newUserId = userId || null
        const currentUserId = existingCourse.user_id
        
        // ✅ LOGIQUE RENFORCÉE : Synchronisation automatique statut/chauffeur
        
        // Si on assigne un chauffeur mais le statut est EN_ATTENTE, passer à ASSIGNEE
        if (newUserId && ['EN_ATTENTE'].includes(existingCourse.statut)) {
          updateData.statut = 'ASSIGNEE'
          console.log(`🔄 Statut auto-corrigé: ${existingCourse.statut} → ASSIGNEE (chauffeur assigné)`)
        }
        // Si on retire le chauffeur mais le statut est ASSIGNEE/EN_COURS, revenir à EN_ATTENTE
        else if (!newUserId && ['ASSIGNEE', 'EN_COURS'].includes(existingCourse.statut)) {
          updateData.statut = 'EN_ATTENTE'
          console.log(`🔄 Statut auto-corrigé: ${existingCourse.statut} → EN_ATTENTE (chauffeur retiré)`)
        }
        // Si statut fourni explicitement, on applique la logique de cohérence
        else if (statut !== undefined) {
          if (newUserId && statut === 'EN_ATTENTE') {
            updateData.statut = 'ASSIGNEE'
            console.log(`🔄 Statut auto-corrigé: ${statut} → ASSIGNEE (incohérent avec chauffeur)`)
          } else if (!newUserId && ['ASSIGNEE', 'EN_COURS'].includes(statut)) {
            updateData.statut = 'EN_ATTENTE'
            console.log(`🔄 Statut auto-corrigé: ${statut} → EN_ATTENTE (incohérent sans chauffeur)`)
          }
        }
      }
      
      // Mettre à jour la course
      const { data: updatedCourse, error: updateError } = await supabase
        .from('courses')
        .update(updateData)
        .eq('id', id)
        .select(`
          *,
          clients!courses_client_id_fkey (
            id,
            nom,
            prenom,
            telephone
          ),
          users!courses_user_id_fkey (
            id,
            nom,
            prenom,
            vehicule,
            role
          )
        `)
        .single()

      if (updateError) {
        throw updateError
      }

      // Trigger des emails clients selon les changements de statut
      if (updateData.statut && updateData.statut !== existingCourse.statut) {
        console.log(`📧 Changement de statut: ${existingCourse.statut} → ${updateData.statut}`)
        
        // Course terminée → Vérifier si avis activé avant de créer entrée avis + envoyer email
        if (updateData.statut === 'TERMINEE' && updatedCourse.clients?.email && updatedCourse.users) {
          try {
            // Vérifier les paramètres globaux d'avis
            const { data: companySettings } = await supabase
              .from('company_settings')
              .select('reviews_enabled, reviews_auto_send')
              .single()
            
            // Vérifier si le client a désactivé les avis
            const { data: clientSettings } = await supabase
              .from('clients')
              .select('reviews_disabled')
              .eq('id', updatedCourse.client_id)
              .single()
            
            const reviewsGloballyEnabled = companySettings?.reviews_enabled !== false
            const reviewsAutoSendEnabled = companySettings?.reviews_auto_send !== false
            const clientOptedOut = clientSettings?.reviews_disabled === true
            
            console.log(`🔧 Paramètres avis: global=${reviewsGloballyEnabled}, auto=${reviewsAutoSendEnabled}, client_opt_out=${clientOptedOut}`)
            
            // Procéder seulement si tout est activé et client n'a pas refusé
            if (reviewsGloballyEnabled && reviewsAutoSendEnabled && !clientOptedOut) {
              // Générer un token unique pour l'avis
              const reviewToken = `review_${id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
              
              // Créer l'entrée dans avis_clients
              const { error: reviewError } = await supabase
                .from('avis_clients')
                .insert({
                  course_id: id,
                  client_id: updatedCourse.client_id,
                  review_token: reviewToken,
                  email_sent_at: new Date().toISOString(),
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                })
              
              if (reviewError) {
                console.error('Erreur création avis client:', reviewError)
              } else {
                console.log('✅ Envoi email d\'avis automatique activé')
                // Envoyer l'email de fin de course avec lien avis
              fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/mail/send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  type: 'client_course_completed_with_review',
                  to: updatedCourse.clients.email,
                  variables: {
                    client: {
                      nom: updatedCourse.clients.nom,
                      prenom: updatedCourse.clients.prenom
                    },
                    course: {
                      id: updatedCourse.id,
                      origine: updatedCourse.origine,
                      destination: updatedCourse.destination,
                      dateHeure: updatedCourse.date_heure,
                      prix: updatedCourse.prix
                    },
                    user: {
                      nom: updatedCourse.users.nom,
                      prenom: updatedCourse.users.prenom
                    },
                    reviewToken
                  }
                })
              }).catch(err => console.error('Erreur envoi email course terminée:', err))
              }
            } else {
              console.log('🚫 Envoi d\'avis désactivé:', {
                global: reviewsGloballyEnabled,
                auto: reviewsAutoSendEnabled,
                clientOptOut: clientOptedOut
              })
            }
          } catch (error) {
            console.error('Erreur automation avis client:', error)
          }
        }
      }
      
      // Trigger email d'assignation si chauffeur assigné
      if (userId !== undefined && userId !== existingCourse.user_id && userId && updatedCourse.users && updatedCourse.clients?.email) {
        try {
          fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/mail/send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'client_driver_assigned',
              to: updatedCourse.clients.email,
              variables: {
                client: {
                  nom: updatedCourse.clients.nom,
                  prenom: updatedCourse.clients.prenom
                },
                course: {
                  id: updatedCourse.id,
                  origine: updatedCourse.origine,
                  destination: updatedCourse.destination,
                  dateHeure: updatedCourse.date_heure
                },
                user: {
                  nom: updatedCourse.users.nom,
                  prenom: updatedCourse.users.prenom,
                  telephone: updatedCourse.users.telephone
                }
              }
            })
          }).catch(err => console.error('Erreur envoi email assignation:', err))
        } catch (error) {
          console.error('Erreur automation email assignation:', error)
        }
      }

      return updatedCourse
    })

    return NextResponse.json(course)
  } catch (error) {
    console.error('Erreur mise à jour course:', error)
    return NextResponse.json({ 
      error: 'Erreur lors de la mise à jour de la course',
      details: process.env.NODE_ENV === 'development' ? error : undefined
    }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await executeWithRetry(async (supabase) => {
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', id)

      if (error) {
        throw error
      }

      return true
    })

    return NextResponse.json({ message: 'Course supprimée avec succès' })
  } catch (error) {
    console.error('Erreur suppression course:', error)
    return NextResponse.json({ 
      error: 'Erreur lors de la suppression de la course',
      details: process.env.NODE_ENV === 'development' ? error : undefined
    }, { status: 500 })
  }
}