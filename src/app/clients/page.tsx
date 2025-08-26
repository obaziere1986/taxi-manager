"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { PageHeader } from '@/components/page-header'
import { ProtectedComponent } from '@/components/auth/ProtectedComponent'
import { PhoneInput } from '@/components/ui/phone-input'
import { formatPhoneDisplay } from '@/lib/phone-utils'
import { Users, Phone, Mail, Plus, Edit, Trash2, MapPin } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { getCourseStatusBadge, formatStatut } from '@/lib/badge-utils'
import { CourseModal } from "@/components/courses/CourseModal"

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
  notes?: string
  chauffeur?: {
    id: string
    nom: string
    prenom: string
  } | null
}

interface ClientWithStats extends Client {
  totalCourses: number
  coursesTerminees: number
  coursesEnAttente: number
  coursesAssignees: number
  coursesAnnulees: number
  derniereCourse?: Date
}

export default function ClientsPage() {
  const [clients, setClients] = useState<ClientWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedClient, setSelectedClient] = useState<ClientWithStats | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Partial<Client>>({})
  const [isCreating, setIsCreating] = useState(false)
  const [courseModal, setCourseModal] = useState<{
    isOpen: boolean;
    course?: Course | null;
    mode: 'view' | 'edit';
  }>({ isOpen: false, course: null, mode: 'view' })
  const [allClients, setAllClients] = useState<Client[]>([])
  const [users, setUsers] = useState<any[]>([])

  useEffect(() => {
    fetchClients()
    fetchAllClientsForModal()
    fetchUsers()
  }, [])

  const fetchClients = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/clients')
      const data = await response.json()
      
      if (Array.isArray(data)) {
        const clientsWithStats: ClientWithStats[] = data.map(client => {
          const courses = client.courses || []
          // Calculer tous les statuts
          const coursesEnAttente = courses.filter((c: Course) => c.statut === 'EN_ATTENTE')
          const coursesAssignees = courses.filter((c: Course) => c.statut === 'ASSIGNEE')
          const coursesEnCours = courses.filter((c: Course) => c.statut === 'EN_COURS')
          const coursesTerminees = courses.filter((c: Course) => c.statut === 'TERMINEE')
          const coursesAnnulees = courses.filter((c: Course) => c.statut === 'ANNULEE')
          
          // Total = tout sauf annulées
          const totalCourses = coursesEnAttente.length + coursesAssignees.length + coursesEnCours.length + coursesTerminees.length
          
          return {
            ...client,
            totalCourses,
            coursesTerminees: coursesTerminees.length,
            coursesEnAttente: coursesEnAttente.length,
            coursesAssignees: coursesAssignees.length + coursesEnCours.length, // Assignées + En cours
            coursesAnnulees: coursesAnnulees.length,
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

  const fetchAllClientsForModal = async () => {
    try {
      const response = await fetch('/api/clients?simple=true')
      const data = await response.json()
      if (Array.isArray(data)) {
        setAllClients(data)
      }
    } catch (error) {
      console.error('Erreur lors du chargement des clients pour modal:', error)
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users')
      const data = await response.json()
      if (Array.isArray(data)) {
        setUsers(data.filter(user => user.role === 'Chauffeur'))
      }
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error)
    }
  }

  const handleCoursesSave = async (courseData: any) => {
    try {
      const url = courseModal.course
        ? `/api/courses/${courseModal.course.id}`
        : "/api/courses";
      const method = courseModal.course ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(courseData),
      });

      if (response.ok) {
        await fetchClients(); // Recharger les données des clients
        // Si un client est sélectionné, recharger ses données aussi
        if (selectedClient) {
          await refreshSelectedClient(selectedClient.id);
        }
      } else {
        throw new Error('Erreur lors de la sauvegarde');
      }
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
      throw error;
    }
  }

  const handleStatusUpdate = async (courseId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/courses/${courseId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          statut: newStatus
        }),
      });

      if (response.ok) {
        await fetchClients();
        // Si un client est sélectionné, recharger ses données aussi
        if (selectedClient) {
          await refreshSelectedClient(selectedClient.id);
        }
      } else {
        throw new Error('Erreur lors de la mise à jour du statut');
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour du statut:", error);
      throw error;
    }
  }

  const handleDeleteCourse = async (courseId: string) => {
    try {
      const response = await fetch(`/api/courses/${courseId}`, {
        method: "DELETE",
      });
      
      if (response.ok) {
        await fetchClients();
        // Si un client est sélectionné, recharger ses données aussi
        if (selectedClient) {
          await refreshSelectedClient(selectedClient.id);
        }
      } else {
        throw new Error('Erreur lors de la suppression');
      }
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      throw error;
    }
  }

  const refreshSelectedClient = async (clientId: string) => {
    try {
      const response = await fetch(`/api/clients/${clientId}`)
      const updatedClient = await response.json()
      
      if (response.ok) {
        setSelectedClient(updatedClient)
      }
    } catch (error) {
      console.error("Erreur lors du rechargement du client:", error)
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
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce client ?')) return
    
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
          <ProtectedComponent permissions={["clients.create"]}>
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Nouveau client
            </Button>
          </ProtectedComponent>
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
              
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[25%]">Client</TableHead>
                      <TableHead className="w-[35%]">Contact</TableHead>
                      <TableHead className="w-[15%] text-center">Courses</TableHead>
                      <TableHead className="w-[15%] text-center">Dernière course</TableHead>
                      <TableHead className="w-[10%]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clientsGroup.map((client) => (
                      <TableRow key={client.id} className="hover:bg-muted/50 cursor-pointer"
                                onClick={() => openClientDetails(client)}>
                        <TableCell>
                          <div className="font-medium">
                            {client.nom.toUpperCase()}, {client.prenom}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-sm">
                              <Phone className="h-3 w-3" />
                              {formatPhoneDisplay(client.telephone)}
                            </div>
                            {client.email && (
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Mail className="h-3 w-3" />
                                {client.email}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="font-medium">{client.totalCourses}</span>
                        </TableCell>
                        <TableCell className="text-center">
                          {client.derniereCourse && !isNaN(new Date(client.derniereCourse).getTime()) ? (
                            <div className="text-sm text-muted-foreground">
                              {format(new Date(client.derniereCourse), 'dd/MM/yy', { locale: fr })}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <ProtectedComponent permissions={["clients.update"]}>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  openClientDetails(client)
                                }}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                            </ProtectedComponent>
                            <ProtectedComponent permissions={["clients.delete"]}>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDelete(client.id)
                                }}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </ProtectedComponent>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ))}
        </div>

        {filteredClients.length === 0 && !loading && (
          <div className="text-center py-12 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p>Aucun client trouvé</p>
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
                <Label htmlFor="prenom">Prénom *</Label>
                <Input
                  id="prenom"
                  value={editingClient.prenom || ''}
                  onChange={(e) => setEditingClient({ ...editingClient, prenom: e.target.value })}
                  placeholder="Prénom"
                />
              </div>
            </div>
            
            <div>
              <PhoneInput
                id="telephone"
                label="Téléphone *"
                value={editingClient.telephone || ''}
                onChange={(value) => setEditingClient({ ...editingClient, telephone: value })}
                required
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
                {isCreating ? 'Créer' : 'Enregistrer'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-5xl h-[85vh] max-h-[85vh] flex flex-col overflow-hidden">
          <DialogHeader className="flex-shrink-0 pb-4 border-b">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <DialogTitle className="text-xl">
                  {selectedClient?.nom.toUpperCase()}, {selectedClient?.prenom}
                </DialogTitle>
                
                {selectedClient && (
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <Badge variant="secondary" className="text-xs font-medium">
                      Total: {selectedClient.totalCourses}
                    </Badge>
                    {selectedClient.coursesEnAttente > 0 && (
                      <Badge variant="outline" className="text-xs border-orange-200 text-orange-700 bg-orange-50">
                        🟠 {selectedClient.coursesEnAttente} En attente
                      </Badge>
                    )}
                    {selectedClient.coursesAssignees > 0 && (
                      <Badge variant="outline" className="text-xs border-blue-200 text-blue-700 bg-blue-50">
                        🔵 {selectedClient.coursesAssignees} En cours
                      </Badge>
                    )}
                    {selectedClient.coursesTerminees > 0 && (
                      <Badge variant="outline" className="text-xs border-green-200 text-green-700 bg-green-50">
                        🟢 {selectedClient.coursesTerminees} Terminées
                      </Badge>
                    )}
                    {selectedClient.coursesAnnulees > 0 && (
                      <Badge variant="outline" className="text-xs border-red-200 text-red-700 bg-red-50">
                        🔴 {selectedClient.coursesAnnulees} Annulées
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </div>
          </DialogHeader>
          
          {selectedClient && (
            <Tabs defaultValue="courses" className="flex flex-col flex-1 min-h-0">
              <TabsList className="grid w-full grid-cols-2 flex-shrink-0">
                <TabsTrigger value="courses">
                  <MapPin className="h-4 w-4 mr-2" />
                  Courses
                </TabsTrigger>
                <TabsTrigger value="infos">
                  <Edit className="h-4 w-4 mr-2" />
                  Informations
                </TabsTrigger>
              </TabsList>
              
              <div className="flex-1 min-h-0 mt-4">
                <TabsContent value="courses" className="h-full m-0 data-[state=active]:h-full data-[state=active]:overflow-hidden">
                  {selectedClient.courses && selectedClient.courses.length > 0 ? (
                    <div className="h-full overflow-y-auto space-y-4 pr-4">
                      {(() => {
                        const currentYear = new Date().getFullYear()
                        const coursesByPeriod: Record<string, Course[]> = {}
                        
                        selectedClient.courses.forEach(course => {
                          const courseDate = new Date(course.dateHeure)
                          const courseYear = courseDate.getFullYear()
                          
                          let periodKey: string
                          if (courseYear === currentYear) {
                            periodKey = format(courseDate, 'MMMM yyyy', { locale: fr })
                          } else {
                            periodKey = courseYear.toString()
                          }
                          
                          if (!coursesByPeriod[periodKey]) {
                            coursesByPeriod[periodKey] = []
                          }
                          coursesByPeriod[periodKey].push(course)
                        })
                        
                        return Object.entries(coursesByPeriod)
                          .sort(([a], [b]) => {
                            // Trier par date décroissante
                            const aDate = new Date(coursesByPeriod[a][0].dateHeure)
                            const bDate = new Date(coursesByPeriod[b][0].dateHeure)
                            return bDate.getTime() - aDate.getTime()
                          })
                          .map(([period, courses]) => (
                          <div key={period} className="space-y-3">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold text-base">{period}</h4>
                              <Badge variant="outline" className="text-xs">
                                {courses.length} course{courses.length > 1 ? 's' : ''}
                              </Badge>
                            </div>
                            
                            <div className="border rounded-lg">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead className="w-[120px]">Date & Heure</TableHead>
                                    <TableHead className="min-w-[350px]">Trajet</TableHead>
                                    <TableHead className="w-[140px]">Chauffeur</TableHead>
                                    <TableHead className="w-[100px] text-center">Statut</TableHead>
                                    <TableHead className="w-[200px]">Notes</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {courses
                                    .sort((a, b) => new Date(b.dateHeure).getTime() - new Date(a.dateHeure).getTime())
                                    .map((course) => (
                                    <TableRow 
                                      key={course.id} 
                                      className="hover:bg-muted/50 cursor-pointer"
                                      onClick={() => {
                                        // Transformer la structure pour CourseModal
                                        const transformedCourse = {
                                          ...course,
                                          client: {
                                            id: selectedClient.id,
                                            nom: selectedClient.nom,
                                            prenom: selectedClient.prenom,
                                            telephone: selectedClient.telephone,
                                            email: selectedClient.email
                                          },
                                          user: course.chauffeur ? {
                                            id: course.chauffeur.id,
                                            nom: course.chauffeur.nom,
                                            prenom: course.chauffeur.prenom
                                          } : null
                                        };
                                        setCourseModal({ isOpen: true, course: transformedCourse, mode: 'view' });
                                      }}
                                    >
                                      <TableCell className="font-mono text-sm">
                                        <div className="space-y-1">
                                          {(() => {
                                            if (!course.dateHeure) return <div className="text-muted-foreground text-xs">Date invalide</div>
                                            const courseDate = new Date(course.dateHeure)
                                            if (isNaN(courseDate.getTime())) return <div className="text-muted-foreground text-xs">Date invalide</div>
                                            return (
                                              <>
                                                <div>{format(courseDate, 'dd/MM/yy', { locale: fr })}</div>
                                                <div className="text-muted-foreground text-xs">{format(courseDate, 'HH:mm', { locale: fr })}</div>
                                              </>
                                            )
                                          })()}
                                        </div>
                                      </TableCell>
                                      <TableCell>
                                        <div className="flex items-center gap-2">
                                          <MapPin className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                                          <span className="font-medium text-sm">
                                            {course.origine} → {course.destination}
                                          </span>
                                        </div>
                                      </TableCell>
                                      <TableCell className="text-sm">
                                        {course.chauffeur ? (
                                          <span className="font-medium">
                                            {course.chauffeur.prenom} {course.chauffeur.nom.charAt(0).toUpperCase()}.
                                          </span>
                                        ) : (
                                          <span className="text-muted-foreground">Non assigné</span>
                                        )}
                                      </TableCell>
                                      <TableCell className="text-center">
                                        <Badge 
                                          variant={getCourseStatusBadge(course.statut).variant}
                                          className={`${getCourseStatusBadge(course.statut).className} text-xs px-2 py-1`}
                                        >
                                          {formatStatut(course.statut)}
                                        </Badge>
                                      </TableCell>
                                      <TableCell>
                                        {course.notes ? (
                                          <span className="text-sm text-muted-foreground block" title={course.notes}>
                                            {course.notes}
                                          </span>
                                        ) : (
                                          <span className="text-muted-foreground text-sm">-</span>
                                        )}
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          </div>
                        ))
                      })()
                    }
                    </div>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <MapPin className="h-12 w-12 mx-auto mb-4 opacity-20" />
                      <p>Aucune course enregistrée</p>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="infos" className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="editNom">Nom</Label>
                        <Input
                          id="editNom"
                          value={editingClient.nom || selectedClient.nom}
                          onChange={(e) => setEditingClient({ ...editingClient, nom: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="editPrenom">Prénom</Label>
                        <Input
                          id="editPrenom"
                          value={editingClient.prenom || selectedClient.prenom}
                          onChange={(e) => setEditingClient({ ...editingClient, prenom: e.target.value })}
                        />
                      </div>
                      <div>
                        <PhoneInput
                          id="editTelephone"
                          label="Téléphone"
                          value={editingClient.telephone || selectedClient.telephone}
                          onChange={(value) => setEditingClient({ ...editingClient, telephone: value })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="editEmail">Email</Label>
                        <Input
                          id="editEmail"
                          type="email"
                          value={editingClient.email || selectedClient.email || ''}
                          onChange={(e) => setEditingClient({ ...editingClient, email: e.target.value })}
                        />
                      </div>
                    </div>
                    
                    <ProtectedComponent permissions={["clients.update"]}>
                      <div className="flex justify-end gap-2 pt-4 border-t">
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setEditingClient({})
                            setIsDetailsOpen(false)
                          }}
                        >
                          Annuler
                        </Button>
                        <Button 
                          onClick={async () => {
                            try {
                              const url = `/api/clients/${selectedClient.id}`
                              const method = 'PUT'
                              
                              const response = await fetch(url, {
                                method,
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ ...editingClient, id: selectedClient.id })
                              })
                              
                              if (response.ok) {
                                setIsDetailsOpen(false)
                                setEditingClient({})
                                fetchClients()
                              } else {
                                console.error('Erreur lors de la sauvegarde')
                              }
                            } catch (error) {
                              console.error('Erreur:', error)
                            }
                          }}
                          disabled={(() => {
                            // Vérifier si au moins un champ a été modifié
                            const hasChanges = 
                              (editingClient.nom && editingClient.nom !== selectedClient.nom) ||
                              (editingClient.prenom && editingClient.prenom !== selectedClient.prenom) ||
                              (editingClient.telephone && editingClient.telephone !== selectedClient.telephone) ||
                              (editingClient.email !== undefined && editingClient.email !== (selectedClient.email || ''))
                            
                            // Vérifier que les champs obligatoires sont remplis
                            const currentNom = editingClient.nom || selectedClient.nom
                            const currentPrenom = editingClient.prenom || selectedClient.prenom
                            const currentTelephone = editingClient.telephone || selectedClient.telephone
                            const hasRequiredFields = currentNom && currentPrenom && currentTelephone
                            
                            return !hasChanges || !hasRequiredFields
                          })()}
                        >
                          Sauvegarder
                        </Button>
                      </div>
                    </ProtectedComponent>
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      <CourseModal
        isOpen={courseModal.isOpen}
        onClose={() => setCourseModal({ isOpen: false, course: null, mode: 'view' })}
        course={courseModal.course}
        mode={courseModal.mode}
        clients={allClients}
        users={users}
        onSave={handleCoursesSave}
        onStatusUpdate={handleStatusUpdate}
        onDelete={handleDeleteCourse}
      />
    </div>
  )
}