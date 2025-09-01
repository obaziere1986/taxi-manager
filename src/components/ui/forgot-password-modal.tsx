"use client"

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Mail, Phone, CheckCircle } from "lucide-react"

interface ForgotPasswordModalProps {
  isOpen: boolean
  onClose: () => void
}

export function ForgotPasswordModal({ isOpen, onClose }: ForgotPasswordModalProps) {
  const [identifier, setIdentifier] = useState('')
  const [method, setMethod] = useState<'email' | 'sms'>('email')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          identifier: identifier.trim(), 
          method 
        })
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
        // Fermer la modal après 3 secondes
        setTimeout(() => {
          handleClose()
        }, 3000)
      } else {
        setError(data.error || 'Une erreur est survenue')
      }
    } catch (error) {
      setError('Erreur de connexion au serveur')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setIdentifier('')
    setMethod('email')
    setLoading(false)
    setSuccess(false)
    setError('')
    onClose()
  }

  if (success) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-green-600">
              Message envoyé !
            </DialogTitle>
          </DialogHeader>
          <div className="text-center space-y-4">
            <div className="p-4 bg-green-50 rounded-lg">
              <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-2" />
              <p className="text-sm text-gray-600">
                Un lien de réinitialisation a été envoyé {method === 'email' ? 'par email' : 'par SMS'}.
                Vérifiez votre {method === 'email' ? 'boîte mail' : 'téléphone'}.
              </p>
            </div>
            
            <div className="space-y-1">
              <p className="text-xs text-gray-500">
                Le lien expire dans 1 heure.
              </p>
              <p className="text-xs text-gray-500">
                Si vous ne recevez pas le message, vérifiez vos spams.
              </p>
            </div>

            <Button onClick={handleClose} className="w-full">
              Fermer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Mot de passe oublié</DialogTitle>
          <DialogDescription>
            Saisissez votre email ou téléphone pour recevoir un lien de réinitialisation
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Choix méthode */}
          <div className="space-y-2">
            <Label>Méthode de récupération</Label>
            <div className="flex space-x-2">
              <Button
                type="button"
                variant={method === 'email' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setMethod('email')}
                disabled={loading}
                className="flex-1"
              >
                <Mail className="mr-2 h-4 w-4" />
                Email
              </Button>
              <Button
                type="button"
                variant={method === 'sms' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setMethod('sms')}
                disabled={loading}
                className="flex-1"
              >
                <Phone className="mr-2 h-4 w-4" />
                SMS
              </Button>
            </div>
          </div>

          {/* Champ email/téléphone */}
          <div className="space-y-2">
            <Label htmlFor="identifier">
              {method === 'email' ? 'Adresse email' : 'Numéro de téléphone'}
            </Label>
            <Input
              id="identifier"
              type={method === 'email' ? 'email' : 'tel'}
              placeholder={method === 'email' ? 'votre.email@exemple.fr' : '06 12 34 56 78'}
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="flex gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
              disabled={loading}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button 
              type="submit" 
              disabled={loading || !identifier.trim()}
              className="flex-1"
            >
              {loading ? 'Envoi...' : 'Envoyer'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}