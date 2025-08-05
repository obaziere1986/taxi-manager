"use client"

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"

interface Vehicule {
  id: string
  marque: string
  modele: string
  immatriculation: string
  chauffeurs?: Array<{ nom: string; prenom: string }>
}

interface DeleteVehiculeModalProps {
  isOpen: boolean
  onClose: () => void
  onDelete: (vehiculeId: string) => Promise<void>
  vehicule: Vehicule | null
}

export function DeleteVehiculeModal({ isOpen, onClose, onDelete, vehicule }: DeleteVehiculeModalProps) {
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    if (!vehicule) return

    setLoading(true)
    try {
      await onDelete(vehicule.id)
      onClose()
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
      alert('Erreur lors de la suppression du véhicule')
    } finally {
      setLoading(false)
    }
  }

  if (!vehicule) return null

  const hasAssignedDrivers = vehicule.chauffeurs && vehicule.chauffeurs.length > 0

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Supprimer le véhicule
          </DialogTitle>
          <DialogDescription>
            Cette action est irréversible. Le véhicule sera définitivement supprimé.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-4 border rounded-lg bg-muted/50">
            <h4 className="font-semibold">
              {vehicule.marque} {vehicule.modele}
            </h4>
            <p className="text-sm text-muted-foreground">
              Immatriculation: {vehicule.immatriculation}
            </p>
          </div>

          {hasAssignedDrivers && (
            <div className="p-4 border border-destructive/20 rounded-lg bg-destructive/5">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-destructive">
                    Impossible de supprimer ce véhicule
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Ce véhicule est assigné aux chauffeurs suivants :
                  </p>
                  <ul className="text-xs text-muted-foreground mt-1 list-disc list-inside">
                    {vehicule.chauffeurs?.map((chauffeur, index) => (
                      <li key={index}>
                        {chauffeur.nom.toUpperCase()}, {chauffeur.prenom}
                      </li>
                    ))}
                  </ul>
                  <p className="text-xs text-muted-foreground mt-2">
                    Veuillez d'abord désassigner ce véhicule de tous les chauffeurs.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleDelete} 
            disabled={loading || hasAssignedDrivers}
          >
            {loading ? 'Suppression...' : 'Supprimer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}