"use client"

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { PhoneInput } from "@/components/ui/phone-input"
import { Trash2 } from "lucide-react"

interface User {
  id: string
  nom: string
  prenom: string
  email: string
  telephone?: string
  role: 'Admin' | 'Planner' | 'Chauffeur'
  statut?: 'DISPONIBLE' | 'OCCUPE' | 'HORS_SERVICE'
  actif: boolean
}

interface UserModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (user: User) => Promise<void>
  onPermanentDelete?: (userId: string) => Promise<void>
  user?: User | null
  mode: 'create' | 'edit'
}

export function UserModal({ isOpen, onClose, onSave, onPermanentDelete, user, mode }: UserModalProps) {
  const { data: session } = useSession()
  const [formData, setFormData] = useState<Partial<User>>({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    role: 'Chauffeur',
    statut: 'DISPONIBLE',
    actif: true
  })
  const [loading, setLoading] = useState(false)

  // Logique de restrictions de rôles
  const isAdmin = session?.user?.role === 'Admin'
  const isPlanner = session?.user?.role === 'Planner'
  const isEditingAdmin = user && user.role === 'Admin'
  
  // Les planners ne peuvent pas modifier les admins
  const canEditUser = isAdmin || (isPlanner && !isEditingAdmin)
  
  // Les planners ne peuvent pas modifier les rôles
  const canModifyRole = isAdmin

  useEffect(() => {
    if (mode === 'edit' && user) {
      setFormData(user)
    } else if (mode === 'create') {
      setFormData({
        nom: '',
        prenom: '',
        email: '',
        telephone: '',
        role: 'Chauffeur',
        statut: 'DISPONIBLE',
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

  const handlePermanentDelete = async () => {
    if (!user || !onPermanentDelete) return
    
    const confirmed = confirm(
      `ATTENTION: Supprimer définitivement ${user.prenom} ${user.nom} ?\n\nCette action est irréversible et effacera l'utilisateur de la base de données.\nLes courses assignées afficheront "Utilisateur supprimé".`
    )
    
    if (confirmed) {
      try {
        await onPermanentDelete(user.id)
        onClose()
      } catch (error) {
        console.error('Erreur lors de la suppression définitive:', error)
        alert('Erreur lors de la suppression définitive')
      }
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

          <PhoneInput
            id="telephone"
            label="Téléphone"
            value={formData.telephone || ''}
            onChange={(value) => setFormData({ ...formData, telephone: value })}
          />

          <div className="space-y-2">
            <Label htmlFor="role">Rôle</Label>
            {canModifyRole ? (
              <Select 
                value={formData.role || 'Chauffeur'} 
                onValueChange={(value: 'Admin' | 'Planner' | 'Chauffeur') => 
                  setFormData({ ...formData, role: value, statut: value === 'Chauffeur' ? (formData.statut || 'DISPONIBLE') : undefined })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Chauffeur">Chauffeur</SelectItem>
                  <SelectItem value="Planner">Planner</SelectItem>
                  <SelectItem value="Admin">Administrateur</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <div className="px-3 py-2 bg-muted text-muted-foreground rounded-md border">
                {formData.role === 'Admin' ? 'Administrateur' : 
                 formData.role === 'Planner' ? 'Planner' : 'Chauffeur'}
                <p className="text-xs mt-1">Modification du rôle restreinte</p>
              </div>
            )}
          </div>

          {/* Statut (seulement pour les chauffeurs) */}
          {formData.role === 'Chauffeur' && (
            <div className="space-y-2">
              <Label htmlFor="statut">Statut</Label>
              <Select value={formData.statut || 'DISPONIBLE'} onValueChange={(value: 'DISPONIBLE' | 'OCCUPE' | 'HORS_SERVICE') => setFormData({ ...formData, statut: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DISPONIBLE">Disponible</SelectItem>
                  <SelectItem value="OCCUPE">Occupé</SelectItem>
                  <SelectItem value="HORS_SERVICE">Hors service</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex items-center space-x-2">
            <Switch
              id="actif"
              checked={formData.actif || false}
              onCheckedChange={(checked) => setFormData({ ...formData, actif: checked })}
            />
            <Label htmlFor="actif">Utilisateur actif</Label>
          </div>

          <DialogFooter className="flex-col gap-4">
            {/* Bouton de suppression définitive pour les utilisateurs inactifs */}
            {mode === 'edit' && user && !user.actif && onPermanentDelete && (
              <div className="flex w-full">
                <Button 
                  type="button" 
                  variant="destructive" 
                  onClick={handlePermanentDelete}
                  className="w-full"
                  disabled={loading}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer définitivement
                </Button>
              </div>
            )}
            
            <div className="flex gap-2 w-full">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Annuler
              </Button>
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? 'Sauvegarde...' : (mode === 'create' ? 'Créer' : 'Modifier')}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}