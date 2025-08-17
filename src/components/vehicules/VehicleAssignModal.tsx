"use client"

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { getDefaultBadge } from '@/lib/badge-utils'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Car, User, Check, ChevronDown, Shield, UserRound } from 'lucide-react'
import { cn } from "@/lib/utils"

interface Vehicule {
  id: string
  marque: string
  modele: string
  immatriculation: string
}

interface CombinedUser {
  id: string
  nom: string
  prenom: string
  role: 'Admin' | 'Planner' | 'Chauffeur'
  email?: string
  telephone?: string
  statut?: 'DISPONIBLE' | 'OCCUPE' | 'HORS_SERVICE'
  actif: boolean
  source: 'users' | 'chauffeurs'
}

interface VehicleAssignModalProps {
  isOpen: boolean
  onClose: () => void
  onAssign: (assignationData: any) => Promise<void>
  vehicule?: Vehicule | null
}

export function VehicleAssignModal({ 
  isOpen, 
  onClose, 
  onAssign, 
  vehicule
}: VehicleAssignModalProps) {
  const [selectedPerson, setSelectedPerson] = useState<string>('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [users, setUsers] = useState<CombinedUser[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!isOpen) {
      setSelectedPerson('')
      setNotes('')
      setOpen(false)
    } else {
      fetchUsers()
    }
  }, [isOpen])

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true)
      
      // Récupérer seulement les users
      const usersResponse = await fetch('/api/users')
      const usersData = await usersResponse.json()
      
      // Filtrer les utilisateurs actifs
      const combined: CombinedUser[] = [
        ...usersData.filter((user: any) => user.actif).map((user: any) => ({
          ...user,
          source: 'users' as const
        }))
      ]
      
      // Trier par rôle puis nom
      combined.sort((a, b) => {
        const roleOrder = { 'Admin': 1, 'Planner': 2, 'Chauffeur': 3 }
        const roleCompare = roleOrder[a.role] - roleOrder[b.role]
        if (roleCompare !== 0) return roleCompare
        return (a.nom + a.prenom).localeCompare(b.nom + b.prenom)
      })
      
      setUsers(combined)
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error)
      setUsers([])
    } finally {
      setLoadingUsers(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPerson || !vehicule) return

    const person = users.find(u => u.id === selectedPerson)
    if (!person) return

    setLoading(true)
    try {
      await onAssign({
        userId: person.id,
        vehiculeId: vehicule.id,
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

  const selectedUser = users.find(u => u.id === selectedPerson)

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'Admin': return <Shield className="h-4 w-4 text-red-500" />
      case 'Planner': return <UserRound className="h-4 w-4 text-blue-500" />
      case 'Chauffeur': return <Car className="h-4 w-4 text-green-500" />
      default: return <User className="h-4 w-4" />
    }
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'Admin': return <Badge variant="destructive">Admin</Badge>
      case 'Planner': return <Badge variant="default">Planner</Badge>
      case 'Chauffeur': return <Badge variant="secondary">Chauffeur</Badge>
      default: {
        const badgeStyle = getDefaultBadge()
        return <Badge variant={badgeStyle.variant} className={badgeStyle.className}>{role}</Badge>
      }
    }
  }

  if (!vehicule) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            Assigner un véhicule
          </DialogTitle>
          <DialogDescription>
            Assigner <strong>{vehicule.marque} {vehicule.modele}</strong> ({vehicule.immatriculation}) à un utilisateur
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Info véhicule */}
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="flex items-center gap-2">
              <Car className="h-4 w-4 text-blue-500" />
              <span className="font-medium">
                {vehicule.marque} {vehicule.modele}
              </span>
              <Badge variant="secondary" className="text-xs font-medium px-2 py-1">
                {vehicule.immatriculation}
              </Badge>
            </div>
          </div>

          {/* Sélection utilisateur */}
          <div className="space-y-2">
            <Label>Utilisateur à assigner *</Label>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  className={cn(
                    "w-full justify-between",
                    !selectedUser && "text-muted-foreground"
                  )}
                  disabled={loadingUsers}
                >
                  {selectedUser ? (
                    <div className="flex items-center gap-2">
                      {getRoleIcon(selectedUser.role)}
                      <span>{selectedUser.nom.toUpperCase()}, {selectedUser.prenom}</span>
                      {getRoleBadge(selectedUser.role)}
                    </div>
                  ) : (
                    <span>{loadingUsers ? 'Chargement...' : 'Sélectionner un utilisateur...'}</span>
                  )}
                  <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[450px] p-0">
                <Command>
                  <CommandInput placeholder="Rechercher un utilisateur..." />
                  <CommandList>
                    {loadingUsers ? (
                      <CommandEmpty>Chargement...</CommandEmpty>
                    ) : users.length === 0 ? (
                      <CommandEmpty>Aucun utilisateur trouvé.</CommandEmpty>
                    ) : (
                      <>
                        {/* Grouper par rôle */}
                        {['Admin', 'Planner', 'Chauffeur'].map(role => {
                          const roleUsers = users.filter(u => u.role === role)
                          if (roleUsers.length === 0) return null
                          
                          return (
                            <CommandGroup key={role} heading={`${role}s (${roleUsers.length})`}>
                              {roleUsers.map((user) => (
                                <CommandItem
                                  key={`${user.source}-${user.id}`}
                                  value={`${user.nom} ${user.prenom} ${user.email || ''}`}
                                  onSelect={() => {
                                    setSelectedPerson(user.id)
                                    setOpen(false)
                                  }}
                                >
                                  <div className="flex items-center justify-between w-full">
                                    <div className="flex items-center gap-2">
                                      {getRoleIcon(user.role)}
                                      <div>
                                        <div className="font-medium">
                                          {user.nom.toUpperCase()}, {user.prenom}
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                          {user.email && `${user.email} • `}
                                          {user.telephone && user.telephone}
                                          {user.statut && (
                                            <Badge 
                                              variant={user.statut === 'DISPONIBLE' ? 'default' : 'secondary'} 
                                              className="ml-2 text-xs"
                                            >
                                              {user.statut === 'DISPONIBLE' ? 'Disponible' : 
                                               user.statut === 'OCCUPE' ? 'Occupé' : 'Hors service'}
                                            </Badge>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                    <Check
                                      className={cn(
                                        "h-4 w-4",
                                        selectedPerson === user.id ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          )
                        })}
                      </>
                    )}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

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
              disabled={loading || !selectedPerson}
            >
              {loading ? 'Assignation...' : 'Assigner'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}