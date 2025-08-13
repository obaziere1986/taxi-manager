"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PageHeader } from '@/components/page-header'
import { Users, Phone, Mail, Plus, Edit, Trash2, Clock, MapPin } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface Client {
  id: string
  nom: string
  prenom: string
  telephone: string
  email?: string
  adresses?: string[]
  createdAt: string
  updatedAt: string
  courses?: Course[]
}

interface Course {
  id: string
  origine: string
  destination: string
  dateHeure: string
  statut: string
  prix?: number
  notes?: string
}

interface ClientWithStats extends Client {
  totalCourses: number
  coursesTerminees: number
  coursesEnAttente: number
  coursesAnnulees: number
  totalRevenu: number
  derniereCourse?: Date
}

export default function ClientsPage() {
  const [clients, setClients] = useState<ClientWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedClient, setSelectedClient] = useState<ClientWithStats | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Partial<Client>>({})
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    fetchClients()
  }, [])

  const fetchClients = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/clients')
      const data = await response.json()
      
      if (Array.isArray(data)) {
        const clientsWithStats: ClientWithStats[] = data.map(client => {
          const courses = client.courses || []
          const coursesTerminees = courses.filter((c: Course) => c.statut === 'TERMINEE')
          const totalRevenu = coursesTerminees.reduce((sum: number, c: Course) => sum + (c.prix || 0), 0)
          
          return {
            ...client,
            totalCourses: courses.length,
            coursesTerminees: coursesTerminees.length,
            coursesEnAttente: courses.filter((c: Course) => c.statut === 'EN_ATTENTE').length,
            coursesAnnulees: courses.filter((c: Course) => c.statut === 'ANNULEE').length,
            totalRevenu,
            derniereCourse: courses.length > 0 ? 
              new Date(Math.max(...courses.map((c: Course) => new Date(c.dateHeure).getTime()))) : 
              undefined
          }
        })
        
        clientsWithStats.sort((a, b) => 
          a.nom.localeCompare(b.nom, 'fr', { sensitivity: 'base' })
        )
        
        setClients(clientsWithStats)
      } else {
        console.error('Donnees invalides:', data)
        setClients([])
      }
    } catch (error) {
      console.error('Erreur lors du chargement des clients:', error)
      setClients([])
    } finally {
      setLoading(false)
    }
  }

  const filteredClients = clients.filter(client =>
    `${client.nom} ${client.prenom}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.telephone.includes(searchTerm) ||
    (client.email && client.email.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const handleSave = async () => {
    try {
      const url = isCreating ? '/api/clients' : `/api/clients/${editingClient.id}`
      const method = isCreating ? 'POST' : 'PUT'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingClient)
      })
      
      if (response.ok) {
        setIsDialogOpen(false)
        setEditingClient({})
        setIsCreating(false)
        fetchClients()
      } else {
        console.error('Erreur lors de la sauvegarde')
      }
    } catch (error) {
      console.error('Erreur:', error)
    }
  }

  const handleDelete = async (clientId: string) => {
    if (!confirm('Etes-vous sur de vouloir supprimer ce client ?')) return
    
    try {
      const response = await fetch(`/api/clients/${clientId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        fetchClients()
      } else {
        console.error('Erreur lors de la suppression')
      }
    } catch (error) {
      console.error('Erreur:', error)
    }
  }

  const openCreateDialog = () => {
    setEditingClient({})
    setIsCreating(true)
    setIsDialogOpen(true)
  }

  const openEditDialog = (client: ClientWithStats) => {
    setEditingClient(client)
    setIsCreating(false)
    setIsDialogOpen(true)
  }

  const openClientDetails = (client: ClientWithStats) => {
    setSelectedClient(client)
    setIsDetailsOpen(true)
  }

  const groupedClients = filteredClients.reduce((groups, client) => {
    const letter = client.nom.charAt(0).toUpperCase()
    if (!groups[letter]) {
      groups[letter] = []
    }
    groups[letter].push(client)
    return groups
  }, {} as Record<string, ClientWithStats[]>)

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div>Chargement...</div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      <PageHeader 
        title="Clients"
        description="Gestion de votre base client"
        icon={Users}
      />
      
      <div className="flex-1 p-6 space-y-6 overflow-auto">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 max-w-sm">
            <Input
              placeholder="Rechercher un client..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button onClick={openCreateDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau client
          </Button>
        </div>

        <div className="space-y-6">
          {Object.entries(groupedClients)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([letter, clientsGroup]) => (
            <div key={letter} className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                  {letter}
                </div>
                <span className="text-muted-foreground text-sm">
                  {clientsGroup.length} client{clientsGroup.length > 1 ? 's' : ''}
                </span>
              </div>
              
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {clientsGroup.map((client) => (
                  <Card key={client.id} className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div onClick={() => openClientDetails(client)} className="flex-1">
                          <CardTitle className="text-base">
                            {client.nom.toUpperCase()}, {client.prenom}
                          </CardTitle>
                          <CardDescription className="flex items-center gap-1 mt-1">
                            <Phone className="h-3 w-3" />
                            {client.telephone}
                          </CardDescription>
                          {client.email && (
                            <CardDescription className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {client.email}
                            </CardDescription>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(client)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(client.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="pt-0" onClick={() => openClientDetails(client)}>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>Courses totales</span>
                          <Badge variant="outline">{client.totalCourses}</Badge>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span>Terminees</span>
                          <Badge variant="default">{client.coursesTerminees}</Badge>
                        </div>
                        {client.totalRevenu > 0 && (
                          <div className="flex items-center justify-between text-sm">
                            <span>CA genere</span>
                            <Badge variant="secondary">{client.totalRevenu}€</Badge>
                          </div>
                        )}
                        {client.derniereCourse && (
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Derniere: {format(client.derniereCourse, 'dd MMM yyyy', { locale: fr })}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>

        {filteredClients.length === 0 && !loading && (
          <div className="text-center py-12 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p>Aucun client trouve</p>
            {searchTerm && (
              <p className="text-sm">Essayez de modifier votre recherche</p>
            )}
          </div>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isCreating ? 'Nouveau client' : 'Modifier le client'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nom">Nom *</Label>
                <Input
                  id="nom"
                  value={editingClient.nom || ''}
                  onChange={(e) => setEditingClient({ ...editingClient, nom: e.target.value })}
                  placeholder="Nom de famille"
                />
              </div>
              <div>
                <Label htmlFor="prenom">Prenom *</Label>
                <Input
                  id="prenom"
                  value={editingClient.prenom || ''}
                  onChange={(e) => setEditingClient({ ...editingClient, prenom: e.target.value })}
                  placeholder="Prenom"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="telephone">Telephone *</Label>
              <Input
                id="telephone"
                value={editingClient.telephone || ''}
                onChange={(e) => setEditingClient({ ...editingClient, telephone: e.target.value })}
                placeholder="06 12 34 56 78"
              />
            </div>
            
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={editingClient.email || ''}
                onChange={(e) => setEditingClient({ ...editingClient, email: e.target.value })}
                placeholder="email@example.com"
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Annuler
              </Button>
              <Button 
                onClick={handleSave}
                disabled={!editingClient.nom || !editingClient.prenom || !editingClient.telephone}
              >
                {isCreating ? 'Creer' : 'Enregistrer'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Details du client : {selectedClient?.nom.toUpperCase()}, {selectedClient?.prenom}
            </DialogTitle>
          </DialogHeader>
          
          {selectedClient && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    <span className="font-medium">Telephone</span>
                  </div>
                  <p>{selectedClient.telephone}</p>
                </div>
                
                {selectedClient.email && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <span className="font-medium">Email</span>
                    </div>
                    <p>{selectedClient.email}</p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Courses totales</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{selectedClient.totalCourses}</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Terminees</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">{selectedClient.coursesTerminees}</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">En attente</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-600">{selectedClient.coursesEnAttente}</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">CA total</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">{selectedClient.totalRevenu}€</div>
                  </CardContent>
                </Card>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Historique des courses</h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {selectedClient.courses && selectedClient.courses.length > 0 ? (
                    selectedClient.courses
                      .sort((a, b) => new Date(b.dateHeure).getTime() - new Date(a.dateHeure).getTime())
                      .map((course) => (
                      <div key={course.id} className="border rounded p-3">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            <span className="font-medium">
                              {course.origine} → {course.destination}
                            </span>
                          </div>
                          <Badge 
                            variant={
                              course.statut === 'TERMINEE' ? 'default' :
                              course.statut === 'EN_ATTENTE' ? 'secondary' :
                              course.statut === 'EN_COURS' ? 'outline' : 'destructive'
                            }
                          >
                            {course.statut.replace('_', ' ')}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center text-sm text-muted-foreground">
                          <span>{format(new Date(course.dateHeure), 'dd MMM yyyy à HH:mm', { locale: fr })}</span>
                          {course.prix && <span className="font-medium">{course.prix}€</span>}
                        </div>
                        {course.notes && (
                          <p className="text-sm text-muted-foreground mt-1">{course.notes}</p>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <MapPin className="h-12 w-12 mx-auto mb-4 opacity-20" />
                      <p>Aucune course enregistree</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}