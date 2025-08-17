"use client"

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ClientCombobox } from "@/components/ui/combobox"
import { Clock, MapPin, User, Car, Phone, Mail, Edit, CheckCircle, X, UserPlus } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { getCourseStatusBadge, formatStatut } from '@/lib/badge-utils'

interface Course {
  id: string
  origine: string
  destination: string
  dateHeure: string
  statut: string
  notes?: string
  client: {
    id: string
    nom: string
    prenom: string
    telephone: string
    email?: string
  }
  user?: {
    id: string
    nom: string
    prenom: string
    vehicule?: string
    role: string
  } | null
}

interface Client {
  id: string
  nom: string
  prenom: string
  telephone: string
}

interface User {
  id: string
  nom: string
  prenom: string
  role: string
  vehicule?: string
}

interface CourseModalProps {
  isOpen: boolean
  onClose: () => void
  course?: Course | null
  mode: 'create' | 'view' | 'edit'
  clients: Client[]
  users: User[]
  onSave?: (courseData: any) => Promise<void>
  onStatusUpdate?: (courseId: string, newStatus: string) => Promise<void>
  onDelete?: (courseId: string) => Promise<void>
}

export function CourseModal({
  isOpen,
  onClose,
  course,
  mode: initialMode,
  clients,
  users,
  onSave,
  onStatusUpdate,
  onDelete
}: CourseModalProps) {
  const { data: session } = useSession()
  const [mode, setMode] = useState(initialMode)
  const [loading, setLoading] = useState(false)
  const [showNewClientForm, setShowNewClientForm] = useState(false)
  const [newClientData, setNewClientData] = useState({
    nom: '',
    prenom: '',
    telephone: '',
    email: ''
  })
  const [formData, setFormData] = useState({
    origine: '',
    destination: '',
    dateHeure: '',
    clientId: '',
    userId: '',
    notes: '',
    statut: 'EN_ATTENTE'
  })

  // Initialiser le formulaire quand course change
  useEffect(() => {
    if (course) {
      setFormData({
        origine: course.origine,
        destination: course.destination,
        dateHeure: new Date(course.dateHeure).toLocaleString('sv-SE').slice(0, 16),
        clientId: course.client?.id || '',
        userId: course.user?.id || 'none',
        notes: course.notes || '',
        statut: course.statut
      })
    } else {
      // Réinitialiser pour création
      setFormData({
        origine: '',
        destination: '',
        dateHeure: '',
        clientId: '',
        userId: 'none',
        notes: '',
        statut: 'EN_ATTENTE'
      })
    }
    setMode(initialMode)
    setShowNewClientForm(false)
    setNewClientData({
      nom: '',
      prenom: '',
      telephone: '',
      email: ''
    })
  }, [course, initialMode])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!onSave) return

    setLoading(true)
    try {
      let clientId = formData.clientId

      // Si on crée un nouveau client
      if (showNewClientForm) {
        const clientResponse = await fetch('/api/clients', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newClientData),
        })

        if (!clientResponse.ok) {
          throw new Error('Erreur lors de la création du client')
        }

        const newClient = await clientResponse.json()
        clientId = newClient.id
      }

      // Convertir "none" en chaîne vide pour userId
      const userId = formData.userId === 'none' ? '' : formData.userId
      
      // Logique automatique du statut selon l'assignation
      let autoStatut = formData.statut
      
      console.log('CourseModal - Logique assignation:', {
        userId,
        'formData.statut': formData.statut,
        'formData.userId': formData.userId,
        mode: mode
      })
      
      // Si on assigne un chauffeur à une course EN_ATTENTE, passer à ASSIGNEE
      if (userId && formData.statut === 'EN_ATTENTE') {
        autoStatut = 'ASSIGNEE'
        console.log('CourseModal - Statut changé automatiquement vers ASSIGNEE')
      }
      // Si on retire le chauffeur d'une course ASSIGNEE, retourner à EN_ATTENTE
      else if (!userId && formData.statut === 'ASSIGNEE') {
        autoStatut = 'EN_ATTENTE'
        console.log('CourseModal - Statut changé automatiquement vers EN_ATTENTE')
      }
      
      const dataToSave = {
        ...formData,
        clientId,
        userId,
        statut: autoStatut
      }
      
      await onSave(dataToSave)
      onClose()
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (newStatus: string) => {
    if (!course || !onStatusUpdate) return

    setLoading(true)
    try {
      await onStatusUpdate(course.id, newStatus)
      onClose()
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!course || !onDelete) return
    
    if (confirm('Êtes-vous sûr de vouloir supprimer cette course ?')) {
      setLoading(true)
      try {
        await onDelete(course.id)
        onClose()
      } catch (error) {
        console.error('Erreur lors de la suppression:', error)
      } finally {
        setLoading(false)
      }
    }
  }

  const getModalTitle = () => {
    if (mode === 'create') return 'Nouvelle course'
    if (mode === 'edit') return session?.user?.role === 'Chauffeur' ? 'Statut de la course' : 'Modifier la course'
    return 'Détails de la course'
  }

  const getModalDescription = () => {
    if (mode === 'create') return 'Créer une nouvelle course pour vos clients.'
    if (mode === 'edit') return session?.user?.role === 'Chauffeur' ? 'Modifiez le statut de votre course.' : 'Modifiez les détails de la course.'
    return 'Informations complètes sur la course sélectionnée.'
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Clock className="h-5 w-5 mr-2 text-blue-600" />
            {getModalTitle()}
          </DialogTitle>
          <DialogDescription>
            {getModalDescription()}
          </DialogDescription>
        </DialogHeader>

        {mode === 'view' && course ? (
          /* Vue lecture seule */
          <div className="space-y-4">
            {/* Date et statut */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="text-sm font-medium text-muted-foreground">Date et heure</div>
                <div className="text-sm">
                  {format(new Date(course.dateHeure), 'EEEE dd MMMM yyyy', { locale: fr })}
                </div>
                <div className="text-lg font-medium text-blue-600">
                  {format(new Date(course.dateHeure), 'HH:mm', { locale: fr })}
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-sm font-medium text-muted-foreground">Statut</div>
                <Badge 
                  variant={getCourseStatusBadge(course.statut).variant}
                  className={getCourseStatusBadge(course.statut).className}
                >
                  {formatStatut(course.statut)}
                </Badge>
              </div>
            </div>

            {/* Trajet */}
            <div className="space-y-2 p-3 bg-gray-50 rounded-lg">
              <h4 className="font-medium flex items-center">
                <MapPin className="h-4 w-4 mr-2" />
                Trajet
              </h4>
              <div className="space-y-1 ml-6">
                <div className="flex items-center text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  <span className="font-medium">{course.origine}</span>
                </div>
                <div className="flex items-center text-sm">
                  <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                  <span className="font-medium">{course.destination}</span>
                </div>
              </div>
            </div>

            {/* Client */}
            <div className="space-y-2 p-3 bg-blue-50 rounded-lg">
              <h4 className="font-medium flex items-center">
                <User className="h-4 w-4 mr-2" />
                Client
              </h4>
              <div className="ml-6 space-y-1">
                <div className="font-medium">{course.client.nom.toUpperCase()}, {course.client.prenom}</div>
                <div className="text-sm text-muted-foreground flex items-center">
                  <Phone className="h-3 w-3 mr-1" />
                  {course.client.telephone}
                </div>
                {course.client.email && (
                  <div className="text-sm text-muted-foreground flex items-center">
                    <Mail className="h-3 w-3 mr-1" />
                    {course.client.email}
                  </div>
                )}
              </div>
            </div>

            {/* Chauffeur */}
            {course.user && (
              <div className="space-y-2 p-3 bg-green-50 rounded-lg">
                <h4 className="font-medium flex items-center">
                  <Car className="h-4 w-4 mr-2" />
                  Chauffeur assigné
                </h4>
                <div className="ml-6 space-y-1">
                  <div className="font-medium">{course.user.nom.toUpperCase()}, {course.user.prenom}</div>
                  {course.user.vehicule && (
                    <div className="text-sm text-muted-foreground">{course.user.vehicule}</div>
                  )}
                </div>
              </div>
            )}

            {/* Notes */}
            {course.notes && (
              <div className="space-y-2">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Notes</div>
                  <div className="text-sm bg-gray-50 p-2 rounded">{course.notes}</div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="grid grid-cols-2 gap-2 pt-4">
              {/* Actions rapides si course assignée et pas terminée */}
              {course.user && course.statut !== 'TERMINEE' && course.statut !== 'ANNULEE' && (
                <Button 
                  className="bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => handleStatusUpdate('TERMINEE')}
                  disabled={loading}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Terminer
                </Button>
              )}
              
              {course.statut !== 'ANNULEE' && course.statut !== 'TERMINEE' && (
                <Button 
                  variant="outline"
                  onClick={() => handleStatusUpdate('ANNULEE')}
                  disabled={loading}
                >
                  <X className="h-4 w-4 mr-2" />
                  Annuler
                </Button>
              )}

              {/* Bouton modifier - uniquement si pas terminée */}
              {course.statut !== 'TERMINEE' && (
                <Button 
                  variant="outline"
                  onClick={() => setMode('edit')}
                  className="col-span-2"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Modifier
                </Button>
              )}
            </div>
          </div>
        ) : (
          /* Vue formulaire (création ou édition) */
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Vue simplifiée pour chauffeurs en édition */}
            {mode === 'edit' && session?.user?.role === 'Chauffeur' ? (
              <>
                {/* Affichage en lecture seule des détails */}
                <div className="space-y-4 bg-muted p-4 rounded-lg">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Origine</Label>
                      <p className="text-sm text-muted-foreground">{formData.origine}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Destination</Label>
                      <p className="text-sm text-muted-foreground">{formData.destination}</p>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Date et heure</Label>
                    <p className="text-sm text-muted-foreground">
                      {new Date(formData.dateHeure).toLocaleString("fr-FR", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
                
                {/* Modification du statut uniquement */}
                <div className="space-y-2">
                  <Label htmlFor="statut">Statut de la course</Label>
                  <Select
                    value={formData.statut}
                    onValueChange={(value) => setFormData({ ...formData, statut: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ASSIGNEE">Assignée</SelectItem>
                      <SelectItem value="EN_COURS">En cours</SelectItem>
                      <SelectItem value="TERMINEE">Terminée</SelectItem>
                      <SelectItem value="ANNULEE">Annulée</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            ) : (
              /* Vue complète pour admin/planner/création */
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="origine">Origine *</Label>
                    <Input
                      id="origine"
                      value={formData.origine}
                      onChange={(e) => setFormData({ ...formData, origine: e.target.value })}
                      placeholder="Adresse de départ"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="destination">Destination *</Label>
                    <Input
                      id="destination"
                      value={formData.destination}
                      onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                      placeholder="Adresse d'arrivée"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dateHeure">Date et heure *</Label>
                  <Input
                    id="dateHeure"
                    type="datetime-local"
                    value={formData.dateHeure}
                    onChange={(e) => setFormData({ ...formData, dateHeure: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Client *</Label>
                  {!showNewClientForm ? (
                    <div className="flex gap-2">
                      <ClientCombobox
                        clients={clients}
                        value={formData.clientId}
                        onValueChange={(value) => setFormData({ ...formData, clientId: value })}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowNewClientForm(true)}
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Nouveau
                      </Button>
                    </div>
                  ) : (
                    <div className="border rounded-lg p-4 space-y-3 bg-muted/50">
                      <div className="flex justify-between items-center">
                        <h4 className="text-sm font-medium">Nouveau client</h4>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowNewClientForm(false)}
                        >
                          Annuler
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="clientNom">Nom *</Label>
                          <Input
                            id="clientNom"
                            value={newClientData.nom}
                            onChange={(e) => setNewClientData({ ...newClientData, nom: e.target.value })}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="clientPrenom">Prénom *</Label>
                          <Input
                            id="clientPrenom"
                            value={newClientData.prenom}
                            onChange={(e) => setNewClientData({ ...newClientData, prenom: e.target.value })}
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="clientTelephone">Téléphone *</Label>
                        <Input
                          id="clientTelephone"
                          value={newClientData.telephone}
                          onChange={(e) => setNewClientData({ ...newClientData, telephone: e.target.value })}
                          placeholder="06 12 34 56 78"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="clientEmail">Email</Label>
                        <Input
                          id="clientEmail"
                          type="email"
                          value={newClientData.email}
                          onChange={(e) => setNewClientData({ ...newClientData, email: e.target.value })}
                          placeholder="email@example.com"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="userId">Chauffeur</Label>
                  <Select 
                    value={formData.userId} 
                    onValueChange={(value) => setFormData({ ...formData, userId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Assigner un chauffeur (optionnel)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Aucun chauffeur</SelectItem>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.nom.toUpperCase()}, {user.prenom}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="statut">Statut</Label>
                  <Select
                    value={formData.statut}
                    onValueChange={(value) => setFormData({ ...formData, statut: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EN_ATTENTE">En attente</SelectItem>
                      <SelectItem value="ASSIGNEE">Assignée</SelectItem>
                      <SelectItem value="EN_COURS">En cours</SelectItem>
                      
                      {/* Terminée et Annulée seulement si course assignée OU déjà dans ces statuts */}
                      {((formData.userId && formData.statut !== 'EN_ATTENTE') || 
                        formData.statut === 'TERMINEE' || 
                        formData.statut === 'ANNULEE') && (
                        <>
                          <SelectItem value="TERMINEE">Terminée</SelectItem>
                          <SelectItem value="ANNULEE">Annulée</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                  {(!formData.userId || formData.statut === 'EN_ATTENTE') && 
                   formData.statut !== 'TERMINEE' && formData.statut !== 'ANNULEE' && (
                    <p className="text-xs text-muted-foreground">
                      Les statuts "Terminée" et "Annulée" ne sont disponibles que pour les courses assignées.
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Instructions spéciales..."
                    className="min-h-[60px]"
                  />
                </div>
              </>
            )}

            {/* Boutons d'action */}
            <div className="flex justify-between gap-2 pt-4">
              <div className="flex gap-2">
                {mode === 'edit' && course && onDelete && (
                  <Button 
                    type="button" 
                    variant="destructive" 
                    onClick={handleDelete}
                    disabled={loading}
                  >
                    Supprimer
                  </Button>
                )}
              </div>
              
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={onClose}>
                  Annuler
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Sauvegarde...' : 
                   mode === 'create' ? 'Créer' : 
                   mode === 'edit' && session?.user?.role === 'Chauffeur' ? 'Mettre à jour' : 
                   'Modifier'}
                </Button>
              </div>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}