"use client"

import { useState } from 'react'
// import { signIn, getSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function LoginPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    login: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/simple-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: formData.login,
          password: formData.password
        })
      })

      const result = await response.json()

      if (result.success) {
        // Connexion réussie, rediriger vers dashboard
        router.push('/')
        router.refresh()
      } else {
        setError(result.message || 'Identifiants incorrects. Veuillez réessayer.')
      }
    } catch (error) {
      console.error('Erreur de connexion:', error)
      setError('Une erreur est survenue. Veuillez réessayer.')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Taxi Manager
          </CardTitle>
          <CardDescription className="text-center">
            Connectez-vous à votre compte
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4" suppressHydrationWarning>
            <div className="space-y-2">
              <Label htmlFor="login">Login ou Email</Label>
              <Input
                id="login"
                name="login"
                type="text"
                placeholder="Votre login ou email"
                value={formData.login}
                onChange={handleChange}
                required
                disabled={loading}
                suppressHydrationWarning
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Votre mot de passe"
                value={formData.password}
                onChange={handleChange}
                required
                disabled={loading}
                suppressHydrationWarning
              />
            </div>
            
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <Button type="submit" className="w-full" disabled={loading} suppressHydrationWarning>
              {loading ? 'Connexion...' : 'Se connecter'}
            </Button>
          </form>
          
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-6 text-center text-sm text-gray-600">
              <p>Comptes de test disponibles :</p>
              <div className="mt-2 space-y-1 text-xs">
                <p><strong>Admin:</strong> jean.dujardin@taxicompany.fr / password123</p>
                <p><strong>Planner:</strong> marion.cotillard@taxicompany.fr / password123</p>
                <p><strong>Chauffeur:</strong> omar.sy@taxicompany.fr / password123</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}