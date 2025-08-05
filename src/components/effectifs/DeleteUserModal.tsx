"use client"

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface User {
  id: string
  nom: string
  prenom: string
  email: string
  role: string
}

interface DeleteUserModalProps {
  isOpen: boolean
  onClose: () => void
  onDelete: (userId: string) => Promise<void>
  user?: User | null
}

export function DeleteUserModal({ isOpen, onClose, onDelete, user }: DeleteUserModalProps) {
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    if (!user) return
    
    setLoading(true)
    try {
      await onDelete(user.id)
      onClose()
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
      alert('Erreur lors de la suppression de l\'utilisateur')
    } finally {
      setLoading(false)
    }
  }

  if (!user) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Supprimer l'utilisateur ?</DialogTitle>
          <DialogDescription>
            Êtes-vous sûr de vouloir supprimer l'utilisateur <strong>{user.nom}, {user.prenom}</strong> ?
            <br />
            <span className="text-xs text-muted-foreground mt-2 block">
              Email: {user.email} • Rôle: {user.role}
            </span>
            <br />
            Cette action est irréversible.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button 
            type="button" 
            variant="destructive" 
            onClick={handleDelete}
            disabled={loading}
          >
            {loading ? 'Suppression...' : 'Supprimer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}