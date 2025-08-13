"use client"

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PhoneInput } from "@/components/ui/phone-input"

interface Chauffeur {
  id: string
  nom: string
  prenom: string
  telephone?: string
  statut: 'DISPONIBLE' | 'OCCUPE' | 'HORS_SERVICE'
}

interface ChauffeurModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (chauffeur: Chauffeur) => Promise<void>
  chauffeur?: Chauffeur | null
  mode: 'create' | 'edit'
}

export function ChauffeurModal({ isOpen, onClose, onSave, chauffeur, mode }: ChauffeurModalProps) {
  const [formData, setFormData] = useState<Partial<Chauffeur>>({
    nom: '',
    prenom: '',
    telephone: '',
    statut: 'DISPONIBLE'
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (mode === 'edit' && chauffeur) {
      setFormData(chauffeur)
    } else if (mode === 'create') {
      setFormData({
        nom: '',
        prenom: '',
        telephone: '',
        statut: 'DISPONIBLE'
      })
    }
  }, [mode, chauffeur, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.nom || !formData.prenom) {
      alert('Veuillez remplir tous les champs obligatoires')
      return
    }

    setLoading(true)
    try {
      await onSave(formData as Chauffeur)
      onClose()
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error)
      alert('Erreur lors de la sauvegarde du chauffeur')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Nouveau chauffeur' : 'Modifier le chauffeur'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create' 
              ? 'Ajoutez un nouveau chauffeur au système.'
              : 'Modifiez les informations du chauffeur.'
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
                placeholder="Jean"
                required
              />
            </div>
          </div>

          <PhoneInput
            id="telephone"
            label="Téléphone"
            value={formData.telephone || ''}
            onChange={(value) => setFormData({ ...formData, telephone: value })}
          />

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