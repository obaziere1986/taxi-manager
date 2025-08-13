"use client"

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { VehicleCombobox } from "@/components/ui/vehicle-combobox"
import { User, Car } from 'lucide-react'

interface Chauffeur {
  id: string
  nom: string
  prenom: string
  statut: string
}

interface User {
  id: string
  nom: string
  prenom: string
  role: string
}

interface VehiculeAssignationModalProps {
  isOpen: boolean
  onClose: () => void
  onAssign: (assignationData: any) => Promise<void>
  chauffeur?: Chauffeur | null
  user?: User | null
}

export function VehiculeAssignationModal({ 
  isOpen, 
  onClose, 
  onAssign, 
  chauffeur,
  user
}: VehiculeAssignationModalProps) {
  const [selectedVehicule, setSelectedVehicule] = useState<string>('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isOpen) {
      setSelectedVehicule('')
      setNotes('')
    }
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedVehicule || (!chauffeur && !user)) return

    const person = chauffeur || user
    if (!person) return

    setLoading(true)
    try {
      await onAssign({
        userId: (user?.id || chauffeur?.id) || null,
        vehiculeId: selectedVehicule,
        dateDebut: new Date().toISOString(),
        actif: true,
        notes: notes || undefined
      })
      onClose()
    } catch (error) {
      console.error('Erreur lors de l\'assignation:', error)
      alert('Erreur lors de l\'assignation du véhicule')
    } finally {
      setLoading(false)
    }
  }

  // La combobox gère la récupération des véhicules

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            Assigner un véhicule
          </DialogTitle>
          <DialogDescription>
            {chauffeur && (
              <>Assigner un véhicule à <strong>{chauffeur.nom.toUpperCase()}, {chauffeur.prenom}</strong> (Chauffeur)</>
            )}
            {user && (
              <>Assigner un véhicule à <strong>{user.nom.toUpperCase()}, {user.prenom}</strong> ({user.role})</>
            )}
          </DialogDescription>
        </DialogHeader>

        {(chauffeur || user) && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Info personne */}
            <div className="bg-muted/50 p-3 rounded-lg">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-green-500" />
                <span className="font-medium">
                  {(chauffeur || user)!.nom.toUpperCase()}, {(chauffeur || user)!.prenom}
                </span>
                {chauffeur && (
                  <Badge variant={chauffeur.statut === 'DISPONIBLE' ? 'default' : 'secondary'}>
                    {chauffeur.statut}
                  </Badge>
                )}
                {user && (
                  <Badge variant="outline">
                    {user.role}
                  </Badge>
                )}
              </div>
            </div>

            {/* Sélection véhicule */}
            <VehicleCombobox
              id="vehicule"
              label="Véhicule à assigner *"
              value={selectedVehicule}
              onChange={setSelectedVehicule}
              required
              placeholder="Rechercher et sélectionner un véhicule..."
            />

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optionnel)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Informations complémentaires sur cette assignation..."
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Annuler
              </Button>
              <Button 
                type="submit" 
                disabled={loading || !selectedVehicule}
              >
                {loading ? 'Assignation...' : 'Assigner'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}