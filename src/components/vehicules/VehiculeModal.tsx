"use client"

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { format } from 'date-fns'

interface Vehicule {
  id: string
  marque: string
  modele: string
  immatriculation: string
  couleur?: string
  annee?: number
  actif: boolean
  kilometrage?: number
  carburant?: string
  prochaineVidange?: string
  prochainEntretien?: string
  prochainControleTechnique?: string
  notes?: string
}

interface VehiculeModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (vehicule: Vehicule) => Promise<void>
  vehicule?: Vehicule | null
  mode: 'create' | 'edit'
}

export function VehiculeModal({ isOpen, onClose, onSave, vehicule, mode }: VehiculeModalProps) {
  const [formData, setFormData] = useState<Partial<Vehicule>>({
    marque: '',
    modele: '',
    immatriculation: '',
    couleur: '',
    annee: new Date().getFullYear(),
    actif: true,
    kilometrage: 0,
    carburant: 'ESSENCE',
    notes: ''
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (mode === 'edit' && vehicule) {
      setFormData({
        ...vehicule,
        prochaineVidange: vehicule.prochaineVidange ? vehicule.prochaineVidange.split('T')[0] : '',
        prochainEntretien: vehicule.prochainEntretien ? vehicule.prochainEntretien.split('T')[0] : '',
        prochainControleTechnique: vehicule.prochainControleTechnique ? vehicule.prochainControleTechnique.split('T')[0] : ''
      })
    } else if (mode === 'create') {
      setFormData({
        marque: '',
        modele: '',
        immatriculation: '',
        couleur: '',
        annee: new Date().getFullYear(),
        actif: true,
        kilometrage: 0,
        carburant: 'ESSENCE',
        notes: ''
      })
    }
  }, [mode, vehicule, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.marque || !formData.modele || !formData.immatriculation) {
      alert('Veuillez remplir tous les champs obligatoires')
      return
    }

    setLoading(true)
    try {
      // Convertir les dates ISO pour l'API
      const vehiculeData = {
        ...formData,
        prochaineVidange: formData.prochaineVidange ? new Date(formData.prochaineVidange).toISOString() : undefined,
        prochainEntretien: formData.prochainEntretien ? new Date(formData.prochainEntretien).toISOString() : undefined,
        prochainControleTechnique: formData.prochainControleTechnique ? new Date(formData.prochainControleTechnique).toISOString() : undefined,
      } as Vehicule

      await onSave(vehiculeData)
      onClose()
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error)
      alert('Erreur lors de la sauvegarde du véhicule')
    } finally {
      setLoading(false)
    }
  }

  const formatDateForInput = (dateStr?: string) => {
    if (!dateStr) return ''
    return format(new Date(dateStr), 'yyyy-MM-dd')
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Nouveau véhicule' : 'Modifier le véhicule'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create' 
              ? 'Ajoutez un nouveau véhicule au parc automobile.'
              : 'Modifiez les informations du véhicule.'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informations de base */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-muted-foreground">Informations générales</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="marque">Marque *</Label>
                <Input
                  id="marque"
                  value={formData.marque || ''}
                  onChange={(e) => setFormData({ ...formData, marque: e.target.value })}
                  placeholder="Peugeot, Renault..."
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="modele">Modèle *</Label>
                <Input
                  id="modele"
                  value={formData.modele || ''}
                  onChange={(e) => setFormData({ ...formData, modele: e.target.value })}
                  placeholder="508, Clio..."
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="immatriculation">Immatriculation *</Label>
                <Input
                  id="immatriculation"
                  value={formData.immatriculation || ''}
                  onChange={(e) => setFormData({ ...formData, immatriculation: e.target.value.toUpperCase() })}
                  placeholder="AB-123-CD"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="couleur">Couleur</Label>
                <Input
                  id="couleur"
                  value={formData.couleur || ''}
                  onChange={(e) => setFormData({ ...formData, couleur: e.target.value })}
                  placeholder="Gris métallisé"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="annee">Année</Label>
                <Input
                  id="annee"
                  type="number"
                  value={formData.annee || ''}
                  onChange={(e) => setFormData({ ...formData, annee: parseInt(e.target.value) || undefined })}
                  min="1990"
                  max={new Date().getFullYear() + 1}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="kilometrage">Kilométrage</Label>
                <Input
                  id="kilometrage"
                  type="number"
                  value={formData.kilometrage || ''}
                  onChange={(e) => setFormData({ ...formData, kilometrage: parseInt(e.target.value) || 0 })}
                  min="0"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="carburant">Carburant</Label>
                <Select value={formData.carburant || 'ESSENCE'} onValueChange={(value) => setFormData({ ...formData, carburant: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ESSENCE">Essence</SelectItem>
                    <SelectItem value="DIESEL">Diesel</SelectItem>
                    <SelectItem value="HYBRIDE">Hybride</SelectItem>
                    <SelectItem value="ELECTRIQUE">Électrique</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Prochaines dates d'entretien */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-muted-foreground">Prochaines échéances d'entretien</h4>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="prochaineVidange">Vidange</Label>
                <Input
                  id="prochaineVidange"
                  type="date"
                  value={formData.prochaineVidange || ''}
                  onChange={(e) => setFormData({ ...formData, prochaineVidange: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="prochainEntretien">Entretien</Label>
                <Input
                  id="prochainEntretien"
                  type="date"
                  value={formData.prochainEntretien || ''}
                  onChange={(e) => setFormData({ ...formData, prochainEntretien: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="prochainControleTechnique">Contrôle technique</Label>
                <Input
                  id="prochainControleTechnique"
                  type="date"
                  value={formData.prochainControleTechnique || ''}
                  onChange={(e) => setFormData({ ...formData, prochainControleTechnique: e.target.value })}
                />
              </div>
            </div>

          </div>

          {/* Notes et statut */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Informations complémentaires..."
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="actif"
                checked={formData.actif || false}
                onCheckedChange={(checked) => setFormData({ ...formData, actif: checked })}
              />
              <Label htmlFor="actif">Véhicule actif</Label>
            </div>
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