"use client"

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"

interface User {
  id: string
  nom: string
  prenom: string
  email: string
  telephone?: string
  role: 'CHAUFFEUR' | 'PLANNEUR' | 'ADMIN'
  actif: boolean
}

interface UserModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (user: User) => Promise<void>
  user?: User | null
  mode: 'create' | 'edit'
}

export function UserModal({ isOpen, onClose, onSave, user, mode }: UserModalProps) {
  const [formData, setFormData] = useState<Partial<User>>({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    role: 'CHAUFFEUR',
    actif: true
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (mode === 'edit' && user) {
      setFormData(user)
    } else if (mode === 'create') {
      setFormData({
        nom: '',
        prenom: '',
        email: '',
        telephone: '',
        role: 'CHAUFFEUR',
        actif: true
      })
    }
  }, [mode, user, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.nom || !formData.prenom || !formData.email) {
      alert('Veuillez remplir tous les champs obligatoires')
      return
    }

    // Validation email simple
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      alert('Veuillez saisir une adresse email valide')
      return
    }

    setLoading(true)
    try {
      await onSave(formData as User)
      onClose()
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error)
      alert('Erreur lors de la sauvegarde de l\'utilisateur')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Nouvel utilisateur' : 'Modifier l\'utilisateur'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create' 
              ? 'Ajoutez un nouvel utilisateur au système.'
              : 'Modifiez les informations de l\'utilisateur.'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nom">Nom *</Label>
              <Input
                id="nom"
                value={formData.nom || ''}
                onChange={(e) => setFormData({ ...formData, nom: e.target.value.toUpperCase() })}
                placeholder="MARTIN"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="prenom">Prénom *</Label>
              <Input
                id="prenom"
                value={formData.prenom || ''}
                onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                placeholder="Marie"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email || ''}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="marie.martin@taxi.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="telephone">Téléphone</Label>
            <Input
              id="telephone"
              type="tel"
              value={formData.telephone || ''}
              onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
              placeholder="06.12.34.56.78"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Rôle</Label>
            <Select value={formData.role || 'CHAUFFEUR'} onValueChange={(value: 'CHAUFFEUR' | 'PLANNEUR' | 'ADMIN') => setFormData({ ...formData, role: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CHAUFFEUR">Chauffeur</SelectItem>
                <SelectItem value="PLANNEUR">Planneur</SelectItem>
                <SelectItem value="ADMIN">Administrateur</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="actif"
              checked={formData.actif || false}
              onCheckedChange={(checked) => setFormData({ ...formData, actif: checked })}
            />
            <Label htmlFor="actif">Utilisateur actif</Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Sauvegarde...' : (mode === 'create' ? 'Créer' : 'Modifier')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}