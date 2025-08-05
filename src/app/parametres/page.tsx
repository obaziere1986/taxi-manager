"use client"

import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/page-header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Car, 
  Users, 
  Settings, 
  MessageSquare, 
  FileText, 
  Plus, 
  Edit, 
  Trash2,
  Phone,
  Mail,
  Shield,
  User,
  Calendar,
  Fuel,
  Wrench,
  History,
  ArrowRight
} from "lucide-react"
import { VehiculeModal } from '@/components/vehicules/VehiculeModal'
import { DeleteVehiculeModal } from '@/components/vehicules/DeleteVehiculeModal'
import { UserModal } from '@/components/effectifs/UserModal'
import { DeleteUserModal } from '@/components/effectifs/DeleteUserModal'
import { getVehiculeAlerts, getAlertBadgeVariant } from '@/lib/vehicule-alerts'

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
  chauffeurs?: Array<{ id: string; nom: string; prenom: string }>
}

interface VehiculeAssignation {
  id: string
  dateDebut: string
  dateFin?: string
  actif: boolean
  notes?: string
  vehicule: {
    id: string
    marque: string
    modele: string
    immatriculation: string
  }
  chauffeur: {
    id: string
    nom: string
    prenom: string
  }
}

interface User {
  id: string
  nom: string
  prenom: string
  email: string
  telephone?: string
  role: 'CHAUFFEUR' | 'PLANNEUR' | 'ADMIN'
  actif: boolean
  createdAt: string
  updatedAt: string
}

export default function ParametresPage() {
  const [activeTab, setActiveTab] = useState("vehicules")
  const [vehicules, setVehicules] = useState<Vehicule[]>([])
  const [assignations, setAssignations] = useState<VehiculeAssignation[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingAssignations, setLoadingAssignations] = useState(false)
  const [loadingUsers, setLoadingUsers] = useState(false)
  
  // États des modales véhicules
  const [vehiculeModal, setVehiculeModal] = useState<{
    isOpen: boolean
    mode: 'create' | 'edit'
    vehicule?: Vehicule | null
  }>({ isOpen: false, mode: 'create', vehicule: null })
  
  const [deleteVehiculeModal, setDeleteVehiculeModal] = useState<{
    isOpen: boolean
    vehicule?: Vehicule | null
  }>({ isOpen: false, vehicule: null })

  // États des modales utilisateurs
  const [userModal, setUserModal] = useState<{
    isOpen: boolean
    mode: 'create' | 'edit'
    user?: User | null
  }>({ isOpen: false, mode: 'create', user: null })
  
  const [deleteUserModal, setDeleteUserModal] = useState<{
    isOpen: boolean
    user?: User | null
  }>({ isOpen: false, user: null })

  // Charger les données selon l'onglet actif
  useEffect(() => {
    if (activeTab === 'vehicules') {
      fetchVehicules()
      fetchAssignations()
    } else if (activeTab === 'effectifs') {
      fetchUsers()
    }
  }, [activeTab])

  const fetchVehicules = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/vehicules')
      const data = await response.json()
      setVehicules(data)
    } catch (error) {
      console.error('Erreur lors du chargement des véhicules:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAssignations = async () => {
    try {
      setLoadingAssignations(true)
      const response = await fetch('/api/vehicules/assignations')
      const data = await response.json()
      setAssignations(data)
    } catch (error) {
      console.error('Erreur lors du chargement des assignations:', error)
    } finally {
      setLoadingAssignations(false)
    }
  }

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true)
      const response = await fetch('/api/users')
      const data = await response.json()
      setUsers(data)
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error)
    } finally {
      setLoadingUsers(false)
    }
  }

  const handleSaveVehicule = async (vehiculeData: Vehicule) => {
    try {
      const url = vehiculeModal.mode === 'create' 
        ? '/api/vehicules' 
        : `/api/vehicules/${vehiculeData.id}`
        
      const method = vehiculeModal.mode === 'create' ? 'POST' : 'PUT'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(vehiculeData)
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erreur lors de la sauvegarde')
      }
      
      await fetchVehicules()
      setVehiculeModal({ isOpen: false, mode: 'create', vehicule: null })
    } catch (error) {
      console.error('Erreur:', error)
      throw error
    }
  }

  const handleDeleteVehicule = async (vehiculeId: string) => {
    try {
      const response = await fetch(`/api/vehicules/${vehiculeId}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erreur lors de la suppression')
      }
      
      await fetchVehicules()
      setDeleteVehiculeModal({ isOpen: false, vehicule: null })
    } catch (error) {
      console.error('Erreur:', error)
      throw error
    }
  }

  const handleSaveUser = async (userData: User) => {
    try {
      const url = userModal.mode === 'create' 
        ? '/api/users' 
        : `/api/users/${userData.id}`
        
      const method = userModal.mode === 'create' ? 'POST' : 'PUT'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erreur lors de la sauvegarde')
      }
      
      await fetchUsers()
      setUserModal({ isOpen: false, mode: 'create', user: null })
    } catch (error) {
      console.error('Erreur:', error)
      throw error
    }
  }

  const handleDeleteUser = async (userId: string) => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erreur lors de la suppression')
      }
      
      await fetchUsers()
      setDeleteUserModal({ isOpen: false, user: null })
    } catch (error) {
      console.error('Erreur:', error)
      throw error
    }
  }


  return (
    <div className="flex-1 flex flex-col h-full">
      <PageHeader title="Paramètres">
        <Button>
          <Settings className="h-4 w-4 mr-2" />
          Sauvegarder
        </Button>
      </PageHeader>

      <div className="flex-1 p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="vehicules" className="flex items-center gap-2">
              <Car className="h-4 w-4" />
              Véhicules
            </TabsTrigger>
            <TabsTrigger value="effectifs" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Effectifs
            </TabsTrigger>
            <TabsTrigger value="preferences" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Préférences
            </TabsTrigger>
            <TabsTrigger value="communications" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Communications
            </TabsTrigger>
          </TabsList>

          {/* Section Véhicules */}
          <TabsContent value="vehicules" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Car className="h-5 w-5" />
                      Gestion des véhicules
                    </CardTitle>
                    <CardDescription>
                      Gérer le parc automobile de la société
                    </CardDescription>
                  </div>
                  <Button onClick={() => setVehiculeModal({ isOpen: true, mode: 'create', vehicule: null })}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nouveau véhicule
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="border rounded-lg p-4 animate-pulse">
                        <div className="h-4 bg-muted rounded w-1/3 mb-2"></div>
                        <div className="h-3 bg-muted rounded w-1/2"></div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {vehicules.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Car className="h-12 w-12 mx-auto mb-4 opacity-20" />
                        <p>Aucun véhicule enregistré</p>
                      </div>
                    ) : (
                      vehicules.map((vehicule) => {
                        const alerts = getVehiculeAlerts(vehicule)
                        const hasCriticalAlert = alerts.some(alert => alert.level === 'critical')
                        const hasUrgentAlert = alerts.some(alert => alert.level === 'danger')
                        const hasAlert = alerts.length > 0
                        
                        return (
                          <div key={vehicule.id} className="border rounded-lg p-4">
                            <div className="flex justify-between items-start">
                              <div className="space-y-2 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h3 className="font-semibold">
                                    {vehicule.marque} {vehicule.modele}
                                  </h3>
                                  <Badge variant={vehicule.actif ? "default" : "secondary"}>
                                    {vehicule.actif ? "Actif" : "Inactif"}
                                  </Badge>
                                  {alerts.map((alert, index) => (
                                    <Badge 
                                      key={index}
                                      variant={getAlertBadgeVariant(alert.level)} 
                                      className={`text-xs ${alert.level === 'critical' ? 'animate-pulse' : ''}`}
                                    >
                                      <Wrench className="h-3 w-3 mr-1" />
                                      {alert.message}
                                    </Badge>
                                  ))}
                                </div>
                                
                                <div className="space-y-1">
                                  <p className="text-sm text-muted-foreground">
                                    {vehicule.immatriculation}
                                    {vehicule.annee && ` • ${vehicule.annee}`}
                                    {vehicule.couleur && ` • ${vehicule.couleur}`}
                                  </p>
                                  
                                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                    {vehicule.carburant && (
                                      <span className="flex items-center gap-1">
                                        <Fuel className="h-3 w-3" />
                                        {vehicule.carburant}
                                      </span>
                                    )}
                                    {vehicule.kilometrage !== null && vehicule.kilometrage !== undefined && (
                                      <span>{vehicule.kilometrage.toLocaleString()} km</span>
                                    )}
                                  </div>
                                  
                                  {vehicule.chauffeurs && vehicule.chauffeurs.length > 0 ? (
                                    <p className="text-xs text-muted-foreground">
                                      Assigné à: {vehicule.chauffeurs.map(c => `${c.nom.toUpperCase()}, ${c.prenom}`).join(', ')}
                                    </p>
                                  ) : (
                                    <p className="text-xs text-muted-foreground">Non assigné</p>
                                  )}
                                </div>
                              </div>
                              
                              <div className="flex gap-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => setVehiculeModal({ 
                                    isOpen: true, 
                                    mode: 'edit', 
                                    vehicule 
                                  })}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => setDeleteVehiculeModal({ 
                                    isOpen: true, 
                                    vehicule 
                                  })}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Historique des assignations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Historique des assignations
                </CardTitle>
                <CardDescription>
                  Suivi des assignations véhicule-chauffeur
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingAssignations ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="border rounded-lg p-4 animate-pulse">
                        <div className="h-4 bg-muted rounded w-1/3 mb-2"></div>
                        <div className="h-3 bg-muted rounded w-1/2"></div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {assignations.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <History className="h-12 w-12 mx-auto mb-4 opacity-20" />
                        <p>Aucune assignation enregistrée</p>
                      </div>
                    ) : (
                      assignations.map((assignation) => (
                        <div key={assignation.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div className="space-y-2">
                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2">
                                  <Car className="h-4 w-4 text-blue-500" />
                                  <span className="font-medium">
                                    {assignation.vehicule.marque} {assignation.vehicule.modele}
                                  </span>
                                  <span className="text-sm text-muted-foreground">
                                    ({assignation.vehicule.immatriculation})
                                  </span>
                                </div>
                                
                                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                
                                <div className="flex items-center gap-2">
                                  <User className="h-4 w-4 text-green-500" />
                                  <span className="font-medium">
                                    {assignation.chauffeur.nom.toUpperCase()}, {assignation.chauffeur.prenom}
                                  </span>
                                </div>
                                
                                <Badge variant={assignation.actif ? "default" : "secondary"}>
                                  {assignation.actif ? "Actif" : "Terminé"}
                                </Badge>
                              </div>
                              
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span>
                                  Début: {new Date(assignation.dateDebut).toLocaleDateString('fr-FR')}
                                </span>
                                {assignation.dateFin && (
                                  <span>
                                    Fin: {new Date(assignation.dateFin).toLocaleDateString('fr-FR')}
                                  </span>
                                )}
                                {assignation.actif && (
                                  <span className="text-green-600">
                                    • En cours depuis {Math.floor((new Date().getTime() - new Date(assignation.dateDebut).getTime()) / (1000 * 60 * 60 * 24))} jours
                                  </span>
                                )}
                              </div>
                              
                              {assignation.notes && (
                                <p className="text-xs text-muted-foreground italic">
                                  {assignation.notes}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Section Effectifs */}
          <TabsContent value="effectifs" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Gestion des effectifs
                    </CardTitle>
                    <CardDescription>
                      Gérer les utilisateurs et leurs rôles dans l'application
                    </CardDescription>
                  </div>
                  <Button onClick={() => setUserModal({ isOpen: true, mode: 'create', user: null })}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nouvel utilisateur
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loadingUsers ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="border rounded-lg p-4 animate-pulse">
                        <div className="h-4 bg-muted rounded w-1/3 mb-2"></div>
                        <div className="h-3 bg-muted rounded w-1/2"></div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {users.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Users className="h-12 w-12 mx-auto mb-4 opacity-20" />
                        <p>Aucun utilisateur enregistré</p>
                      </div>
                    ) : (
                      users.map((user) => {
                        const getRoleIcon = (role: string) => {
                          switch (role) {
                            case 'ADMIN': return <Shield className="h-4 w-4 text-red-500" />
                            case 'PLANNEUR': return <User className="h-4 w-4 text-blue-500" />
                            case 'CHAUFFEUR': return <Car className="h-4 w-4 text-green-500" />
                            default: return <User className="h-4 w-4 text-gray-500" />
                          }
                        }

                        const getRoleBadge = (role: string) => {
                          switch (role) {
                            case 'ADMIN': return <Badge variant="destructive">Admin</Badge>
                            case 'PLANNEUR': return <Badge variant="default">Planneur</Badge>
                            case 'CHAUFFEUR': return <Badge variant="secondary">Chauffeur</Badge>
                            default: return <Badge variant="outline">{role}</Badge>
                          }
                        }

                        return (
                          <div key={user.id} className="border rounded-lg p-4">
                            <div className="flex justify-between items-start">
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  {getRoleIcon(user.role)}
                                  <h3 className="font-semibold">
                                    {user.nom}, {user.prenom}
                                  </h3>
                                  {getRoleBadge(user.role)}
                                  {!user.actif && <Badge variant="outline">Inactif</Badge>}
                                </div>
                                <div className="space-y-1">
                                  <p className="text-sm text-muted-foreground">
                                    {user.email}
                                    {user.telephone && ` • ${user.telephone}`}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    Créé le {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                                  </p>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => setUserModal({ 
                                    isOpen: true, 
                                    mode: 'edit', 
                                    user 
                                  })}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => setDeleteUserModal({ 
                                    isOpen: true, 
                                    user 
                                  })}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Section Préférences */}
          <TabsContent value="preferences" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Paramètres généraux
                  </CardTitle>
                  <CardDescription>
                    Configuration de base de l'application
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">Nom de la société</p>
                      <p className="text-sm text-muted-foreground">Taxis Excellence</p>
                    </div>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">Fuseau horaire</p>
                      <p className="text-sm text-muted-foreground">Europe/Paris (UTC+1)</p>
                    </div>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">Devise</p>
                      <p className="text-sm text-muted-foreground">Euro (€)</p>
                    </div>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Planning & Courses</CardTitle>
                  <CardDescription>
                    Configuration du système de planning
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">Horaires d'ouverture</p>
                      <p className="text-sm text-muted-foreground">7h00 - 22h00</p>
                    </div>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">Durée moyenne d'une course</p>
                      <p className="text-sm text-muted-foreground">60 minutes</p>
                    </div>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">Confirmation automatique</p>
                      <p className="text-sm text-muted-foreground">Activée</p>
                    </div>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Section Communications */}
          <TabsContent value="communications" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Phone className="h-5 w-5" />
                    SMS
                  </CardTitle>
                  <CardDescription>
                    Configuration des notifications SMS
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">Service SMS</p>
                      <p className="text-sm text-muted-foreground">Non configuré</p>
                    </div>
                    <Button>
                      Configurer
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="font-medium">Notifications automatiques:</p>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span>Confirmation de course</span>
                        <Badge variant="outline">Désactivé</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Arrivée du chauffeur</span>
                        <Badge variant="outline">Désactivé</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Fin de course</span>
                        <Badge variant="outline">Désactivé</Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Génération PDF
                  </CardTitle>
                  <CardDescription>
                    Planning et documents pour les chauffeurs
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <p className="font-medium">Documents disponibles:</p>
                    <div className="space-y-2">
                      <Button variant="outline" className="w-full justify-start">
                        <FileText className="h-4 w-4 mr-2" />
                        Planning quotidien chauffeur
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        <FileText className="h-4 w-4 mr-2" />
                        Rapport hebdomadaire
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        <FileText className="h-4 w-4 mr-2" />
                        Feuille de route
                      </Button>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">Envoi automatique</p>
                        <p className="text-sm text-muted-foreground">Planning envoyé chaque matin à 7h</p>
                      </div>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Configuration email
                </CardTitle>
                <CardDescription>
                  Paramètres SMTP pour l'envoi d'emails
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">Serveur SMTP</p>
                      <p className="text-sm text-muted-foreground">Non configuré</p>
                    </div>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">Email expéditeur</p>
                      <p className="text-sm text-muted-foreground">Non configuré</p>
                    </div>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Modales */}
      <VehiculeModal
        isOpen={vehiculeModal.isOpen}
        onClose={() => setVehiculeModal({ isOpen: false, mode: 'create', vehicule: null })}
        onSave={handleSaveVehicule}
        vehicule={vehiculeModal.vehicule}
        mode={vehiculeModal.mode}
      />
      
      <DeleteVehiculeModal
        isOpen={deleteVehiculeModal.isOpen}
        onClose={() => setDeleteVehiculeModal({ isOpen: false, vehicule: null })}
        onDelete={handleDeleteVehicule}
        vehicule={deleteVehiculeModal.vehicule}
      />
      
      {/* Modales utilisateurs */}
      <UserModal
        isOpen={userModal.isOpen}
        onClose={() => setUserModal({ isOpen: false, mode: 'create', user: null })}
        onSave={handleSaveUser}
        user={userModal.user}
        mode={userModal.mode}
      />
      
      <DeleteUserModal
        isOpen={deleteUserModal.isOpen}
        onClose={() => setDeleteUserModal({ isOpen: false, user: null })}
        onDelete={handleDeleteUser}
        user={deleteUserModal.user}
      />
    </div>
  )
}