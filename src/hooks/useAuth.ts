"use client"

import { useState, useEffect } from 'react'

interface User {
  id: string
  email: string
  name: string
  role: string
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/current-user')
        const result = await response.json()
        
        if (result.success) {
          setUser(result.user)
        }
      } catch (error) {
        console.error('Erreur chargement utilisateur:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [])

  return {
    data: user ? { user } : null,
    status: loading ? 'loading' : (user ? 'authenticated' : 'unauthenticated')
  }
}