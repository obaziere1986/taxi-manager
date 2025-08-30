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
        // Connexion réussie, forcer un reload complet pour que le middleware voie le cookie
        console.log('✅ Connexion réussie, redirection vers /', window.location.origin)
        window.location.replace('/')
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
          {/* TEST HTML avec JavaScript - Solution finale */}
          <form id="loginForm" className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">Login ou Email</label>
              <input
                id="email"
                name="email"
                type="text"
                placeholder="jean.dujardin@taxicompany.fr"
                className="flex h-9 w-full rounded-md border border-gray-300 bg-white px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-400"
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">Mot de passe</label>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="password123"
                className="flex h-9 w-full rounded-md border border-gray-300 bg-white px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-400"
                required
              />
            </div>
            
            <div id="error" className="text-red-600 text-sm hidden"></div>
            
            <button 
              type="submit" 
              id="submitBtn"
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-400 disabled:pointer-events-none disabled:opacity-50 bg-gray-900 text-gray-50 shadow hover:bg-gray-900/90 h-9 px-4 py-2 w-full"
            >
              Se connecter
            </button>
          </form>

          <script dangerouslySetInnerHTML={{
            __html: `
              document.getElementById('loginForm').onsubmit = async function(e) {
                e.preventDefault();
                const btn = document.getElementById('submitBtn');
                const error = document.getElementById('error');
                
                btn.textContent = 'Connexion...';
                btn.disabled = true;
                error.classList.add('hidden');
                
                try {
                  const response = await fetch('/api/simple-login', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({
                      email: document.getElementById('email').value,
                      password: document.getElementById('password').value
                    })
                  });
                  
                  const result = await response.json();
                  
                  if (result.success) {
                    window.location.href = '/';
                  } else {
                    error.textContent = result.message;
                    error.classList.remove('hidden');
                    btn.textContent = 'Se connecter';
                    btn.disabled = false;
                  }
                } catch (err) {
                  error.textContent = 'Erreur de connexion';
                  error.classList.remove('hidden');
                  btn.textContent = 'Se connecter';
                  btn.disabled = false;
                }
              }
            `
          }} />
          
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