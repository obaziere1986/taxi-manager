"use client"

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"

interface Chauffeur {
  id: string
  nom: string
  prenom: string
  vehicule?: string
}

interface DeleteChauffeurModalProps {
  isOpen: boolean
  onClose: () => void
  onDelete: (chauffeurId: string) => Promise<void>
  chauffeur?: Chauffeur | null
}

export function DeleteChauffeurModal({ isOpen, onClose, onDelete, chauffeur }: DeleteChauffeurModalProps) {
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    if (!chauffeur) return

    setLoading(true)
    try {
      await onDelete(chauffeur.id)
      onClose()
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
      alert('Erreur lors de la suppression du chauffeur')
    } finally {
      setLoading(false)
    }
  }

  if (!chauffeur) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Supprimer le chauffeur
          </DialogTitle>
          <DialogDescription>
            Êtes-vous sûr de vouloir supprimer définitivement ce chauffeur ?
          </DialogDescription>
        </DialogHeader>

        <div className="bg-red-50 p-4 rounded-lg">
          <h4 className="font-semibold text-red-800">
            {chauffeur.nom.toUpperCase()}, {chauffeur.prenom}
          </h4>
          {chauffeur.vehicule && (
            <p className="text-sm text-red-700 mt-1">
              Véhicule assigné : {chauffeur.vehicule}
            </p>
          )}
          <p className="text-sm text-red-600 mt-2">
            ⚠️ Cette action est irréversible et supprimera également l'historique des courses associées.
          </p>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleDelete}
            disabled={loading}
          >
            {loading ? 'Suppression...' : 'Supprimer définitivement'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}