"use client"

import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/page-header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
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
  ArrowRight,
  UserPlus,
  UserRoundMinus
} from "lucide-react"
import { VehiculeModal } from '@/components/vehicules/VehiculeModal'
import { DeleteVehiculeModal } from '@/components/vehicules/DeleteVehiculeModal'
import { UserModal } from '@/components/effectifs/UserModal'
import { DeleteUserModal } from '@/components/effectifs/DeleteUserModal'
import { ChauffeurModal } from '@/components/effectifs/ChauffeurModal'
import { DeleteChauffeurModal } from '@/components/effectifs/DeleteChauffeurModal'
import { VehiculeAssignationModal } from '@/components/effectifs/VehiculeAssignationModal'
import { VehicleAssignModal } from '@/components/vehicules/VehicleAssignModal'
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
  assignations?: Array<{
    id: string
    actif: boolean
    chauffeur?: { id: string; nom: string; prenom: string; statut: string }
    user?: { id: string; nom: string; prenom: string; role: string }
  }>
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
  chauffeur?: {
    id: string
    nom: string
    prenom: string
  }
  user?: {
    id: string
    nom: string
    prenom: string
    role: string
  }
}

interface User {
  id: string
  nom: string
  prenom: string
  email: string
  telephone?: string
  role: 'Admin' | 'Planner' | 'Chauffeur'
  statut?: 'DISPONIBLE' | 'OCCUPE' | 'HORS_SERVICE'
  actif: boolean
  createdAt: string
  updatedAt: string
}

interface Chauffeur {
  id: string
  nom: string
  prenom: string
  telephone?: string
  vehicule?: string
  statut: 'DISPONIBLE' | 'OCCUPE' | 'HORS_SERVICE'
  createdAt: string
}

interface CombinedUser {
  id: string
  nom: string
  prenom: string
  telephone?: string
  email?: string
  role: 'Admin' | 'Planner' | 'Chauffeur'
  statut?: 'DISPONIBLE' | 'OCCUPE' | 'HORS_SERVICE'
  vehicule?: string
  vehiculeId?: string
  assignedVehicle?: {
    id: string
    marque: string
    modele: string
    immatriculation: string
  }
  actif: boolean
  createdAt: string
  source: 'users' | 'chauffeurs'
}

export default function ParametresPage() {
  const [activeTab, setActiveTab] = useState("vehicules")
  const [vehicules, setVehicules] = useState<Vehicule[]>([])
  const [assignations, setAssignations] = useState<VehiculeAssignation[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [combinedUsers, setCombinedUsers] = useState<CombinedUser[]>([])
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


  // États de la modale d'assignation véhicule
  const [assignationModal, setAssignationModal] = useState<{
    isOpen: boolean
    chauffeur?: any | null
    user?: any | null
  }>({ isOpen: false, chauffeur: null, user: null })

  // État de la nouvelle modale d'assignation depuis véhicule
  const [vehicleAssignModal, setVehicleAssignModal] = useState<{
    isOpen: boolean
    vehicule?: Vehicule | null
  }>({ isOpen: false, vehicule: null })

  // Charger les données selon l'onglet actif
  useEffect(() => {
    if (activeTab === 'vehicules') {
      fetchVehicules()
      fetchAssignations()
    } else if (activeTab === 'effectifs') {
      fetchUsers()
      fetchVehicules() // Nécessaire pour les assignations
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
      const response = await fetch('/api/vehicules/assignations/robust')
      const data = await response.json()
      
      // Vérifier que data est un tableau
      if (Array.isArray(data)) {
        setAssignations(data)
      } else {
        console.error('Les données d\'assignations ne sont pas un tableau:', data)
        setAssignations([])
      }
    } catch (error) {
      console.error('Erreur lors du chargement des assignations:', error)
      setAssignations([])
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


  // Enrichir les utilisateurs avec leurs assignations véhicules
  useEffect(() => {
    const enrichUsersWithVehicles = async () => {
      const combined: CombinedUser[] = [
        // Tous les utilisateurs (incluant les chauffeurs)
        ...users.map(user => ({
          ...user,
          role: user.role,
          source: 'users' as const
        }))
      ]
      
      // Enrichir chaque utilisateur avec son véhicule assigné
      const enrichedUsers = await Promise.all(
        combined.map(async (person) => {
          try {
            const params = new URLSearchParams()
            params.set('userId', person.id)
            
            const response = await fetch(`/api/vehicules/assignations/by-person?${params}`)
            const assignations = await response.json()
            
            const activeAssignation = assignations.find((a: any) => a.actif)
            
            return {
              ...person,
              assignedVehicle: activeAssignation?.vehicule || null
            }
          } catch (error) {
            console.error('Erreur lors de la récupération du véhicule assigné:', error)
            return person
          }
        })
      )
      
      // Trier par rôle puis nom
      enrichedUsers.sort((a, b) => {
        const roleOrder = { 'Admin': 1, 'Planner': 2, 'Chauffeur': 3 }
        const roleCompare = roleOrder[a.role] - roleOrder[b.role]
        if (roleCompare !== 0) return roleCompare
        return (a.nom + a.prenom).localeCompare(b.nom + b.prenom)
      })
      
      setCombinedUsers(enrichedUsers)
    }

    if (users.length > 0) {
      enrichUsersWithVehicles()
    }
  }, [users])

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

  const handleSaveChauffeur = async (chauffeurData: Chauffeur) => {
    try {
      const url = chauffeurModal.mode === 'create' 
        ? '/api/chauffeurs' 
        : `/api/chauffeurs/${chauffeurData.id}`
        
      const method = chauffeurModal.mode === 'create' ? 'POST' : 'PUT'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(chauffeurData)
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erreur lors de la sauvegarde')
      }
      
      await fetchChauffeurs()
      setChauffeurModal({ isOpen: false, mode: 'create', chauffeur: null })
    } catch (error) {
      console.error('Erreur:', error)
      throw error
    }
  }

  const handleDeleteChauffeur = async (chauffeurId: string) => {
    try {
      const response = await fetch(`/api/chauffeurs/${chauffeurId}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erreur lors de la suppression')
      }
      
      await fetchChauffeurs()
      setDeleteChauffeurModal({ isOpen: false, chauffeur: null })
    } catch (error) {
      console.error('Erreur:', error)
      throw error
    }
  }

  const handleAssignVehicule = async (assignationData: any) => {
    try {
      const response = await fetch('/api/vehicules/assignations/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(assignationData)
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erreur lors de l\'assignation')
      }
      
      // Recharger les données
      await fetchChauffeurs()
      await fetchUsers()
      await fetchVehicules()
      await fetchAssignations()
      setAssignationModal({ isOpen: false, chauffeur: null, user: null })
    } catch (error) {
      console.error('Erreur:', error)
      throw error
    }
  }

  const handleAssignVehicleFromCard = (vehicule: Vehicule) => {
    console.log('📝 Assignation véhicule depuis card:', vehicule.immatriculation)
    setVehicleAssignModal({ 
      isOpen: true, 
      vehicule: vehicule
    })
  }

  const handleUnassignVehicle = async (vehicule: Vehicule) => {
    const assignation = vehicule.assignations?.find(a => a.actif)
    if (!assignation) return

    const assignedTo = assignation.chauffeur ? 
      `${assignation.chauffeur.nom.toUpperCase()}, ${assignation.chauffeur.prenom}` :
      `${assignation.user.nom.toUpperCase()}, ${assignation.user.prenom}`

    if (confirm(`Désassigner ${vehicule.marque} ${vehicule.modele} de ${assignedTo} ?`)) {
      try {
        console.log('🔄 Désassignation véhicule:', vehicule.immatriculation, 'de', assignedTo)
        
        const response = await fetch(`/api/vehicules/assignations/${assignation.id}`, {
          method: 'DELETE'
        })
        
        if (!response.ok) {
          let errorMessage = 'Erreur lors de la désassignation'
          try {
            const error = await response.json()
            errorMessage = error.error || errorMessage
          } catch {
            // Si ce n'est pas du JSON, utiliser le texte de la réponse
            const textError = await response.text()
            console.error('Réponse non-JSON reçue:', textError)
            if (textError.includes('<!DOCTYPE')) {
              errorMessage = `Erreur serveur (${response.status})`
            } else {
              errorMessage = textError || errorMessage
            }
          }
          throw new Error(errorMessage)
        }
        
        console.log('✅ Véhicule désassigné avec succès')
        
        // Recharger les données
        await fetchVehicules()
        await fetchAssignations()
        await fetchChauffeurs()
        await fetchUsers()
      } catch (error) {
        console.error('❌ Erreur lors de la désassignation:', error)
        alert('Erreur lors de la désassignation du véhicule')
      }
    }
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      <PageHeader title="Paramètres" />

      <div className="flex-1 p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
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
                                  
                                  {(() => {
                                    const assignationActive = vehicule.assignations?.find(a => a.actif)
                                    
                                    if (assignationActive) {
                                      const assignedTo = assignationActive.chauffeur ? 
                                        `${assignationActive.chauffeur.nom.toUpperCase()}, ${assignationActive.chauffeur.prenom}` :
                                        `${assignationActive.user.nom.toUpperCase()}, ${assignationActive.user.prenom}`
                                      
                                      const role = assignationActive.chauffeur ? 'Chauffeur' : assignationActive.user.role
                                      
                                      return (
                                        <p className="text-xs text-green-600 flex items-center gap-1">
                                          <User className="h-3 w-3" />
                                          Assigné à: {assignedTo} ({role})
                                        </p>
                                      )
                                    } else {
                                      return (
                                        <p className="text-xs text-muted-foreground">
                                          Non assigné
                                        </p>
                                      )
                                    }
                                  })()}
                                </div>
                              </div>
                              
                              <div className="flex gap-2">
                                {/* Bouton d'assignation/désassignation */}
                                {(() => {
                                  const assignationActive = vehicule.assignations?.find(a => a.actif)
                                  
                                  if (assignationActive) {
                                    // Véhicule assigné - bouton de désassignation
                                    return (
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        title="Désassigner ce véhicule"
                                        onClick={() => handleUnassignVehicle(vehicule)}
                                        className="text-red-600 hover:text-red-700 hover:border-red-300"
                                      >
                                        <UserRoundMinus className="h-4 w-4" />
                                      </Button>
                                    )
                                  } else {
                                    // Véhicule libre - bouton d'assignation
                                    return (
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        title="Assigner ce véhicule"
                                        onClick={() => handleAssignVehicleFromCard(vehicule)}
                                        className="text-green-600 hover:text-green-700 hover:border-green-300"
                                      >
                                        <UserPlus className="h-4 w-4" />
                                      </Button>
                                    )
                                  }
                                })()}
                                
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
                  Suivi des assignations véhicule-personne (chauffeurs, admins, planneurs)
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
                    {!Array.isArray(assignations) || assignations.length === 0 ? (
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
                                    {assignation.chauffeur ? 
                                      `${assignation.chauffeur.nom.toUpperCase()}, ${assignation.chauffeur.prenom}` :
                                      `${assignation.user.nom.toUpperCase()}, ${assignation.user.prenom}`
                                    }
                                  </span>
                                  <Badge variant="outline" className="ml-2">
                                    {assignation.chauffeur ? 'Chauffeur' : assignation.user?.role}
                                  </Badge>
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
                      Gérer tous les utilisateurs : admins, planneurs et chauffeurs
                    </CardDescription>
                  </div>
                  <Button onClick={() => setUserModal({ isOpen: true, mode: 'create', user: null })}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nouvel utilisateur
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {(loadingUsers || loadingChauffeurs) ? (
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
                    {combinedUsers.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Users className="h-12 w-12 mx-auto mb-4 opacity-20" />
                        <p>Aucune personne enregistrée</p>
                      </div>
                    ) : (
                      combinedUsers.map((person) => {
                        const getRoleIcon = (role: string) => {
                          switch (role) {
                            case 'Admin': return <Shield className="h-4 w-4" />
                            case 'Planner': return <User className="h-4 w-4" />
                            case 'Chauffeur': return <Car className="h-4 w-4" />
                            default: return <User className="h-4 w-4 text-gray-500" />
                          }
                        }

                        const getRoleBadge = (role: string) => {
                          switch (role) {
                            case 'Admin': return <Badge variant="destructive">Admin</Badge>
                            case 'Planner': return <Badge variant="default">Planner</Badge>
                            case 'Chauffeur': return <Badge variant="secondary">Chauffeur</Badge>
                            default: return <Badge variant="outline">{role}</Badge>
                          }
                        }

                        const getStatutBadge = (statut?: string) => {
                          if (!statut) return null
                          switch (statut) {
                            case 'DISPONIBLE': return <Badge variant="default" className="bg-green-100 text-green-800 ml-2">Disponible</Badge>
                            case 'OCCUPE': return <Badge variant="secondary" className="bg-orange-100 text-orange-800 ml-2">Occupé</Badge>
                            case 'HORS_SERVICE': return <Badge variant="outline" className="bg-red-100 text-red-800 ml-2">Hors service</Badge>
                            default: return null
                          }
                        }

                        return (
                          <div key={`${person.source}-${person.id}`} className="border rounded-lg p-4">
                            <div className="flex justify-between items-start">
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  {getRoleIcon(person.role)}
                                  <h3 className="font-semibold">
                                    {person.nom.toUpperCase()}, {person.prenom}
                                  </h3>
                                  {getRoleBadge(person.role)}
                                  {getStatutBadge(person.statut)}
                                  {!person.actif && <Badge variant="outline" className="ml-2">Inactif</Badge>}
                                </div>
                                <div className="space-y-1">
                                  <p className="text-sm text-muted-foreground flex items-center flex-wrap gap-x-2">
                                    {person.email && (<><Mail className="h-4 w-4 inline" />{person.email}</>)}
                                    {person.telephone && (<><span className="mx-1">•</span><Phone className="h-4 w-4 inline" />{person.telephone}</>)}
                                  </p>
                                  {person.assignedVehicle && (
                                    <p className="text-xs text-blue-600 flex items-center gap-1 mt-1">
                                      <Car className="h-3 w-3" />
                                      Véhicule assigné: {person.assignedVehicle.marque} {person.assignedVehicle.modele} ({person.assignedVehicle.immatriculation})
                                    </p>
                                  )}
                                  <p className="text-xs text-muted-foreground">
                                    {person.role === 'Chauffeur' && person.source === 'chauffeurs' ? 'Chauffeur' : 'Utilisateur'} depuis le {new Date(person.createdAt).toLocaleDateString('fr-FR')}
                                  </p>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                {/* Tous les utilisateurs peuvent avoir un véhicule assigné */}
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  title="Assigner un véhicule"
                                  onClick={() => setAssignationModal({ 
                                    isOpen: true, 
                                    chauffeur: person.source === 'chauffeurs' ? chauffeurs.find(c => c.id === person.id) : null,
                                    user: person.source === 'users' ? users.find(u => u.id === person.id) : null
                                  })}
                                >
                                  <Car className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => {
                                    if (person.source === 'users') {
                                      const user = users.find(u => u.id === person.id)
                                      setUserModal({ isOpen: true, mode: 'edit', user })
                                    } else {
                                      const chauffeur = chauffeurs.find(c => c.id === person.id)
                                      setChauffeurModal({ isOpen: true, mode: 'edit', chauffeur })
                                    }
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => {
                                    if (person.source === 'users') {
                                      const user = users.find(u => u.id === person.id)
                                      setDeleteUserModal({ isOpen: true, user })
                                    } else {
                                      const chauffeur = chauffeurs.find(c => c.id === person.id)
                                      setDeleteChauffeurModal({ isOpen: true, chauffeur })
                                    }
                                  }}
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
            {/* Entreprise & Identité */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Informations de l'entreprise
                </CardTitle>
                <CardDescription>
                  Identité et coordonnées de votre société de taxi
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Nom de la société</Label>
                    <Input defaultValue="Taxis Excellence" />
                  </div>
                  <div className="space-y-2">
                    <Label>SIRET</Label>
                    <Input placeholder="123 456 789 01234" />
                  </div>
                </div>
                
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Téléphone principal</Label>
                    <Input placeholder="01.23.45.67.89" />
                  </div>
                  <div className="space-y-2">
                    <Label>Email de contact</Label>
                    <Input type="email" placeholder="contact@taxi-excellence.fr" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Adresse</Label>
                  <Textarea 
                    placeholder="123 Rue de la République
75001 Paris" 
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Configuration Opérationnelle */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Car className="h-5 w-5" />
                  Configuration opérationnelle
                </CardTitle>
                <CardDescription>
                  Paramètres de fonctionnement quotidien
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Horaires */}
                <div className="space-y-4">
                  <h4 className="font-medium">Horaires de service</h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Ouverture</Label>
                      <Input type="time" defaultValue="06:00" />
                    </div>
                    <div className="space-y-2">
                      <Label>Fermeture</Label>
                      <Input type="time" defaultValue="23:00" />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="service24h" />
                    <Label htmlFor="service24h">Service 24h/24</Label>
                  </div>
                </div>

                <Separator />

                {/* Tarification */}
                <div className="space-y-4">
                  <h4 className="font-medium">Tarification</h4>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label>Prise en charge (€)</Label>
                      <Input type="number" step="0.50" defaultValue="4.20" />
                    </div>
                    <div className="space-y-2">
                      <Label>Prix/km jour (€)</Label>
                      <Input type="number" step="0.01" defaultValue="1.15" />
                    </div>
                    <div className="space-y-2">
                      <Label>Prix/km nuit (€)</Label>
                      <Input type="number" step="0.01" defaultValue="1.50" />
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Heure début tarif nuit</Label>
                      <Input type="time" defaultValue="20:00" />
                    </div>
                    <div className="space-y-2">
                      <Label>Heure fin tarif nuit</Label>
                      <Input type="time" defaultValue="07:00" />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Temps & Distances */}
                <div className="space-y-4">
                  <h4 className="font-medium">Temps & distances</h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Durée moyenne course (min)</Label>
                      <Input type="number" defaultValue="45" />
                    </div>
                    <div className="space-y-2">
                      <Label>Distance maximale (km)</Label>
                      <Input type="number" defaultValue="100" />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="confirmationAuto" defaultChecked />
                    <Label htmlFor="confirmationAuto">Confirmation automatique des courses</Label>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notifications & Communications */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  Notifications & Communications
                </CardTitle>
                <CardDescription>
                  Configuration des alertes et communications automatiques
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* SMS */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Notifications SMS</h4>
                      <p className="text-sm text-muted-foreground">Envoyer des SMS automatiques aux clients</p>
                    </div>
                    <Switch id="smsEnabled" />
                  </div>
                  
                  <div className="ml-6 space-y-3">
                    <div className="flex items-center space-x-2">
                      <Switch id="smsConfirmation" />
                      <Label htmlFor="smsConfirmation">Confirmation de réservation</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="smsArrivee" />
                      <Label htmlFor="smsArrivee">Arrivée du chauffeur (5 min avant)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="smsFacture" />
                      <Label htmlFor="smsFacture">Récapitulatif fin de course</Label>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Email */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Notifications Email</h4>
                      <p className="text-sm text-muted-foreground">Rapports et notifications par email</p>
                    </div>
                    <Switch id="emailEnabled" />
                  </div>
                  
                  <div className="ml-6 space-y-3">
                    <div className="flex items-center space-x-2">
                      <Switch id="emailRapportQuotidien" />
                      <Label htmlFor="emailRapportQuotidien">Rapport quotidien d'activité</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="emailAlertes" />
                      <Label htmlFor="emailAlertes">Alertes véhicules (entretien, contrôle technique)</Label>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Système & Sauvegardes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Système & Données
                </CardTitle>
                <CardDescription>
                  Configuration système et gestion des données
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Fuseau horaire</Label>
                    <Select defaultValue="Europe/Paris">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Europe/Paris">Europe/Paris (UTC+1)</SelectItem>
                        <SelectItem value="Europe/London">Europe/London (UTC+0)</SelectItem>
                        <SelectItem value="America/New_York">America/New_York (UTC-5)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Devise</Label>
                    <Select defaultValue="EUR">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="EUR">Euro (€)</SelectItem>
                        <SelectItem value="USD">Dollar ($)</SelectItem>
                        <SelectItem value="GBP">Livre (£)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Sauvegarde automatique</p>
                      <p className="text-sm text-muted-foreground">Sauvegarde quotidienne des données</p>
                    </div>
                    <Switch id="autoBackup" defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Dernière sauvegarde</p>
                      <p className="text-sm text-muted-foreground">Aujourd'hui à 03:00</p>
                    </div>
                    <Button variant="outline" size="sm">
                      Sauvegarder maintenant
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
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
      
      {/* Modales chauffeurs */}
      <ChauffeurModal
        isOpen={chauffeurModal.isOpen}
        onClose={() => setChauffeurModal({ isOpen: false, mode: 'create', chauffeur: null })}
        onSave={handleSaveChauffeur}
        chauffeur={chauffeurModal.chauffeur}
        mode={chauffeurModal.mode}
      />
      
      <DeleteChauffeurModal
        isOpen={deleteChauffeurModal.isOpen}
        onClose={() => setDeleteChauffeurModal({ isOpen: false, chauffeur: null })}
        onDelete={handleDeleteChauffeur}
        chauffeur={deleteChauffeurModal.chauffeur}
      />
      
      {/* Modale assignation véhicule */}
      <VehiculeAssignationModal
        isOpen={assignationModal.isOpen}
        onClose={() => setAssignationModal({ isOpen: false, chauffeur: null, user: null })}
        onAssign={handleAssignVehicule}
        chauffeur={assignationModal.chauffeur}
        user={assignationModal.user}
      />
      
      {/* Modale assignation depuis véhicule */}
      <VehicleAssignModal
        isOpen={vehicleAssignModal.isOpen}
        onClose={() => setVehicleAssignModal({ isOpen: false, vehicule: null })}
        onAssign={handleAssignVehicule}
        vehicule={vehicleAssignModal.vehicule}
      />
    </div>
  )
}