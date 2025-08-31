'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { signOut } from 'next-auth/react'

export default function CleanupPage() {
  const [cleaning, setCleaning] = useState(false)
  const [message, setMessage] = useState('')
  const [debugInfo, setDebugInfo] = useState({
    cookies: '',
    url: '',
    domain: ''
  })

  useEffect(() => {
    // Initialiser les infos debug côté client seulement
    setDebugInfo({
      cookies: document.cookie || 'Aucun',
      url: window.location.href,
      domain: window.location.hostname
    })
  }, [])

  const cleanupCookies = async () => {
    setCleaning(true)
    setMessage('')
    
    try {
      // 1. Nettoyer côté client
      document.cookie.split(";").forEach(cookie => {
        const eqPos = cookie.indexOf("=")
        const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim()
        
        // Supprimer pour différents domaines/paths
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.flowcab.fr`
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=app.flowcab.fr`
      })
      
      // 2. Nettoyer côté serveur
      const response = await fetch('/api/admin/cleanup-cookies', {
        method: 'POST'
      })
      
      if (!response.ok) {
        throw new Error('Erreur serveur')
      }
      
      // 3. Déconnexion NextAuth propre
      await signOut({ 
        redirect: false,
        callbackUrl: '/login'
      })
      
      setMessage('✅ Nettoyage terminé ! Cookies supprimés et session NextAuth fermée.')
      
      // 4. Redirection après 2 secondes
      setTimeout(() => {
        window.location.href = '/login'
      }, 2000)
      
    } catch (error) {
      console.error('Erreur cleanup:', error)
      setMessage('❌ Erreur lors du nettoyage')
    } finally {
      setCleaning(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          🧹 Nettoyage des Cookies
        </h1>
        
        <p className="text-gray-600 mb-6">
          Cet outil supprime tous les cookies d'authentification (anciens JWT + NextAuth) 
          et force une déconnexion propre.
        </p>
        
        <Button 
          onClick={cleanupCookies}
          disabled={cleaning}
          className="w-full mb-4"
          variant="destructive"
        >
          {cleaning ? 'Nettoyage...' : 'Nettoyer tous les cookies'}
        </Button>
        
        {message && (
          <div className={`p-3 rounded ${
            message.includes('✅') 
              ? 'bg-green-100 text-green-700' 
              : 'bg-red-100 text-red-700'
          }`}>
            {message}
          </div>
        )}
        
        <div className="mt-6 text-xs text-gray-500">
          <strong>Debug info:</strong>
          <br />
          <strong>Cookies actuels:</strong> {debugInfo.cookies}
          <br />
          <strong>URL:</strong> {debugInfo.url}
          <br />
          <strong>Domain:</strong> {debugInfo.domain}
        </div>
      </div>
    </div>
  )
}