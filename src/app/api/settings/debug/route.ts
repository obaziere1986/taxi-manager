import { NextResponse } from 'next/server'

// API de debug pour tester les settings sans dépendance Supabase
export async function GET() {
  try {
    // Retourner des données fictives pour déboguer l'interface
    const debugSettings = {
      id: 'debug-id',
      company_name: 'Taxis Excellence (Debug)',
      company_phone: '01 23 45 67 89',
      company_email: 'contact@taxis-excellence.fr',
      company_address: '123 Rue de la République\n75001 Paris',
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
      language: 'fr-FR',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    console.log('🔍 Debug settings GET - données fictives retournées')
    return NextResponse.json(debugSettings)
    
  } catch (error) {
    console.error('❌ Erreur debug GET:', error)
    return NextResponse.json({ error: 'Erreur debug' }, { status: 500 })
  }
}

export async function PUT(request: any) {
  try {
    const body = await request.json()
    console.log('🔍 Debug settings PUT - données reçues:', Object.keys(body))
    console.log('Company name:', body.company_name)
    
    // Simuler une sauvegarde réussie
    const updatedSettings = {
      ...body,
      id: 'debug-id',
      updated_at: new Date().toISOString()
    }
    
    console.log('✅ Debug settings PUT - sauvegarde simulée avec succès')
    return NextResponse.json(updatedSettings)
    
  } catch (error) {
    console.error('❌ Erreur debug PUT:', error)
    return NextResponse.json({ 
      error: 'Erreur debug PUT',
      details: error instanceof Error ? error.message : 'Inconnue'
    }, { status: 500 })
  }
}