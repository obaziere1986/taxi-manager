import { useState, useEffect } from 'react'

export function useCalendarPermission() {
  const [isEnabled, setIsEnabled] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkPermission()
  }, [])

  const checkPermission = async () => {
    try {
      const response = await fetch('/api/permissions/check?permission=calendar.export&role=Chauffeur')
      if (response.ok) {
        const data = await response.json()
        setIsEnabled(data.hasPermission || false)
      }
    } catch (error) {
      console.warn('Erreur lors de la vérification de la permission calendrier:', error)
      setIsEnabled(false)
    } finally {
      setLoading(false)
    }
  }

  const getCalendarUrl = (token: string) => {
    if (!token || !isEnabled) return null
    return `${window.location.origin}/api/calendar/${token}.ics`
  }

  return {
    isEnabled,
    loading,
    getCalendarUrl,
    refresh: checkPermission
  }
}