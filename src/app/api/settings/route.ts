import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { executeWithRetry } from '@/lib/supabase'

// Interface pour les paramètres d'entreprise
interface CompanySettings {
  id?: string
  company_name: string
  company_phone?: string
  company_email?: string
  company_address?: string
  opening_hours: string
  closing_hours: string
  base_fare: number
  price_per_km_day: number
  price_per_km_night: number
  night_start_time: string
  night_end_time: string
  average_trip_duration: number
  max_distance_km: number
  timezone: string
  currency: string
  language: string
  created_at?: string
  updated_at?: string
}

// GET - Récupérer les paramètres de l'entreprise
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const settings = await executeWithRetry(async (supabase) => {
      const { data, error } = await supabase
        .from('company_settings')
        .select('*')
        .single()
      
      if (error && error.code !== 'PGRST116') throw error
      return data
    })

    // Si aucun paramètre n'existe, retourner des valeurs par défaut
    if (!settings) {
      const defaultSettings: Partial<CompanySettings> = {
        company_name: 'Taxi Manager',
        company_phone: '',
        company_email: '',
        company_address: '',
        opening_hours: '06:00',
        closing_hours: '23:00',
        base_fare: 4.20,
        price_per_km_day: 1.15,
        price_per_km_night: 1.50,
        night_start_time: '20:00',
        night_end_time: '07:00',
        average_trip_duration: 45,
        max_distance_km: 100,
        timezone: 'Europe/Paris',
        currency: 'EUR',
        language: 'fr-FR'
      }
      return NextResponse.json(defaultSettings)
    }

    // Mapper les champs pour le frontend (garder les noms snake_case)
    return NextResponse.json(settings)
    
  } catch (error) {
    console.error('Erreur lors de la récupération des paramètres:', error)
    console.error('Détails:', error instanceof Error ? error.message : 'Erreur inconnue')
    return NextResponse.json({ 
      error: 'Erreur serveur',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 })
  }
}

// PUT - Mettre à jour les paramètres de l'entreprise
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Seuls les admins peuvent modifier les paramètres
    if (session.user.role !== 'Admin') {
      return NextResponse.json({ error: 'Accès refusé - Admin requis' }, { status: 403 })
    }

    const body = await request.json()
    
    // Validation basique
    if (!body.company_name) {
      return NextResponse.json({ error: 'Le nom de l\'entreprise est requis' }, { status: 400 })
    }

    const settings = await executeWithRetry(async (supabase) => {
      // Vérifier si des paramètres existent déjà
      const { data: existingSettings } = await supabase
        .from('company_settings')
        .select('id')
        .single()

      if (existingSettings) {
        // Mettre à jour les paramètres existants
        const { data, error } = await supabase
          .from('company_settings')
          .update({
            company_name: body.company_name,
            company_phone: body.company_phone || null,
            company_email: body.company_email || null,
            company_address: body.company_address || null,
            opening_hours: body.opening_hours || '06:00:00',
            closing_hours: body.closing_hours || '23:00:00',
            base_fare: parseFloat(body.base_fare) || 4.20,
            price_per_km_day: parseFloat(body.price_per_km_day) || 1.15,
            price_per_km_night: parseFloat(body.price_per_km_night) || 1.50,
            night_start_time: body.night_start_time || '20:00:00',
            night_end_time: body.night_end_time || '07:00:00',
            average_trip_duration: parseInt(body.average_trip_duration) || 45,
            max_distance_km: parseInt(body.max_distance_km) || 100,
            timezone: body.timezone || 'Europe/Paris',
            currency: body.currency || 'EUR',
            language: body.language || 'fr-FR',
            updated_at: new Date().toISOString()
          })
          .eq('id', existingSettings.id)
          .select()
          .single()
        
        if (error) throw error
        return data
      } else {
        // Créer de nouveaux paramètres
        const { data, error } = await supabase
          .from('company_settings')
          .insert({
            company_name: body.company_name,
            company_phone: body.company_phone || null,
            company_email: body.company_email || null,
            company_address: body.company_address || null,
            opening_hours: body.opening_hours || '06:00:00',
            closing_hours: body.closing_hours || '23:00:00',
            base_fare: parseFloat(body.base_fare) || 4.20,
            price_per_km_day: parseFloat(body.price_per_km_day) || 1.15,
            price_per_km_night: parseFloat(body.price_per_km_night) || 1.50,
            night_start_time: body.night_start_time || '20:00:00',
            night_end_time: body.night_end_time || '07:00:00',
            average_trip_duration: parseInt(body.average_trip_duration) || 45,
            max_distance_km: parseInt(body.max_distance_km) || 100,
            timezone: body.timezone || 'Europe/Paris',
            currency: body.currency || 'EUR',
            language: body.language || 'fr-FR'
          })
          .select()
          .single()
        
        if (error) throw error
        return data
      }
    })

    return NextResponse.json(settings)
    
  } catch (error) {
    console.error('Erreur lors de la mise à jour des paramètres:', error)
    console.error('Type d\'erreur:', typeof error)
    console.error('Message d\'erreur:', error instanceof Error ? error.message : 'Erreur inconnue')
    console.error('Stack trace:', error instanceof Error ? error.stack : 'Pas de stack')
    return NextResponse.json({ 
      error: 'Erreur serveur',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 })
  }
}