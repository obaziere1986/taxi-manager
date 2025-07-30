"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/page-header'
import { Plus, Phone, Mail, MapPin, Edit, Trash2, Search, Eye, Calendar, Car, Euro, Save, X, CheckCircle } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface Client {
  id: string
  nom: string
  prenom: string
  telephone: string
  email: string | null
  adresses: any
  createdAt: string
  _count: {
    courses: number
  }
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Client | 'createdAt' | 'courses' | null
    direction: 'asc' | 'desc'
  }>({ key: null, direction: 'asc' })
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    telephone: '',
    email: '',
    adresses: ''
  })
  const [clientDetailDialog, setClientDetailDialog] = useState<{
    isOpen: boolean
    client?: Client & { courses?: any[] }
  }>({ isOpen: false })
  const [loadingClientDetail, setLoadingClientDetail] = useState(false)
  const [isEditingClient, setIsEditingClient] = useState(false)
  const [editClientData, setEditClientData] = useState({
    nom: '',
    prenom: '',
    telephone: '',
    email: '',
    adresses: ''
  })
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    fetchClients()
  }, [])

  const fetchClients = async () => {
    try {
      const response = await fetch('/api/clients')
      const data = await response.json()
      setClients(data)
    } catch (error) {
      console.error('Erreur lors du chargement des clients:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const url = editingClient ? `/api/clients/${editingClient.id}` : '/api/clients'
      const method = editingClient ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          adresses: formData.adresses ? [formData.adresses] : null
        }),
      })

      if (response.ok) {
        resetForm()
        fetchClients()
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du client:', error)
    }
  }

  const handleEdit = (client: Client) => {
    setEditingClient(client)
    setFormData({
      nom: client.nom,
      prenom: client.prenom,
      telephone: client.telephone,
      email: client.email || '',
      adresses: Array.isArray(client.adresses) && client.adresses.length > 0 ? client.adresses[0] : ''
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce client ?')) {
      try {
        const response = await fetch(`/api/clients/${id}`, {
          method: 'DELETE',
        })
        if (response.ok) {
          fetchClients()
        }
      } catch (error) {
        console.error('Erreur lors de la suppression:', error)
      }
    }
  }

  const resetForm = () => {
    setFormData({ nom: '', prenom: '', telephone: '', email: '', adresses: '' })
    setEditingClient(null)
    setIsDialogOpen(false)
  }

  const handleViewDetails = async (client: Client) => {
    setLoadingClientDetail(true)
    setClientDetailDialog({ isOpen: true, client })
    
    // Préparer les données d'édition
    setEditClientData({
      nom: client.nom,
      prenom: client.prenom,
      telephone: client.telephone,
      email: client.email || '',
      adresses: Array.isArray(client.adresses) && client.adresses.length > 0 ? client.adresses[0] : ''
    })
    
    try {
      const response = await fetch(`/api/clients/${client.id}`)
      const clientWithCourses = await response.json()
      setClientDetailDialog({ isOpen: true, client: clientWithCourses })
      
      // Mettre à jour les données d'édition avec les données complètes
      setEditClientData({
        nom: clientWithCourses.nom,
        prenom: clientWithCourses.prenom,
        telephone: clientWithCourses.telephone,
        email: clientWithCourses.email || '',
        adresses: Array.isArray(clientWithCourses.adresses) && clientWithCourses.adresses.length > 0 ? clientWithCourses.adresses[0] : ''
      })
    } catch (error) {
      console.error('Erreur lors du chargement des détails:', error)
    } finally {
      setLoadingClientDetail(false)
    }
  }

  const getStatutBadge = (statut: string) => {
    const formatStatut = (statut: string) => {
      const statutMap: { [key: string]: string } = {
        'EN_ATTENTE': 'En attente',
        'ASSIGNEE': 'Assignée',
        'EN_COURS': 'En cours',
        'TERMINEE': 'Terminée',
        'ANNULEE': 'Annulée'
      }
      return statutMap[statut] || statut
    }

    return (
      <Badge 
        variant="secondary" 
        className={`text-xs ${
          statut === 'TERMINEE' ? 'bg-green-500 text-white hover:bg-green-600' :
          statut === 'ANNULEE' ? 'bg-red-500 text-white hover:bg-red-600' :
          statut === 'EN_COURS' ? 'bg-green-500 text-white hover:bg-green-600 animate-pulse' :
          'bg-gray-500 text-white hover:bg-gray-600'
        }`}
      >
        {formatStatut(statut)}
      </Badge>
    )
  }

  const handleSort = (key: keyof Client | 'createdAt' | 'courses') => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  const filteredClients = clients.filter(client => {
    const searchLower = searchTerm.toLowerCase()
    return (
      client.nom.toLowerCase().includes(searchLower) ||
      client.prenom.toLowerCase().includes(searchLower) ||
      client.telephone.toLowerCase().includes(searchLower) ||
      (client.email && client.email.toLowerCase().includes(searchLower))
    )
  })

  // Toujours trier par nom de famille par défaut pour l'organisation alphabétique
  const sortedClients = [...filteredClients].sort((a, b) => {
    if (!sortConfig.key) {
      // Tri par défaut par nom de famille
      return a.nom.toLowerCase().localeCompare(b.nom.toLowerCase())
    }

    let aValue: any
    let bValue: any

    switch (sortConfig.key) {
      case 'nom':
        aValue = a.nom.toLowerCase()
        bValue = b.nom.toLowerCase()
        break
      case 'createdAt':
        aValue = new Date(a.createdAt)
        bValue = new Date(b.createdAt)
        break
      case 'courses':
        aValue = a._count.courses
        bValue = b._count.courses
        break
      default:
        aValue = a[sortConfig.key as keyof Client]
        bValue = b[sortConfig.key as keyof Client]
    }

    if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1
    if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1
    return 0
  })

  // Grouper les clients par lettre initiale du nom de famille
  const groupedClients = sortedClients.reduce((groups: { [letter: string]: Client[] }, client) => {
    const firstLetter = client.nom.charAt(0).toUpperCase()
    if (!groups[firstLetter]) {
      groups[firstLetter] = []
    }
    groups[firstLetter].push(client)
    return groups
  }, {})

  // Obtenir les lettres triées
  const sortedLetters = Object.keys(groupedClients).sort()

  if (loading) {
    return (
      <div className="flex-1 flex flex-col h-full">
        <PageHeader title="Clients" />
        <div className="flex-1 p-6">
          <div>Chargement...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      <PageHeader title="Clients">
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          if (!open) resetForm()
          setIsDialogOpen(open)
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nouveau client
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {editingClient ? 'Modifier le client' : 'Nouveau client'}
              </DialogTitle>
              <DialogDescription>
                {editingClient 
                  ? 'Modifiez les informations du client.'
                  : 'Ajouter un nouveau client à votre base de données.'
                }
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nom">Nom *</Label>
                  <Input
                    id="nom"
                    value={formData.nom}
                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="prenom">Prénom *</Label>
                  <Input
                    id="prenom"
                    value={formData.prenom}
                    onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="telephone">Téléphone *</Label>
                <Input
                  id="telephone"
                  type="tel"
                  value={formData.telephone}
                  onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="adresses">Adresse principale</Label>
                <Input
                  id="adresses"
                  value={formData.adresses}
                  onChange={(e) => setFormData({ ...formData, adresses: e.target.value })}
                  placeholder="123 rue de la Paix, Paris"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Annuler
                </Button>
                <Button type="submit">
                  {editingClient ? 'Modifier' : 'Créer'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <div className="flex-1 p-6 space-y-4">
        <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Liste des clients</CardTitle>
              <CardDescription>
                Gérez votre base de clients et consultez leurs informations.
              </CardDescription>
            </div>
            <div className="relative w-80">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Rechercher par nom, téléphone, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {clients.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <div className="text-lg font-medium mb-2">Répertoire vide</div>
              <div>Aucun client enregistré. Ajoutez votre premier client !</div>
            </div>
          ) : sortedClients.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <div className="text-lg font-medium mb-2">Aucun résultat</div>
              <div>Aucun client trouvé pour &quot;{searchTerm}&quot;.</div>
            </div>
          ) : (
            <div className="space-y-6">
              {sortedLetters.map((letter) => (
                <div key={letter} className="space-y-3">
                  {/* Séparateur alphabétique */}
                  <div className="flex items-center space-x-4">
                    <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-sm">
                      {letter}
                    </div>
                    <div className="flex-1 h-px bg-border"></div>
                    <div className="text-sm text-muted-foreground font-medium">
                      {groupedClients[letter].length} client{groupedClients[letter].length > 1 ? 's' : ''}
                    </div>
                  </div>
                  
                  {/* Liste des clients pour cette lettre */}
                  <div className="space-y-2 ml-4">
                    {groupedClients[letter].map((client) => (
                      <div 
                        key={client.id} 
                        className="flex items-center justify-between p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center space-x-3">
                            <div className="font-semibold text-sm">
                              <span className="text-primary">{client.nom.toUpperCase()}</span>, {client.prenom}
                            </div>
                            <Badge variant="secondary">
                              {client._count.courses} course{client._count.courses > 1 ? 's' : ''}
                            </Badge>
                          </div>
                          
                          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center">
                              <Phone className="mr-1 h-3 w-3" />
                              {client.telephone}
                            </div>
                            {client.email && (
                              <div className="flex items-center">
                                <Mail className="mr-1 h-3 w-3" />
                                {client.email}
                              </div>
                            )}
                            {client.adresses && Array.isArray(client.adresses) && client.adresses.length > 0 && (
                              <div className="flex items-center">
                                <MapPin className="mr-1 h-3 w-3" />
                                {client.adresses[0]}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <div className="text-xs text-muted-foreground">
                            Depuis le {new Date(client.createdAt).toLocaleDateString('fr-FR')}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDetails(client)}
                            title="Voir les détails et modifier"
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(client.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de détails client */}
      <Dialog 
        open={clientDetailDialog.isOpen} 
        onOpenChange={(open) => !open && setClientDetailDialog({ isOpen: false })}
      >
        <DialogContent className="max-w-7xl max-h-[95vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">
                {clientDetailDialog.client?.nom.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="text-xl font-bold">
                  {clientDetailDialog.client?.nom.toUpperCase()}, {clientDetailDialog.client?.prenom}
                </div>
                <div className="text-sm text-muted-foreground">
                  {clientDetailDialog.client?.courses?.length || 0} course{(clientDetailDialog.client?.courses?.length || 0) > 1 ? 's' : ''}
                </div>
              </div>
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="contact" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="contact">Coordonnées</TabsTrigger>
              <TabsTrigger value="history">Historique</TabsTrigger>
            </TabsList>

            {/* Onglet Coordonnées */}
            <TabsContent value="contact" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Informations client</CardTitle>
                  <CardDescription>
                    Modifiez les informations de contact du client
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={async (e) => {
                    e.preventDefault()
                    setIsSaving(true)
                    try {
                      const response = await fetch(`/api/clients/${clientDetailDialog.client!.id}`, {
                        method: 'PUT',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                          ...editClientData,
                          adresses: editClientData.adresses ? [editClientData.adresses] : null
                        }),
                      })

                      if (response.ok) {
                        await fetchClients() // Recharger la liste
                        // Recharger les détails du client
                        const updatedClient = await response.json()
                        setClientDetailDialog({ 
                          isOpen: true, 
                          client: { ...updatedClient, courses: clientDetailDialog.client!.courses }
                        })
                        
                        // Afficher la modal de succès
                        setShowSuccessModal(true)
                        
                        // Fermer automatiquement après 2 secondes
                        setTimeout(() => {
                          setShowSuccessModal(false)
                          setClientDetailDialog({ isOpen: false })
                        }, 2000)
                      } else {
                        alert('Erreur lors de la modification du client')
                      }
                    } catch (error) {
                      console.error('Erreur lors de la modification:', error)
                      alert('Erreur lors de la modification du client')
                    } finally {
                      setIsSaving(false)
                    }
                  }} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="editNom">Nom *</Label>
                        <Input
                          id="editNom"
                          value={editClientData.nom}
                          onChange={(e) => setEditClientData({ ...editClientData, nom: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="editPrenom">Prénom *</Label>
                        <Input
                          id="editPrenom"
                          value={editClientData.prenom}
                          onChange={(e) => setEditClientData({ ...editClientData, prenom: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="editTelephone">Téléphone *</Label>
                      <Input
                        id="editTelephone"
                        type="tel"
                        value={editClientData.telephone}
                        onChange={(e) => setEditClientData({ ...editClientData, telephone: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="editEmail">Email</Label>
                      <Input
                        id="editEmail"
                        type="email"
                        value={editClientData.email}
                        onChange={(e) => setEditClientData({ ...editClientData, email: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="editAdresses">Adresse principale</Label>
                      <Input
                        id="editAdresses"
                        value={editClientData.adresses}
                        onChange={(e) => setEditClientData({ ...editClientData, adresses: e.target.value })}
                        placeholder="123 rue de la Paix, Paris"
                      />
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground border-t pt-4">
                      <Calendar className="h-4 w-4 flex-shrink-0" />
                      <span>Client depuis le {clientDetailDialog.client ? new Date(clientDetailDialog.client.createdAt).toLocaleDateString('fr-FR') : ''}</span>
                    </div>
                    <div className="flex justify-end space-x-2 pt-4">
                      <Button type="submit" disabled={isSaving}>
                        {isSaving ? (
                          <>
                            <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
                            Sauvegarde...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            Sauvegarder
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Onglet Historique */}
            <TabsContent value="history" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Historique des courses</CardTitle>
                  <CardDescription>
                    Toutes les courses de ce client, groupées par période
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingClientDetail ? (
                    <div className="flex items-center justify-center py-8">
                      <div>Chargement de l'historique...</div>
                    </div>
                  ) : clientDetailDialog.client?.courses && clientDetailDialog.client.courses.length > 0 ? (
                    <div className="max-h-[500px] overflow-y-auto pr-2 space-y-6">
                      {(() => {
                        // Grouper les courses par période
                        const now = new Date()
                        const coursesWithPeriod = clientDetailDialog.client.courses.map((course: any) => {
                          const courseDate = new Date(course.dateHeure)
                          const diffTime = now.getTime() - courseDate.getTime()
                          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
                          
                          let period: string
                          if (diffDays <= 7) {
                            period = 'Cette semaine'
                          } else if (diffDays <= 30) {
                            period = 'Ce mois-ci'
                          } else if (diffDays <= 90) {
                            period = 'Ces 3 derniers mois'
                          } else if (courseDate.getFullYear() === now.getFullYear()) {
                            period = `${courseDate.toLocaleDateString('fr-FR', { month: 'long' })} ${courseDate.getFullYear()}`
                          } else {
                            period = `Année ${courseDate.getFullYear()}`
                          }
                          
                          return { ...course, period, courseDate }
                        })
                        
                        // Trier par date décroissante
                        coursesWithPeriod.sort((a, b) => b.courseDate.getTime() - a.courseDate.getTime())
                        
                        // Grouper par période
                        const groupedCourses = coursesWithPeriod.reduce((acc, course) => {
                          if (!acc[course.period]) {
                            acc[course.period] = []
                          }
                          acc[course.period].push(course)
                          return acc
                        }, {} as Record<string, any[]>)
                        
                        // Ordre des périodes
                        const periodOrder = [
                          'Cette semaine',
                          'Ce mois-ci', 
                          'Ces 3 derniers mois'
                        ]
                        
                        const sortedPeriods = Object.keys(groupedCourses).sort((a, b) => {
                          const aIndex = periodOrder.indexOf(a)
                          const bIndex = periodOrder.indexOf(b)
                          
                          if (aIndex !== -1 && bIndex !== -1) {
                            return aIndex - bIndex
                          } else if (aIndex !== -1) {
                            return -1
                          } else if (bIndex !== -1) {
                            return 1
                          } else {
                            // Pour les années/mois, tri par ordre décroissant
                            return b.localeCompare(a)
                          }
                        })
                        
                        return sortedPeriods.map(period => (
                          <div key={period} className="space-y-3">
                            <div className="flex items-center space-x-3">
                              <h4 className="font-semibold text-sm text-primary">{period}</h4>
                              <div className="flex-1 h-px bg-border"></div>
                              <span className="text-xs text-muted-foreground">
                                {groupedCourses[period].length} course{groupedCourses[period].length > 1 ? 's' : ''}
                              </span>
                            </div>
                            <div className="space-y-3 ml-4">
                              {groupedCourses[period].map((course: any) => (
                                <div key={course.id} className="flex items-start justify-between p-4 border rounded-lg bg-muted/20">
                                  <div className="space-y-2 flex-1 min-w-0">
                                    <div className="font-medium">
                                      {course.origine} → {course.destination}
                                    </div>
                                    <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                                      <div className="flex items-center gap-1">
                                        <Calendar className="h-3 w-3 flex-shrink-0" />
                                        <span>{new Date(course.dateHeure).toLocaleDateString('fr-FR')} à {new Date(course.dateHeure).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                                      </div>
                                      {course.chauffeur && (
                                        <div className="flex items-center gap-1">
                                          <Car className="h-3 w-3 flex-shrink-0" />
                                          <span>{course.chauffeur.prenom} {course.chauffeur.nom.toUpperCase()}</span>
                                        </div>
                                      )}
                                    </div>
                                    {course.notes && (
                                      <div className="text-sm text-muted-foreground italic break-words">
                                        {course.notes}
                                      </div>
                                    )}
                                  </div>
                                  <div className="text-right space-y-2 ml-4 flex-shrink-0">
                                    {getStatutBadge(course.statut)}
                                    {course.prix && (
                                      <div className="flex items-center gap-1 text-sm font-medium justify-end">
                                        <Euro className="h-3 w-3" />
                                        {course.prix}€
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))
                      })()
                      }
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Car className="h-12 w-12 mx-auto mb-4 opacity-20" />
                      <p>Aucune course enregistrée pour ce client</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Modal de confirmation de succès */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="sr-only">
            <DialogTitle>Confirmation de sauvegarde</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center text-center p-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-green-800 mb-2">
              Client modifié avec succès !
            </h3>
            <p className="text-sm text-green-600 mb-4">
              Les informations ont été mises à jour dans la base de données.
            </p>
            <div className="w-full bg-green-200 rounded-full h-1 mb-2">
              <div className="bg-green-600 h-1 rounded-full animate-pulse" style={{ width: '100%' }}></div>
            </div>
            <p className="text-xs text-green-500">
              Fermeture automatique dans quelques instants...
            </p>
          </div>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  )
}