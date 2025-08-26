import { useState, useEffect } from 'react'

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
}

export function useSettings() {
  const [settings, setSettings] = useState<CompanySettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSettings = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/settings')
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la récupération des paramètres')
      }
      
      setSettings(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
      console.error('Erreur useSettings:', err)
    } finally {
      setLoading(false)
    }
  }

  const updateSettings = async (newSettings: Partial<CompanySettings>): Promise<boolean> => {
    try {
      setError(null)
      
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newSettings),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la mise à jour des paramètres')
      }
      
      setSettings(data)
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
      console.error('Erreur updateSettings:', err)
      return false
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  return {
    settings,
    loading,
    error,
    updateSettings,
    refetch: fetchSettings
  }
}